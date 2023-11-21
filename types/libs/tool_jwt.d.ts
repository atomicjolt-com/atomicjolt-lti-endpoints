import type { Context } from 'hono';
import { EnvBindings } from "../../types";
import { ToolJwt } from "@atomicjolt/lti-server/types";
import { DeepLinkingClaim, IdToken } from '@atomicjolt/lti-types';
export declare function verifyToolJwt<T extends ToolJwt>(c: Context): Promise<T | null>;
export declare function signToolJwt<T extends ToolJwt>(env: EnvBindings, toolJwt: T, expiresIn?: string): Promise<string>;
export declare function getBasicToolJwt<T extends ToolJwt>(c: Context, idToken: IdToken): Promise<T>;
export declare function getDefaultToolJwt<T extends ToolJwt>(clientId: string, deploymentId: string, iss: string, sub: string, platformIss: string, namesAndRolesEndpointUrl: string | undefined, deepLinkClaimData: DeepLinkingClaim | undefined): T;
//# sourceMappingURL=tool_jwt.d.ts.map