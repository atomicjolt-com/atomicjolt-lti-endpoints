import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import type { LaunchSettings } from '@atomicjolt/lti-client/types';
import { DEEP_LINKING_CLAIM, IdToken, PlatformConfiguration } from '@atomicjolt/lti-types';
import type { LTIRequestBody, } from '@atomicjolt/lti-server';
import {
  getLtiStorageParams,
  OPEN_ID_COOKIE_PREFIX,
  validateIdTokenContents
} from '@atomicjolt/lti-server';
import { validateRequest } from '../libs/validate';
import launchHtml from '../html/launch_html';
import { getPlatform } from '../models/platforms';
import { deleteOIDC } from '../models/oidc';

export async function validateLaunchRequest(c: Context, getToolJwt: Function): Promise<LaunchSettings> {
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
    throw new HTTPException(401, { message: 'Missing LTI token.' });
  }

  const requestedTargetLinkUri = c.req.url;
  const errors = validateIdTokenContents(idToken, requestedTargetLinkUri, true);
  if (errors.length > 0) {
    const message = `Invalid LTI token: ${errors.join(', ')}.`;
    throw new HTTPException(401, { message });
  }

  const iss = idToken['iss'];
  let platform: PlatformConfiguration;
  try {
    platform = await getPlatform(c.env, iss);
  } catch (e) {
    const res = new Response((e as Error).message, {
      status: 401,
    });
    throw new HTTPException(401, { res });
  }

  if (!platform.authorization_endpoint) {
    const message = `Unable to find a platform OIDC URL matching for iss: ${iss} `;
    throw new HTTPException(401, { message });
  };

  const target = body.lti_storage_target;
  if (!target && !stateVerified) {
    const message = 'Unable to securely launch tool. Please ensure cookies are enabled';
    throw new HTTPException(401, { message });
  }

  const ltiStorageParams = getLtiStorageParams(platform.authorization_endpoint, target);
  const signed = await getToolJwt(c, idToken);

  const settings: LaunchSettings = {
    stateVerified,
    state: body.state,
    ltiStorageParams,
    jwt: signed,
    deepLinking: idToken[DEEP_LINKING_CLAIM],
  };

  return settings;
}

export async function handleLaunch(c: Context, hashedScriptName: string, getToolJwt: Function): Promise<Response> {
  const settings = await validateLaunchRequest(c, getToolJwt);
  return c.html(launchHtml(settings, hashedScriptName));
}
