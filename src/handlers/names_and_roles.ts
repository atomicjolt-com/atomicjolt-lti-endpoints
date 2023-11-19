import type { Context } from 'hono';
import type { MembershipContainer } from '@atomicjolt/lti-types';

export interface NamesAndRolesResponse {
  result: MembershipContainer;
  relNext: string | null;
  relDifferences: string | null;
}


export async function handleNamesAndRoles(c: Context): Promise<NamesAndRolesResponse> {
  //verifyToolJwt(c);
  const apiToken = c.req.query('apiToken') as string;
  const contextMembershipsUrl = c.req.query('contextMembershipsUrl') as string;

  const role = c.req.query('role') as string;
  const limit = c.req.query('limit') as string;
  const rlid = c.req.query('rlid') as string;

  const query = new URLSearchParams({
    role,
    limit,
    rlid,
  });
  const url = new URL(contextMembershipsUrl);
  url.search = query.toString();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.ims.lti-nrps.v2.membershipcontainer+json',
      'Authorization': `Bearer ${apiToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  const result: MembershipContainer = await response.json();
  const relNext = response.headers.get('rel="next"') || null;
  const relDifferences = response.headers.get('rel="differences"') || null;

  const namesAndRolesResponse: NamesAndRolesResponse = {
    result,
    relNext,
    relDifferences,
  };

  return namesAndRolesResponse;
}