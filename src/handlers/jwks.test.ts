import { Hono } from 'hono';
import { expect, it, describe } from 'vitest';
import type { jwksResult } from '@atomicjolt/lti-server';
import type { EnvBindings } from '../types';
import { handleJwks } from './jwks';
import { env } from "cloudflare:test";

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
    const json: jwksResult = await resp.json();
    expect(json.keys.length).toBe(1);
    expect(json.keys[0]?.kty).toEqual('RSA');
  });
});
