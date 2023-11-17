import type { KeySet } from '@atomicjolt/lti-server/types';
import type { EnvBindings } from '../../types';
import { KeyLike, JSONWebKeySet } from 'jose';
export declare const JWKS_KEY = "current_jwks";
export declare function getJWKs(env: EnvBindings, key: string): Promise<string | null>;
export declare function setJWKs(env: EnvBindings, key: string, keySets: KeySet[]): Promise<void>;
export declare function deleteJWKs(env: EnvBindings, key: string): Promise<void>;
export declare function getCurrentKey(env: EnvBindings): Promise<KeySet>;
export declare function getCurrentPrivateKey(env: EnvBindings): Promise<KeyLike>;
export declare function getKeySets(env: EnvBindings): Promise<KeySet[]>;
export declare function rotateKeys(env: EnvBindings): Promise<KeySet[]>;
export declare function getCurrentJwks(env: EnvBindings): Promise<JSONWebKeySet>;
//# sourceMappingURL=jwks.d.ts.map