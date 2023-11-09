import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { TARGET_LINK_URI_CLAIM } from '@atomicjolt/lti-types';
import type { RedirectParams, LTIRequestBody, IdTokenResult } from '@atomicjolt/lti-server/types';
import { validateRequest } from '../libs/validate';
import redirectHtml from '../html/redirect_html';

const DEFAULT_DEEP_LINK_PATH = '/lti/launch';

export async function handleRedirect(c: Context): Promise<Response> {
  const host = (new URL(c.req.url)).host;
  const body = (await c.req.parseBody()) as unknown as LTIRequestBody;
  let idTokenResult: IdTokenResult;
  try {
    idTokenResult = await validateRequest(c, body.state, body.id_token);
    if (!idTokenResult || !idTokenResult.token) {
      throw new Error('Missing LTI token.');
    }
  } catch (e) {
    console.error(e);
    const res = new Response((e as Error).message, {
      status: 401,
    });
    throw new HTTPException(401, { res });
  }

  // Technically the target_link_uri is not required and the certification suite
  // does not send it on a deep link launch.Typically target link uri will be present
  // but at least for the certification suite we have to have a backup default
  // value that can be set in the configuration of Atomic LTI using
  // the default_deep_link_path
  let targetLinkUri = `https://${host}/${DEFAULT_DEEP_LINK_PATH}`;
  if (idTokenResult && idTokenResult.token) {
    targetLinkUri = idTokenResult.token[TARGET_LINK_URI_CLAIM];
  }

  const ltiStorageTarget = body.lti_storage_target;
  const redirectParams: RedirectParams = {
    idToken: body.id_token,
    state: body.state,
    ltiStorageTarget,
  };

  const html = redirectHtml(redirectParams, targetLinkUri);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    }
  });
}
