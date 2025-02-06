import type { Context } from 'hono';
import { DeepLinkPayload } from '../types';
import { verifyToolJwt } from '../libs/tool_jwt';
import { signJwt } from '@atomicjolt/lti-server';
import { getCurrentPrivateKey } from '../models/key_sets';

export const deepLinkVersion = '1.3.0';

export enum ContentItem {
  File = 'file',
  HtmlFragment = 'html',
  Image = 'image',
  Link = 'link',
  LTIResourceLink = 'ltiResourceLink',
}

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
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingRequest',
    'https://purl.imsglobal.org/spec/lti/claim/version': deepLinkVersion,
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': jwt.deploymentId,
    'https://purl.imsglobal.org/spec/lti-dl/claim/content_items': contentItems,
    'https://purl.imsglobal.org/spec/lti-dl/claim/data': jwt?.deepLinkClaimData?.data,
  };

  const privateKeyPair = await getCurrentPrivateKey(c.env);
  const deepJwt = await signJwt(payload as any, privateKeyPair.privateKey, '1m', privateKeyPair.kid);
  const response = { jwt: deepJwt };
  const json = JSON.stringify(response);

  return c.json(json);
}
