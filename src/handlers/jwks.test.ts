import { Hono } from 'hono';
import { expect, it, describe } from 'vitest';
import type { JWKS_RESULT } from '@atomicjolt/lti-server/types';
import { EnvBindings } from '../../types';
import { handleJwks } from './jwks';

const env = getMiniflareBindings();
const app = new Hono<{ Bindings: EnvBindings }>();
app.get('/lti/jwks', handleJwks);

describe('JWKS Worker', () => {
  it('GET to /jwks should return 200 response', async () => {
    const req = new Request(
      `http://example.com/lti/jwks`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
      },
    );
    const resp = await app.fetch(req, env);

    expect(resp.status).toBe(200);
    const json: JWKS_RESULT = await resp.json();
    expect(json.keys.length).toBe(1);
    expect(json.keys[0]?.kty).toEqual('RSA');
  });
});
