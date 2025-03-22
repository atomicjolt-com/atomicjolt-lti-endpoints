import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { buildInit } from '@atomicjolt/lti-server';
import { OPEN_ID_COOKIE_PREFIX, OPEN_ID_STORAGE_COOKIE } from '@atomicjolt/lti-server';
import { getPlatform } from '../models/platforms';
import initHtml from '../html/init_html';
import { setOIDC } from '../models/oidc';
import { PlatformConfiguration } from '@atomicjolt/lti-types';
import { LTIInitBody } from '@atomicjolt/lti-server';

function writeCookie(c: Context, name: string, value: string, maxAge: number) {
  setCookie(c, name, value, {
    path: '/',
    secure: true,
    httpOnly: false,
    maxAge: maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
    sameSite: 'None',
    partitioned: true,
  });
}

async function handleInit(c: Context, hashedScriptName: string): Promise<Response> {
  const requestUrl = c.req.url;
  const body = (await c.req.parseBody()) as unknown as LTIInitBody;

  if (body.iss === null) {
    return new Response('Request is missing required field iss', {
      status: 401,
    });
  }

  let platform: PlatformConfiguration;
  try {
    platform = await getPlatform(c.env, body.iss);
  } catch (e) {
    return new Response(e as string, {
      status: 401,
    });
  }

  const { oidcState, url, settings } = buildInit(
    requestUrl,
    body.client_id,
    body.login_hint,
    body.lti_message_hint,
    body.lti_storage_target,
    platform.authorization_endpoint
  );

  await setOIDC(c.env, oidcState);

  writeCookie(c, OPEN_ID_STORAGE_COOKIE, '1', 356 * 24 * 60 * 60);
  writeCookie(c, `${OPEN_ID_COOKIE_PREFIX}${oidcState.state}`, '1', 60);

  const canUseCookies = getCookie(c, OPEN_ID_STORAGE_COOKIE);
  if (canUseCookies) {
    return c.redirect(url.toString(), 302);
  } else {
    // Send an HTML page that will attempt to write a cookie
    return c.html(initHtml(settings, hashedScriptName));
  }
}

export { handleInit };
