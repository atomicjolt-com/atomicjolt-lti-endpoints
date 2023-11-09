import type { Context } from 'hono';
import type { OIDCState } from '@atomicjolt/lti-server/types';
export declare function setOIDC(c: Context, oidcState: OIDCState): Promise<void>;
export declare function getOIDC(c: Context, state: string): Promise<OIDCState>;
//# sourceMappingURL=oidc.d.ts.map