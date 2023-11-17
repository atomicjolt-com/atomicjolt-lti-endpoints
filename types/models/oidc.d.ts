import type { OIDCState } from '@atomicjolt/lti-server/types';
import type { EnvBindings } from '../../types';
export declare function setOIDC(env: EnvBindings, oidcState: OIDCState): Promise<void>;
export declare function getOIDC(env: EnvBindings, state: string): Promise<OIDCState>;
export declare function deleteOIDC(env: EnvBindings, state: string): Promise<void>;
//# sourceMappingURL=oidc.d.ts.map