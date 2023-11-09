import type { Context } from 'hono';
import { getJwks } from '../libs/jwt';

export async function handleJwks(c: Context): Promise<Response> {
  const jwks = await getJwks(c.env.JWKS);
  const json = JSON.stringify(jwks);
  return new Response(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
