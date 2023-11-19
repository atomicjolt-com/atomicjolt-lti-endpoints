import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import type { LaunchSettings } from '@atomicjolt/lti-client/types';
import { IdToken, PlatformConfiguration } from '@atomicjolt/lti-types';
import type { LTIRequestBody, } from '@atomicjolt/lti-server/types';
import {
  getLtiStorageParams,
  OPEN_ID_COOKIE_PREFIX,
  validateIdTokenContents
} from '@atomicjolt/lti-server';
import { validateRequest } from '../libs/validate';
import launchHtml from '../html/launch_html';
import { getPlatform } from '../models/platforms';
import { deleteOIDC } from '../models/oidc';

export async function handleLaunch(c: Context, hashedScriptName: string): Promise<Response> {
  const body = (await c.req.parseBody()) as unknown as LTIRequestBody;
  let idToken: IdToken;

  try {
    idToken = await validateRequest(c, body.state, body.id_token);
  } catch (e) {
    const res = new Response((e as Error).message, {
      status: 401,
    });
    throw new HTTPException(401, { res });
  }

  // Remove the state
  await deleteOIDC(c.env, body.state);

  // Check to see if a cookie exists for the state
  let stateVerified = false;
  const validCookie = getCookie(c, `${OPEN_ID_COOKIE_PREFIX}${body.state}`);
  if (validCookie) {
    stateVerified = true;
  }

  if (!idToken) {
    return new Response('Missing LTI token.', {
      status: 401,
    });
  }

  const requestedTargetLinkUri = c.req.url;
  const errors = validateIdTokenContents(idToken, requestedTargetLinkUri, true);
  if (errors.length > 0) {
    const message = `Invalid LTI token: ${errors.join(', ')}.`;
    return new Response(message, {
      status: 401,
    });
  }

  const iss = idToken['iss'];
  let platform: PlatformConfiguration;
  try {
    platform = await getPlatform(c.env, iss);
  } catch (e) {
    return new Response(e as string, {
      status: 401,
    });
  }

  if (!platform.authorization_endpoint) {
    return new Response(`Unable to find a platform OIDC URL matching for iss: ${iss} `, {
      status: 401,
    });
  };

  const target = body.lti_storage_target;
  if (!target && !stateVerified) {
    return new Response('Unable to securely launch tool. Please ensure cookies are enabled', {
      status: 401,
    });
  }

  const ltiStorageParams = getLtiStorageParams(platform.authorization_endpoint, target);

  const toolJwt = '';

  const settings: LaunchSettings = {
    stateVerified,
    idToken: idToken as IdToken,
    state: body.state,
    ltiStorageParams,
    jwt: toolJwt,
  };

  return c.html(launchHtml(settings, hashedScriptName));
}
