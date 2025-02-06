import type { Context } from 'hono';
import { NAMES_AND_ROLES_SCOPE, type MembershipContainer } from '@atomicjolt/lti-types';
import { verifyToolJwt } from '../libs/tool_jwt';
import { requestServiceTokenCached } from '../libs/client_credentials';
import { getCurrentPrivateKey } from '../models/key_sets';
import { getPlatform } from '../models/platforms';
import { parseLinkHeader } from '@atomicjolt/lti-server';
import { NamesAndRolesParams, NamesAndRolesResponse } from '../types';

export async function handleNamesAndRoles(c: Context): Promise<Response> {
  const jwt = await verifyToolJwt(c);

  if (!jwt) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const contextMembershipsUrl = jwt.namesAndRolesEndpointUrl;

  if (!contextMembershipsUrl) {
    return new Response('Missing context membership url. You might not havve access to names and roles.', {
      status: 401,
    });
  }

  const platform = await getPlatform(c.env, jwt.platformIss);

  if (!platform) {
    return new Response('Platform not found', {
      status: 401,
    });
  }

  const scopes = NAMES_AND_ROLES_SCOPE;
  const platformTokenUrl = platform.token_endpoint;
  const privateKeyPair = await getCurrentPrivateKey(c.env);

  let clientAuth;
  try {
    clientAuth = await requestServiceTokenCached(c.env, jwt.clientId,
      platformTokenUrl,
      scopes,
      privateKeyPair.kid,
      privateKeyPair.privateKey,
    );
  } catch (error) {
    return new Response(`Error: ${error}`, {
      status: 500,
    });
  }

  const params: NamesAndRolesParams = {};
  const role = c.req.query('role') as string;
  const limit = c.req.query('limit') as string;
  const rlid = c.req.query('rlid') as string;
  if (role) { params.role = role; }
  if (limit) { params.limit = role; }
  if (rlid) { params.rlid = role; }

  const query = new URLSearchParams(params as any);
  const url = new URL(contextMembershipsUrl);
  url.search = query.toString();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.ims.lti-nrps.v2.membershipcontainer+json',
      'Authorization': `Bearer ${clientAuth.access_token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${text}`);
  }

  const result: MembershipContainer = await response.json();

  const { next, differences } = parseLinkHeader(response.headers.get('Link') || '');

  const namesAndRolesResponse: NamesAndRolesResponse = {
    result,
    next,
    differences,
  };

  return c.json(JSON.stringify(namesAndRolesResponse));
}