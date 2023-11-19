import type { Context } from 'hono';
export type ToolJwt = {
    client_id: string;
    deployment_id: string;
    iss: string;
    sub: string;
    exp: number;
    iat: number;
    names_and_roles_endpoint_url?: string;
    platform_iss: string;
    deep_link_claim_data?: string;
};
export declare function verifyToolJwt(c: Context): Promise<ToolJwt>;
//# sourceMappingURL=tool_jwt.d.ts.map