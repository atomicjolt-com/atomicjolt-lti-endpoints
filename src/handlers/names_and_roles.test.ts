import { Hono } from 'hono';
import { expect, it, describe, vi, afterEach } from 'vitest';
import type { EnvBindings } from '../types';
import { handleNamesAndRoles } from './names_and_roles';
import { setFakeToolJwt } from '../test/tool_helper';


const app = new Hono<{ Bindings: EnvBindings }>();
const env: EnvBindings = getMiniflareBindings();

app.get('/lti/names_and_roles', (c) => handleNamesAndRoles(c));

const result = {
  id: 'fakeid',
  context: {
    id: 'fakecontext',
    label: 'fakecontext',
  },
};

global.fetch = vi.fn()
  .mockResolvedValueOnce({
    ok: true,
    headers: {
      get: () => {
        return null;
      },
    },
    json: () => {
      return Promise.resolve(JSON.stringify(result));
    },
  });

describe('names_and_roles', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  });

  it('returns a 200 when the tool jwt is value', async () => {
    const headers = await setFakeToolJwt(env);
    const req = new Request(
      'http://example.com/lti/names_and_roles',
      {
        method: 'GET',
        headers,
      },
    );
    const resp = await app.fetch(req, env);
    expect(resp.status).toBe(200);
  });
});
