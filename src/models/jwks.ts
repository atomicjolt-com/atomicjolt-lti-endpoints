import type { KeySet } from '@atomicjolt/lti-server/types';
import type { EnvBindings } from '../../types';
import {
  importPKCS8,
  KeyLike,
  JSONWebKeySet,
} from 'jose';
import { ALGORITHM, generateKeySet, keySetsToJwks } from '@atomicjolt/lti-server';

export const JWKS_KEY = 'current_jwks';

export async function getJWKs(env: EnvBindings, key: string): Promise<string | null> {
  const jwk = await env.JWKS.get(key);
  return jwk;
}

export async function setJWKs(env: EnvBindings, key: string, keySets: KeySet[]) {
  await env.JWKS.put(key, JSON.stringify(keySets));
}

export async function deleteJWKs(env: EnvBindings, key: string) {
  await env.JWKS.delete(key);
}

export async function getCurrentKey(env: EnvBindings): Promise<KeySet> {
  const keySets = await getKeySets(env);
  const keySet = keySets[keySets.length - 1] as KeySet;
  return keySet;
}

export async function getCurrentPrivateKey(env: EnvBindings): Promise<KeyLike> {
  const keySet = await getCurrentKey(env);
  const pri = await importPKCS8(keySet.privateKey, ALGORITHM);
  return pri;
}

export async function getKeySets(env: EnvBindings): Promise<KeySet[]> {
  let data = await getJWKs(env, JWKS_KEY);
  if (data && data.length > 2) { // 2 in case jwks is '{}'
    return JSON.parse(data);
  } else {
    const keySet = await generateKeySet();
    await setJWKs(env, JWKS_KEY, [keySet]);
    return [keySet];
  }
}

export async function rotateKeys(env: EnvBindings): Promise<KeySet[]> {
  const keySets = await getKeySets(env);
  const keySet = await generateKeySet();
  keySets.push(keySet);

  // Remove oldest keys
  while (keySets.length > 3) {
    keySets.shift();
  }

  await setJWKs(env, JWKS_KEY, keySets);
  return keySets;
}

export async function getCurrentJwks(env: EnvBindings): Promise<JSONWebKeySet> {
  const keySets = await getKeySets(env);
  return keySetsToJwks(keySets);
}
