import type { EnvBindings } from '../../types';
import { JSONWebKeySet } from 'jose';
export declare function getRemoteJWKs(env: EnvBindings, jwksUrl: string): Promise<JSONWebKeySet | null>;
export declare function setRemoteJWKs(env: EnvBindings, url: string, jwks: JSONWebKeySet): Promise<void>;
export declare function deleteRemoteJWKs(env: EnvBindings, key: string): Promise<void>;
//# sourceMappingURL=remote_jwks.d.ts.map