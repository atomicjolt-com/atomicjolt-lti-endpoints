import type { EnvBindings } from '../types';
import { JSONWebKeySet } from 'jose';


export async function getRemoteJWKs(env: EnvBindings, jwksUrl: string): Promise<JSONWebKeySet | null> {
  const storedJWKS = await env.REMOTE_JWKS.get(jwksUrl);

  if (storedJWKS) {
    const jwks = JSON.parse(storedJWKS);
    return jwks;
  }

  return null;
}

export async function setRemoteJWKs(env: EnvBindings, url: string, jwks: JSONWebKeySet) {
  await env.REMOTE_JWKS.put(url, JSON.stringify(jwks));
}

export async function deleteRemoteJWKs(env: EnvBindings, key: string) {
  await env.REMOTE_JWKS.delete(key);
}