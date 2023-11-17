import type { Context } from 'hono';
import { getCurrentJwks } from '../models/jwks';


export async function handleJwks(c: Context): Promise<Response> {
  const jwks = await getCurrentJwks(c.env);
  const json = JSON.stringify(jwks);
  return new Response(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
