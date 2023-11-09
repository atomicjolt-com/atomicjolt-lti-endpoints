import { Hono } from 'hono';
import { expect, it, describe } from 'vitest';
import { OPEN_ID_STORAGE_COOKIE } from '@atomicjolt/lti-server';
import type { EnvBindings } from '../../types';
import { setupValidState } from '../test/state_helper';
import { TEST_ID_TOKEN } from '@atomicjolt/lti-server';
import { handleRedirect } from './redirect';

const env: EnvBindings = getMiniflareBindings();
const app = new Hono<{ Bindings: EnvBindings }>();

app.post('/lti/redirect', (c) => handleRedirect(c));

describe('redirect request', () => {
  it('returns 200 for a POST to /redirect', async () => {
    const { body } = await setupValidState(env, TEST_ID_TOKEN);
    const req = new Request(
      `http://example.com/lti/redirect`,
      {
        method: 'POST',
        headers: {
          Accept: '*/*',
          Cookie: `${OPEN_ID_STORAGE_COOKIE}=1`,
        },
        body: body,
      },
    );
    const resp = await app.fetch(req, env);
    expect(resp.status).toBe(200);
  });
});
