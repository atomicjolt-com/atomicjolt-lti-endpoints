import { expect, it, describe, afterEach } from 'vitest';
import {
  getJwks,
  getKeySets,
  rotateKeys,
  JWKS_KV_KEY,
} from './jwt';
import { generateKeySet, keySetsToJwks, verifyJwtUsingJwks, ALGORITHM } from '@atomicjolt/lti-server';
import { genJwt } from '@atomicjolt/lti-server';

const env = getMiniflareBindings();

describe('jwt', () => {
  afterEach(async () => {
    await env.JWKS.delete(JWKS_KV_KEY);
  });

  it('calls getJwks to find a valid jwk', async () => {
    const jwks = await getJwks(env.JWKS);
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
    await env.JWKS.delete(JWKS_KV_KEY);
    const notThere = await env.JWKS.get(JWKS_KV_KEY);
    expect(notThere).toEqual(null);
    await getKeySets(env.JWKS);
    const there = await env.JWKS.get(JWKS_KV_KEY);
    expect(there?.length).toBeTruthy();
  });

  it('rotates the stored jwk keys', async () => {
    await env.JWKS.delete(JWKS_KV_KEY);

    const keySets = await getKeySets(env.JWKS);
    expect(keySets.length).toEqual(1);

    await rotateKeys(env.JWKS);
    const keySets2 = await getKeySets(env.JWKS);
    expect(keySets2.length).toEqual(2);

    const key1 = keySets[0];
    const key2 = keySets2[0];

    expect(key1?.privateKey).toEqual(key2?.privateKey);
  });

  it('rotates removes old jwk keys when rotating', async () => {
    await env.JWKS.delete(JWKS_KV_KEY);
    await getKeySets(env.JWKS);
    await rotateKeys(env.JWKS);
    await rotateKeys(env.JWKS);
    await rotateKeys(env.JWKS);
    await rotateKeys(env.JWKS);
    const keySets = await getKeySets(env.JWKS);

    const count = keySets.length;
    expect(count).toEqual(3);
  });
});
