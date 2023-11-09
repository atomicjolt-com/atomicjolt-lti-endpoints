import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import type { LaunchSettings } from '@atomicjolt/lti-client/types';
import { IdToken } from '@atomicjolt/lti-types';
import type { IdTokenResult, LTIRequestBody } from '@atomicjolt/lti-server/types';
import { getLtiStorageParams } from '@atomicjolt/lti-server';
import { OPEN_ID_COOKIE_PREFIX } from '@atomicjolt/lti-server';
import { validateIdTokenContents } from '@atomicjolt/lti-server';
import { validateRequest } from '../libs/validate';
import launchHtml from '../html/launch_html';
import { getPlatformOIDCUrl } from '../libs/platforms';


export async function handleLaunch(c: Context, hashedScriptName: string): Promise<Response> {
  const body = (await c.req.parseBody()) as unknown as LTIRequestBody;
  let idTokenResult: IdTokenResult;

  try {
    idTokenResult = await validateRequest(c, body.state, body.id_token);
    if (!idTokenResult || !idTokenResult.token) {
      throw new Error('Missing LTI token.');
    }
  } catch (e) {
    const res = new Response((e as Error).message, {
      status: 401,
    });
    throw new HTTPException(401, { res });
  }

  // Remove the state from the KV store
  await c.env.OIDC.delete(body.state);

  // Check to see if a cookie exists for the state
  let stateVerified = false;
  const validCookie = getCookie(c, `${OPEN_ID_COOKIE_PREFIX}${body.state}`);
  if (validCookie) {
    stateVerified = true;
  }

  if (!idTokenResult.token) {
    return new Response('Missing LTI token.', {
      status: 401,
    });
  }

  const requestedTargetLinkUri = c.req.url;
  const errors = validateIdTokenContents(idTokenResult.token, requestedTargetLinkUri, true);
  if (errors.length > 0) {
    const message = `Invalid LTI token: ${errors.join(', ')}.`;
    return new Response(message, {
      status: 401,
    });
  }

  const iss = idTokenResult.token['iss'];
  const platformOIDCUrl = getPlatformOIDCUrl(iss);
  if (!platformOIDCUrl) {
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

  const ltiStorageParams = getLtiStorageParams(platformOIDCUrl, target);

  const settings: LaunchSettings = {
    stateVerified,
    idToken: idTokenResult.token as IdToken,
    state: body.state,
    ltiStorageParams,
  };

  return c.html(launchHtml(settings, hashedScriptName));
}
