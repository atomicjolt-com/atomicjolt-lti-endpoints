import type { ClientAuthorizationResponse } from '@atomicjolt/lti-server';
import type { EnvBindings } from '../types';

const oneMin = 60;

export async function setClientCredential(env: EnvBindings, credentialKey: string, clientAuth: ClientAuthorizationResponse) {
  await env.CLIENT_AUTH_TOKENS.put(
    credentialKey,
    JSON.stringify(clientAuth),
    { expirationTtl: clientAuth.expires_in - oneMin } // Expire the token 1 minute early so we don't use an expired token on accident
  );
}

export async function getClientCredential(env: EnvBindings, credentialKey: string): Promise<ClientAuthorizationResponse | null> {
  const res = await env.CLIENT_AUTH_TOKENS.get(credentialKey);

  if (res) {
    return JSON.parse(res) as ClientAuthorizationResponse;
  }

  return null;
}

export async function deleteClientCredential(env: EnvBindings, state: string) {
  await env.CLIENT_AUTH_TOKENS.delete(state);
}
