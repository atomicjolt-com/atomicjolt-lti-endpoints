import { KeyLike } from "jose";
import type { Context } from 'hono';
import { verifyJwt } from "@atomicjolt/lti-server";
import { getKeySets } from "../models/key_sets";

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

export async function verifyToolJwt(c: Context): Promise<ToolJwt> {
  const auth = c.req.header('Authorization') as string;
  const jwt = auth.replace('Bearer ', '');
  const iss = (new URL(c.req.url)).host;
  const aud = '';

  const keys = getKeySets(c.env);

  const secretKey = c.env.JWT_PRIVATE_KEY as KeyLike;
  const payload = await verifyJwt(jwt, secretKey, iss, aud);

  return payload as ToolJwt;
}