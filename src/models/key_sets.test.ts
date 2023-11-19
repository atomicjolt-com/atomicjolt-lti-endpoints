import { expect, it, describe, afterEach } from 'vitest';
import {
  getCurrentJwks,
  getKeySets,
  rotateKeySets,
} from './key_sets';
import {
  generateKeySet,
  keySetsToJwks,
  verifyJwtUsingJwks,
  ALGORITHM,
  genJwt
} from '@atomicjolt/lti-server';
import { destroyKeySets } from '../test/state_helper';

const env = getMiniflareBindings();


describe('jwks', () => {
  afterEach(async () => {
    await destroyKeySets(env);
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
    await destroyKeySets(env);
    const value = await env.KEY_SETS.list();
    expect(value.keys.length).toEqual(0);
    await getKeySets(env);
    expect(value.keys.length).toEqual(1);
  });

  it('rotates the stored jwk keys', async () => {
    await destroyKeySets(env);

    const keySets = await getKeySets(env);
    expect(Object.keys(keySets).length).toEqual(1);

    await rotateKeySets(env);
    const keySets2 = await getKeySets(env);
    expect(Object.keys(keySets2).length).toEqual(2);

    const key1 = keySets[0];
    const key2 = keySets2[0];

    expect(key1?.privateKey).toEqual(key2?.privateKey);
  });

  it('rotates removes old jwk keys when rotating', async () => {
    await destroyKeySets(env);
    await getKeySets(env);
    await rotateKeySets(env);
    await rotateKeySets(env);
    await rotateKeySets(env);
    await rotateKeySets(env);
    const keySets = await getKeySets(env);

    const count = Object.keys(keySets).length;
    expect(count).toEqual(3);
  });
});
