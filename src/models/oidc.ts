import type { OIDCState } from '@atomicjolt/lti-server/types';
import { ALLOWED_LAUNCH_TIME } from '@atomicjolt/lti-server';
import type { EnvBindings } from '../../types';

export async function setOIDC(env: EnvBindings, oidcState: OIDCState) {
  // const id = env.OIDC_STATE.idFromName(oidcState.state);
  // const obj = env.OIDC_STATE.get(id);
  // const resp = await obj.fetch(c.req.url);
  await env.OIDC.put(
    oidcState.state,
    JSON.stringify(oidcState),
    { expirationTtl: ALLOWED_LAUNCH_TIME }
  );
}

export async function getOIDC(env: EnvBindings, state: string) {
  // const id = env.OIDC_STATE.idFromName(state);
  // const obj = env.OIDC_STATE.get(id);
  // const resp = await obj.fetch(c.req.url);
  const kvState = await env.OIDC.get(state);
  if (!kvState) {
    throw new Error('Missing LTI state. Please launch the application again.');
  }

  const oidcState = JSON.parse(kvState) as OIDCState;
  return oidcState;
}

export async function deleteOIDC(env: EnvBindings, state: string) {
  await env.OIDC.delete(state);
}
