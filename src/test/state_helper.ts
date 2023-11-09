import { importPKCS8, KeyLike } from 'jose';
import {
  CANVAS_PUBLIC_JWKS_URL,
  IdToken,
} from '@atomicjolt/lti-types';
import type { OIDCState } from '@atomicjolt/lti-server/types';
import { ALGORITHM, generateKeySet, keySetsToJwks, signJwt } from '@atomicjolt/lti-server';
import type { EnvBindings } from '../../types';
import { JWKS_KV_KEY } from '../libs/jwt';

export async function storeState(env: EnvBindings, state: string, nonce: string) {
  const oidcState: OIDCState = {
    state,
    nonce: nonce,
    datetime: new Date().toISOString(),
  };
  await env.OIDC.put(state, JSON.stringify(oidcState));
}

export async function setupValidState(env: EnvBindings, token: IdToken): Promise<{ state: string, body: FormData, privateKey: KeyLike }> {
  // Clean out entries
  await env.JWKS.delete(JWKS_KV_KEY);
  await env.JWKS.delete(CANVAS_PUBLIC_JWKS_URL);

  // Setup jwks for remote
  const keySet = await generateKeySet();
  const jwks = await keySetsToJwks([keySet]);
  await env.REMOTE_JWKS.put(CANVAS_PUBLIC_JWKS_URL, JSON.stringify(jwks));

  const state = crypto.randomUUID();
  await storeState(env, state, token.nonce);

  const body: FormData = new FormData();
  const privateKey = await importPKCS8(keySet.privateKey, ALGORITHM);
  const signed = await signJwt(token, privateKey);
  body.set('id_token', signed);
  body.set('state', state);
  body.set('lti_storage_target', '_parent');

  return {
    body,
    state,
    privateKey,
  };
}