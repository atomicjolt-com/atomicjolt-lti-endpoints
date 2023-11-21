import {
  importPKCS8,
  JSONWebKeySet,
  calculateJwkThumbprint,
  importSPKI,
  exportJWK,
} from 'jose';
import type { KeySet, KeySetMap, KeySetPair } from '@atomicjolt/lti-server/types';
import type { EnvBindings } from '../../types';
import { ALGORITHM, generateKeySet, keySetsToJwks } from '@atomicjolt/lti-server';
import { PrivateKeyPair } from '@atomicjolt/lti-server/types';

export function keyToOrdinal(kid: string): number {
  const ordinal = kid.split(':')[1];
  if (ordinal) {
    return parseInt(ordinal, 10);
  }
  return 0;
}

// Each key includes a number that is incremented each time a new key is added.
// Get the max number to determine the next key number.
export async function getMaxKeySetId(env: EnvBindings): Promise<number> {
  const value = await env.KEY_SETS.list();
  const ordinals = value.keys.map((k) => keyToOrdinal(k.name));
  if (ordinals.length > 0) {
    return Math.max(...ordinals);
  }
  return 0;
}

// Returns a mapping of kid to keyset for all available keysets
export async function getKeySets(env: EnvBindings): Promise<KeySetMap> {
  let value = await env.KEY_SETS.list();

  if (value.keys.length === 0) {
    await setKeySet(env, await generateKeySet());
    value = await env.KEY_SETS.list();
  }

  const keySetPairs = await Promise.all(
    value.keys.map(async (k) => {
      const keySet = await getKeySet(env, k.name);
      return keySet ? { kid: k.name, keySet } : null;
    })
  );

  return keySetPairs.reduce((keySetMap: KeySetMap, k) => {
    if (k) {
      keySetMap[k.kid] = k.keySet;
    }
    return keySetMap;
  }, {});
}

export async function getKeySet(env: EnvBindings, kid: string): Promise<KeySet | null> {
  const res = await env.KEY_SETS.get(kid);
  if (res) {
    const jwk = JSON.parse(res) as KeySet;
    return jwk;
  }
  return null;
}

export async function setKeySet(env: EnvBindings, keySet: KeySet): Promise<KeySetPair> {
  const pub = await importSPKI(keySet.publicKey, ALGORITHM, { extractable: true });
  const publicJwk = await exportJWK(pub);
  const thumb = await calculateJwkThumbprint(publicJwk);
  const max = await getMaxKeySetId(env);
  const kid = `${thumb}:${max + 1}`;

  await env.KEY_SETS.put(
    kid,
    JSON.stringify(keySet),
  );

  return {
    kid,
    keySet,
  };
}

export async function deleteKeySet(env: EnvBindings, kid: string) {
  await env.KEY_SETS.delete(kid);
}

// Get the keyset with the highest ordinal value. This is the current keyset.
export async function getCurrentKeySet(env: EnvBindings): Promise<KeySetPair> {
  const value = await env.KEY_SETS.list();
  const kidMap: { [key: number]: string } = {};
  const ordinals = value.keys.map((k) => {
    const ordinal = keyToOrdinal(k.name);
    kidMap[ordinal] = k.name;
    return ordinal;
  });

  if (ordinals.length > 0) {
    const max = Math.max(...ordinals);
    const kid = kidMap[max];
    if (kid) {
      const keySet = await getKeySet(env, kid);
      if (keySet) {
        return {
          kid,
          keySet,
        };
      }
    }
  }

  // If no keyset is found, generate a new one
  return await setKeySet(env, await generateKeySet());
}

export async function getCurrentPrivateKey(env: EnvBindings): Promise<PrivateKeyPair> {
  const keySetPair = await getCurrentKeySet(env);
  const privateKey = await importPKCS8(keySetPair.keySet.privateKey, ALGORITHM);
  return {
    kid: keySetPair.kid,
    privateKey,
  };
}

export async function rotateKeySets(env: EnvBindings): Promise<KeySetMap> {
  // Generate new key. This will automatically become the latest key
  const keySet = await generateKeySet();
  const storedKey = await setKeySet(env, keySet);
  const max = keyToOrdinal(storedKey.kid);

  // Remove oldest keys
  let value = await env.KEY_SETS.list();
  const promises = value.keys.map(async (k) => {
    if (keyToOrdinal(k.name) < (max - 2)) {
      await env.KEY_SETS.delete(k.name);
    }
  });

  await Promise.all(promises);

  return await getKeySets(env);
}

export async function getCurrentJwks(env: EnvBindings): Promise<JSONWebKeySet> {
  const keySetMap = await getKeySets(env);
  return keySetsToJwks(keySetMap);
}
