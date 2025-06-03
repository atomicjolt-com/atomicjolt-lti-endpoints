import type { Context } from 'hono';
import { DeepLinkPayload } from '../types';
import { verifyToolJwt } from '../libs/tool_jwt';
import { signJwt } from '@atomicjolt/lti-server';
import { getCurrentPrivateKey } from '../models/key_sets';
import {
  AcceptTypes,
  CONTENT_ITEM_CLAIM,
  DEEP_LINKING_DATA_CLAIM,
  DEPLOYMENT_ID,
  LTI_VERSION,
  LtiVersions,
  MESSAGE_TYPE,
  MessageTypes
} from '@atomicjolt/lti-types';

export const deepLinkVersion = LtiVersions.v1_3_0;

export const ContentItem = {
  HTML: 'html',
  LTIResourceLink: 'ltiResourceLink',
  Link: 'link',
  Image: 'image',
} as const;
export type ContentItem = keyof typeof AcceptTypes;

export async function handleSignDeepLink(c: Context): Promise<Response> {
  const jwt = await verifyToolJwt(c);

  if (!jwt) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const contentItems = await c.req.json() as ContentItem[];
  const nonce = crypto.randomUUID();
  const payload: DeepLinkPayload = {
    iss: jwt.clientId, // client_id
    aud: jwt.platformIss, // iss from id token
    azp: jwt.clientId, // client_id
    exp: (Date.now() / 1000) + (60 * 60), // 1 hour from now
    iat: Date.now() / 1000,
    nonce,
    [MESSAGE_TYPE]: MessageTypes.LtiDeepLinkingResponse,
    [LTI_VERSION]: deepLinkVersion,
    [DEPLOYMENT_ID]: jwt.deploymentId,
    [CONTENT_ITEM_CLAIM]: contentItems,
    [DEEP_LINKING_DATA_CLAIM]: jwt?.deepLinkClaimData?.data,
  };

  const privateKeyPair = await getCurrentPrivateKey(c.env);
  const deepJwt = await signJwt(payload as any, privateKeyPair.privateKey, '1m', privateKeyPair.kid);
  console.log(`Generated deep link JWT: ${deepJwt}`);
  const response = { jwt: deepJwt };
  const json = JSON.stringify(response);

  return c.json(json);
}
