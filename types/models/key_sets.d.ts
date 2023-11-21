import { JSONWebKeySet } from 'jose';
import type { KeySet, KeySetMap, KeySetPair } from '@atomicjolt/lti-server/types';
import type { EnvBindings } from '../../types';
import { PrivateKeyPair } from '@atomicjolt/lti-server/types';
export declare function keyToOrdinal(kid: string): number;
export declare function getMaxKeySetId(env: EnvBindings): Promise<number>;
export declare function getKeySets(env: EnvBindings): Promise<KeySetMap>;
export declare function getKeySet(env: EnvBindings, kid: string): Promise<KeySet | null>;
export declare function setKeySet(env: EnvBindings, keySet: KeySet): Promise<KeySetPair>;
export declare function deleteKeySet(env: EnvBindings, kid: string): Promise<void>;
export declare function getCurrentKeySet(env: EnvBindings): Promise<KeySetPair>;
export declare function getCurrentPrivateKey(env: EnvBindings): Promise<PrivateKeyPair>;
export declare function rotateKeySets(env: EnvBindings): Promise<KeySetMap>;
export declare function getCurrentJwks(env: EnvBindings): Promise<JSONWebKeySet>;
//# sourceMappingURL=key_sets.d.ts.map