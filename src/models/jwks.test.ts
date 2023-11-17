import { expect, it, describe, afterEach } from 'vitest';
import {
  getCurrentJwks,
  getKeySets,
  rotateKeys,
  JWKS_KEY,
} from './jwks';
import { generateKeySet, keySetsToJwks, verifyJwtUsingJwks, ALGORITHM } from '@atomicjolt/lti-server';
import { genJwt } from '@atomicjolt/lti-server';
import { deleteJWKs, getJWKs } from '../models/jwks';

const env = getMiniflareBindings();

describe('jwks', () => {
  afterEach(async () => {
    await deleteJWKs(env, JWKS_KEY);
  });

  it('calls getJwks to find a valid jwk', async () => {
    const jwks = await getCurrentJwks(env);
    expect(jwks?.keys?.[0]?.alg).toEqual(ALGORITHM);
  });

  it('signs using signJwtUsingKey and then decodes using verifyJwtUsingJwks', async () => {
    const { keySet, signed } = await genJwt();
    const jwks = await keySetsToJwks([keySet]);
    const decodedResult = await verifyJwtUsingJwks(jwks, signed);
    expect(decodedResult.verified).toEqual(true);
  });

  it('fails when the key is incorrect', async () => {
    const { signed } = await genJwt();
    const keySet = await generateKeySet();
    const jwks = await keySetsToJwks([keySet]);
    const decodedResult = await verifyJwtUsingJwks(jwks, signed);
    expect(decodedResult.verified).toEqual(false);
    expect(decodedResult.error).toEqual('JWSSignatureVerificationFailed: signature verification failed');
  });

  it('stores a new public/private key set in KV', async () => {
    await deleteJWKs(env, JWKS_KEY);
    const notThere = await env.JWKS.get(JWKS_KEY);
    expect(notThere).toEqual(null);
    await getKeySets(env);
    const there = await getJWKs(env, JWKS_KEY);
    expect(there?.length).toBeTruthy();
  });

  it('rotates the stored jwk keys', async () => {
    await deleteJWKs(env, JWKS_KEY);

    const keySets = await getKeySets(env);
    expect(keySets.length).toEqual(1);

    await rotateKeys(env);
    const keySets2 = await getKeySets(env);
    expect(keySets2.length).toEqual(2);

    const key1 = keySets[0];
    const key2 = keySets2[0];

    expect(key1?.privateKey).toEqual(key2?.privateKey);
  });

  it('rotates removes old jwk keys when rotating', async () => {
    await deleteJWKs(env, JWKS_KEY);
    await getKeySets(env);
    await rotateKeys(env);
    await rotateKeys(env);
    await rotateKeys(env);
    await rotateKeys(env);
    const keySets = await getKeySets(env);

    const count = keySets.length;
    expect(count).toEqual(3);
  });
});
