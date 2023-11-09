import { KVNamespace } from '@cloudflare/workers-types';
import {
  importPKCS8,
  jwtVerify,
  createLocalJWKSet,
  KeyLike,
  JSONWebKeySet,
} from 'jose';
import { IdToken } from '@atomicjolt/lti-server/types';
import { ALGORITHM, generateKeySet, keySetsToJwks, fetchRemoteJwks } from '@atomicjolt/lti-server';
import { getJwkServer } from './platforms';
import type { IdTokenResult, KeySet } from '@atomicjolt/lti-server/types';

export const JWKS_KV_KEY = 'current_jwks';

export async function getCurrentKey(jwksKV: KVNamespace): Promise<KeySet> {
  const keySets = await getKeySets(jwksKV);
  const keySet = keySets[keySets.length - 1] as KeySet;
  return keySet;
}

export async function getCurrentPrivateKey(jwksKV: KVNamespace): Promise<KeyLike> {
  const keySet = await getCurrentKey(jwksKV);
  const pri = await importPKCS8(keySet.privateKey, ALGORITHM);
  return pri;
}

export async function getKeySets(jwksKV: KVNamespace): Promise<KeySet[]> {
  let data = await jwksKV.get(JWKS_KV_KEY);
  if (data && data.length > 2) { // 2 in case jwks is '{}'
    return JSON.parse(data);
  } else {
    const keySet = await generateKeySet();
    await jwksKV.put(JWKS_KV_KEY, JSON.stringify([keySet]));
    return [keySet];
  }
}

export async function rotateKeys(jwksKV: KVNamespace): Promise<KeySet[]> {
  const keySets = await getKeySets(jwksKV);
  const keySet = await generateKeySet();
  keySets.push(keySet);

  // Remove oldest keys
  while (keySets.length > 3) {
    keySets.shift();
  }

  await jwksKV.put(JWKS_KV_KEY, JSON.stringify(keySets));
  return keySets;
}

export async function getJwks(jwksKV: KVNamespace): Promise<JSONWebKeySet> {
  const keySets = await getKeySets(jwksKV);
  return keySetsToJwks(keySets);
}

export async function verifyRemoteJwt(remoteJwksKV: KVNamespace, jwksUrl: string, jwt: string): Promise<IdTokenResult> {
  const storedJWKS = await remoteJwksKV.get(jwksUrl);
  let jwks;

  if (storedJWKS) {
    jwks = JSON.parse(storedJWKS)
  } else {
    jwks = await fetchRemoteJwks(jwksUrl);
    await remoteJwksKV.put(jwksUrl, JSON.stringify(jwks));
  }

  const localJwks = createLocalJWKSet(jwks);
  let token;

  try {
    const payload = await jwtVerify(jwt, localJwks);
    token = payload.payload as unknown as IdToken;
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code === 'ERR_JWKS_NO_MATCHING_KEY') {
      jwks = await fetchRemoteJwks(jwksUrl);
      console.log('jwks', jwks)
      await remoteJwksKV.put(jwksUrl, JSON.stringify(jwks));
      const payload = await jwtVerify(jwt, localJwks);
      token = payload.payload as unknown as IdToken;
    } else {
      throw e;
    }
  }

  const result: IdTokenResult = {
    verified: true,
    token,
    error: null,
  };
  return result;
}

export async function validateIdToken(idToken: string, jwks_kv: KVNamespace): Promise<IdTokenResult> {
  try {
    const jwksUrl = await getJwkServer(idToken);
    const idTokenResult = await verifyRemoteJwt(jwks_kv, jwksUrl, idToken);
    if (!idTokenResult.token || !idTokenResult.verified) {
      throw new Error('Invalid tool launch. Please launch the application again.');
    }
    return idTokenResult;
  } catch (error: any) {
    if (error.name === 'JWSSignatureVerificationFailed') {
      throw new Error(`Unsecured tool launch. Please launch the application again. ${error.name}: ${error.message}.`);
    }
    throw new Error(`An error occured while launching the tool. Please launch the application again. ${error.name}: ${error.message}.`);
  }
}
