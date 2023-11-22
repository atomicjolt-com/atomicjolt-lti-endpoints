import type { ClientCredentials, ClientAuthorizationResponse } from '@atomicjolt/lti-server/types';
import { KeyLike } from 'jose';
import { ClientCredentialsError, requestServiceToken, signJwt } from '@atomicjolt/lti-server';
import { EnvBindings } from '../../types';
import { getClientCredential, setClientCredential } from '../models/client_credentials';

const AUTHORIZATION_TRIES = 3;

export async function requestServiceTokenCached(
  env: EnvBindings,
  clientId: string,
  platformTokenUrl: string,
  scopes: string,
  kid: string,
  rsaPrivateKey: KeyLike
): Promise<ClientAuthorizationResponse> {

  const credentialKey = clientId + scopes;

  // Try to get a cached token
  const clientAuth = await getClientCredential(env, credentialKey);
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
      await setClientCredential(env, credentialKey, clientAuth);
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