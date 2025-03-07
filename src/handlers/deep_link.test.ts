import { Hono } from 'hono';
import { expect, it, describe } from 'vitest';
import type { EnvBindings, LTIResourceLink, Image } from '../types';
import { handleSignDeepLink, ContentItem } from './deep_link';
import { setFakeToolJwt } from '../test/tool_helper';
import { env } from "cloudflare:test";

const app = new Hono<{ Bindings: EnvBindings }>();

app.post('/lti/sign_deep_link', (c) => handleSignDeepLink(c));

describe('sign_deep_link', () => {
  it('returns a valid JWT for deep linking html response', async () => {
    const headers = await setFakeToolJwt(env);
    const deepLink = {
      type: 'html',
      html: '<h2>Just saying hi!</h2>',
      title: 'Hello World',
      text: 'A simple hello world example',
    };
    const body = JSON.stringify([deepLink]);
    const req = new Request(
      'http://example.com/lti/sign_deep_link',
      {
        method: 'POST',
        headers,
        body,
      },
    );
    const resp = await app.fetch(req, env);
    expect(resp.status).toBe(200);
  });

  it('returns a valid JWT for deep linking LTIResourceLink and Image response', async () => {
    const headers = await setFakeToolJwt(env);

    const ltiResourceLink: LTIResourceLink = {
      type: ContentItem.LTIResourceLink,
      url: 'http://example.com/lti/launch',
      title: 'Hello World',
      text: 'A simple hello world example',
    };

    const image: Image = {
      type: ContentItem.Image,
      url: 'http://example.com/image.png',
    };

    const body = JSON.stringify([ltiResourceLink, image]);
    const req = new Request(
      'http://example.com/lti/sign_deep_link',
      {
        method: 'POST',
        headers,
        body,
      },
    );
    const resp = await app.fetch(req, env);
    expect(resp.status).toBe(200);
  });
});
