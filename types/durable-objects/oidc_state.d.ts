import type { DurableObjectState } from '@cloudflare/workers-types';
export declare class OIDCState {
    state: DurableObjectState;
    constructor(state: DurableObjectState);
    fetch(request: Request): Promise<Response>;
}
//# sourceMappingURL=oidc_state.d.ts.map