import type { ClientCredentials, ClientAuthorizationRequest, ClientAuthorizationResponse } from '@atomicjolt/lti-server/types';
import { KeyLike } from 'jose';
import { signJwt } from '@atomicjolt/lti-server';
import { EnvBindings } from '../../types';
import { getClientCredential, setClientCredential } from '../models/client_credentials';

const AUTHORIZATION_TRIES = 3;

class ClientCredentialsError extends Error { }

async function requestServiceToken(platformTokenUrl: string, token: string, scopes: string): Promise<ClientAuthorizationResponse> {
  const clientAuthorizationRequest: ClientAuthorizationRequest = {
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    scope: scopes,
    client_assertion: token,
  };

  try {
    const response = await fetch(platformTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: JSON.stringify(clientAuthorizationRequest),
    });

    if (response.status !== 200) {
      const text = await response.text();
      if (text?.toLowerCase().indexOf('rate limit') >= 0) {
        throw new ClientCredentialsError('RateLimited');
      }
      throw new ClientCredentialsError(`RequestFailed: ${text}`);
    }

    let clientAuth = await response.json() as ClientAuthorizationResponse;
    return clientAuth;
  } catch (error) {
    throw new ClientCredentialsError(`RequestFailed: ${error}`);
  }
}

export async function requestServiceTokenCached(
  env: EnvBindings,
  clientId: string,
  platformTokenUrl: string,
  scopes: string,
  kid: string,
  rsaPrivateKey: KeyLike
): Promise<ClientAuthorizationResponse> {

  // Try to get a cached token
  const clientAuth = await getClientCredential(env, clientId);
  if (clientAuth) {
    return clientAuth;
  }

  const credentials: ClientCredentials = {
    iss: clientId,
    sub: clientId,
    aud: [platformTokenUrl],
    jti: Math.random().toString(36).substring(2, 12), // Random string
  };

  const token = await signJwt(credentials, rsaPrivateKey, '1m', kid);

  let count = 0;
  let lastError = '';

  while (count < AUTHORIZATION_TRIES) {
    try {
      const clientAuth = await requestServiceToken(platformTokenUrl, token, scopes);
      await setClientCredential(env, clientId, clientAuth);
      return clientAuth;
    } catch (error) {
      if (error instanceof ClientCredentialsError && error.message === 'RateLimited') {
        lastError = error.message;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before trying again
      } else {
        throw error;
      }
    }

    count += 1;
  }

  throw new ClientCredentialsError('RequestLimitReached: ' + lastError);
}