import type { Context } from 'hono';
import type { MembershipContainer } from '@atomicjolt/lti-types';
export interface NamesAndRolesResponse {
    result: MembershipContainer;
    relNext: string | null;
    relDifferences: string | null;
}
export declare function handleNamesAndRoles(c: Context): Promise<NamesAndRolesResponse>;
//# sourceMappingURL=names_and_roles.d.ts.map