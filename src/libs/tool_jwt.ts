import { importPKCS8, importSPKI } from "jose";
import type { Context } from 'hono';
import { ALGORITHM, getKid, signJwt, verifyJwt } from "@atomicjolt/lti-server";
import { getCurrentKeySet, getKeySet } from "../models/key_sets";
import { EnvBindings } from "../../types";
import { ToolJwt } from "@atomicjolt/lti-server/types";
import { DEEP_LINKING_CLAIM, DEPLOYMENT_ID, DeepLinkingClaim, IdToken, NAMES_AND_ROLES_CLAIM, } from '@atomicjolt/lti-types';
import { clientId } from '@atomicjolt/lti-client';

export async function verifyToolJwt<T extends ToolJwt>(c: Context): Promise<T | null> {
  const auth = c.req.header('Authorization') as string;
  const jwt = auth.replace('Bearer ', '');
  const iss = (new URL(c.req.url)).host;
  const aud = iss;
  const kid = getKid(jwt);

  if (!kid) {
    return null;
  }
  const keySet = await getKeySet(c.env, kid);

  if (!keySet) {
    return null;
  }

  const publicKey = await importSPKI(keySet.publicKey, ALGORITHM, { extractable: true });
  const payload = await verifyJwt(jwt, publicKey, iss, aud);

  return payload as T;
}

export async function signToolJwt<T extends ToolJwt>(env: EnvBindings, toolJwt: T, expiresIn: string = '1h'): Promise<string> {
  const keySetPair = await getCurrentKeySet(env);
  const privateKey = await importPKCS8(keySetPair.keySet.privateKey, ALGORITHM);
  const signed = await signJwt(toolJwt, privateKey, expiresIn, keySetPair.kid);
  return signed;
}

export async function getBasicToolJwt<T extends ToolJwt>(c: Context, idToken: IdToken): Promise<T> {
  const iss = idToken['iss'];
  const host = (new URL(c.req.url)).host;
  const deepLinkClaimData = idToken[DEEP_LINKING_CLAIM];
  const toolJwt = getDefaultToolJwt(
    clientId(idToken),
    idToken[DEPLOYMENT_ID],
    host,
    idToken.sub,
    iss,
    idToken[NAMES_AND_ROLES_CLAIM]?.context_memberships_url,
    deepLinkClaimData,
  ) as T;

  return toolJwt as T;
}

export function getDefaultToolJwt<T extends ToolJwt>(
  clientId: string,
  deploymentId: string,
  iss: string,
  sub: string,
  platformIss: string,
  namesAndRolesEndpointUrl: string | undefined,
  deepLinkClaimData: DeepLinkingClaim | undefined,
): T {
  const toolJwt: ToolJwt = {
    clientId,
    deploymentId,
    iss,
    aud: iss,
    sub,
    exp: (Date.now() / 1000) + (60 * 60), // 1 hour from now
    iat: Date.now() / 1000,
    namesAndRolesEndpointUrl,
    platformIss,
    deepLinkClaimData,
  };
  return toolJwt as T;
}
