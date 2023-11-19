import type { ClientAuthorizationResponse } from '@atomicjolt/lti-server/types';
import type { EnvBindings } from '../../types';

export async function setClientCredential(env: EnvBindings, clientId: string, clientAuth: ClientAuthorizationResponse) {
  await env.CLIENT_AUTH_TOKENS.put(
    clientId,
    JSON.stringify(clientAuth),
    { expirationTtl: clientAuth.expires_in }
  );
}

export async function getClientCredential(env: EnvBindings, clientId: string): Promise<ClientAuthorizationResponse | null> {
  const res = await env.CLIENT_AUTH_TOKENS.get(clientId);

  if (res) {
    return JSON.parse(res) as ClientAuthorizationResponse;
  }

  return null;
}

export async function deleteClientCredential(env: EnvBindings, state: string) {
  await env.CLIENT_AUTH_TOKENS.delete(state);
}
