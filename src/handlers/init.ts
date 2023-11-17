import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { buildInit } from '@atomicjolt/lti-server';
import { OPEN_ID_COOKIE_PREFIX, OPEN_ID_STORAGE_COOKIE } from '@atomicjolt/lti-server';
import { getPlatform } from '../models/platforms';
import initHtml from '../html/init_html';
import { setOIDC } from '../models/oidc';
import { PlatformConfiguration } from '@atomicjolt/lti-types';

function writeCookie(c: Context, name: string, value: string, maxAge: number) {
  setCookie(c, name, value, {
    path: '/',
    secure: true,
    httpOnly: false,
    maxAge: maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
    sameSite: 'None',
  });
}

async function handleInit(c: Context, hashedScriptName: string): Promise<Response> {
  const requestUrl = c.req.url;
  const formData = await c.req.formData();
  const target = formData.get('lti_storage_target') as string;
  const ltiMessageHint = formData.get('lti_message_hint') as string;
  const loginHint = formData.get('login_hint') as string;
  const clientId = formData.get('client_id') as string;
  const iss = formData.get('iss') as string;

  if (iss === null) {
    return new Response('Request is missing required field iss', {
      status: 401,
    });
  }

  let platform: PlatformConfiguration;
  try {
    platform = await getPlatform(c.env, iss);
  } catch (e) {
    return new Response(e as string, {
      status: 401,
    });
  }

  const { oidcState, url, settings } = buildInit(
    requestUrl,
    clientId,
    loginHint,
    ltiMessageHint,
    target,
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
