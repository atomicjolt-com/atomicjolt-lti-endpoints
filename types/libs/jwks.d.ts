import type { JwtValidationResult } from '@atomicjolt/lti-server/types';
import type { EnvBindings } from '../../types';
import { IdToken } from '@atomicjolt/lti-server/types';
export declare function getIss(jwt: string): string;
export declare function getJwkServer(env: EnvBindings, jwt: string): Promise<string>;
export declare function validateRemoteJwt(env: EnvBindings, jwksUrl: string, jwt: string): Promise<JwtValidationResult>;
export declare function validateIdToken(idToken: string, env: EnvBindings): Promise<IdToken>;
//# sourceMappingURL=jwks.d.ts.map