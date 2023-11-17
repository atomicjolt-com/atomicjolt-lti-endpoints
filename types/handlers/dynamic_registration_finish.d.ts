import type { Context } from 'hono';
export type SecureJsonHeaders = {
    'Content-Type': string;
    Accept: string;
    AUTHORIZATION?: string;
};
export declare function handleDynamicRegistrationFinish(c: Context, getToolConfiguration: Function): Promise<Response>;
//# sourceMappingURL=dynamic_registration_finish.d.ts.map