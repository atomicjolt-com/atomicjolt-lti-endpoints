import type { OIDCState } from '@atomicjolt/lti-server';
import type { EnvBindings } from '../types';
import { OIDCStateDurableObject } from '../durable/oidc_state';

export async function setOIDC(env: EnvBindings, oidcState: OIDCState) {
  const id = env.OIDC_STATE.idFromName(oidcState.state);
  const obj = env.OIDC_STATE.get(id) as unknown as OIDCStateDurableObject;
  await obj.set(oidcState);
}

export async function getOIDC(env: EnvBindings, state: string): Promise<OIDCState> {
  const id = env.OIDC_STATE.idFromName(state);
  const obj = env.OIDC_STATE.get(id) as unknown as OIDCStateDurableObject;
  const oidcState = await obj.get();
  return oidcState;
}

export async function deleteOIDC(env: EnvBindings, state: string) {
  const id = env.OIDC_STATE.idFromName(state);
  const obj = env.OIDC_STATE.get(id) as unknown as OIDCStateDurableObject;
  await obj.destroy();
}
