import type { Context } from 'hono';
import type { LaunchSettings } from '@atomicjolt/lti-client/types';
export declare function validateLaunchRequest(c: Context, getToolJwt: Function): Promise<LaunchSettings>;
export declare function handleLaunch(c: Context, hashedScriptName: string, getToolJwt: Function): Promise<Response>;
//# sourceMappingURL=launch.d.ts.map