import { importPKCS8, KeyLike } from 'jose';
import {
  CANVAS_PUBLIC_JWKS_URL,
  IdToken,
} from '@atomicjolt/lti-types';
import type { OIDCState } from '@atomicjolt/lti-server/types';
import { ALGORITHM, generateKeySet, keySetsToJwks, signJwt } from '@atomicjolt/lti-server';
import type { EnvBindings } from '../../types';
import { deleteKeySet, getKeySets } from '../models/key_sets';
import { setOIDC } from '../models/oidc';
import { setRemoteJWKs } from '../models/remote_jwks';

export async function storeState(env: EnvBindings, state: string, nonce: string) {
  const oidcState: OIDCState = {
    state,
    nonce: nonce,
    datetime: new Date().toISOString(),
  };
  await setOIDC(env, oidcState);
}

export async function destroyKeySets(env: EnvBindings): Promise<void[]> {
  const keySetMap = await getKeySets(env);
  const promises = Object.keys(keySetMap).map(async (kid) => {
    await deleteKeySet(env, kid);
  });
  return Promise.all(promises);
}


export async function setupValidState(env: EnvBindings, token: IdToken): Promise<{ state: string, body: FormData, privateKey: KeyLike }> {
  // Clean out entries
  await destroyKeySets(env);

  await deleteKeySet(env, CANVAS_PUBLIC_JWKS_URL);

  // Setup jwks for remote
  const keySet = await generateKeySet();
  const jwks = await keySetsToJwks([keySet]);
  await setRemoteJWKs(env, CANVAS_PUBLIC_JWKS_URL, jwks);

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