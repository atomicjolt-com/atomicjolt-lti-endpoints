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
  try {
    const obj = env.OIDC_STATE.get(id) as unknown as OIDCStateDurableObject;
    const oidcState = await obj.get();
    return oidcState;
  } catch (e) {
    throw new Error('Missing LTI state. Please launch the application again.');
  }
}

export async function deleteOIDC(env: EnvBindings, state: string) {
  const id = env.OIDC_STATE.idFromName(state);
  try {
    const obj = env.OIDC_STATE.get(id) as unknown as OIDCStateDurableObject;
    if (!obj) {
      return;
    }
    await obj.destroy();
  } catch (e) {
    // No need to throw an error if the object is not found
    console.warn('deleteOIDC error can be ignored:', e);
  }
}
