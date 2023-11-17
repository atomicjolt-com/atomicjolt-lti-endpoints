import type { Context } from 'hono';
import type { ToolConfiguration } from '@atomicjolt/lti-types';
export type SecureJsonHeaders = {
    'Content-Type': string;
    Accept: string;
    AUTHORIZATION?: string;
};
export declare function handleDynamicRegistrationFinish(c: Context, toolConfiguration: ToolConfiguration, handlePlatformResponse: Function): Promise<Response>;
//# sourceMappingURL=dynamic_registration_finish.d.ts.map