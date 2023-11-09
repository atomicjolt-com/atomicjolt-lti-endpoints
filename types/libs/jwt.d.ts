import { KVNamespace } from '@cloudflare/workers-types';
import { KeyLike, JSONWebKeySet } from 'jose';
import type { IdTokenResult, KeySet } from '@atomicjolt/lti-server/types';
export declare const JWKS_KV_KEY = "current_jwks";
export declare function getCurrentKey(jwksKV: KVNamespace): Promise<KeySet>;
export declare function getCurrentPrivateKey(jwksKV: KVNamespace): Promise<KeyLike>;
export declare function getKeySets(jwksKV: KVNamespace): Promise<KeySet[]>;
export declare function rotateKeys(jwksKV: KVNamespace): Promise<KeySet[]>;
export declare function getJwks(jwksKV: KVNamespace): Promise<JSONWebKeySet>;
export declare function verifyRemoteJwt(remoteJwksKV: KVNamespace, jwksUrl: string, jwt: string): Promise<IdTokenResult>;
export declare function validateIdToken(idToken: string, jwks_kv: KVNamespace): Promise<IdTokenResult>;
//# sourceMappingURL=jwt.d.ts.map