import type { JwtValidationResult } from '@atomicjolt/lti-server/types';
import type { EnvBindings } from '../../types';
import {
  jwtVerify,
  createLocalJWKSet,
  decodeJwt,
  JSONWebKeySet,
} from 'jose';
import { IdToken } from '@atomicjolt/lti-server/types';
import { fetchRemoteJwks } from '@atomicjolt/lti-server';
import { getRemoteJWKs, setRemoteJWKs } from '../models/remote_jwks';
import { getPlatform } from '../models/platforms';

export function getIss(jwt: string): string {
  const decoded = decodeJwt(jwt);
  const iss = decoded?.iss;
  if (!iss) {
    throw new Error('LTI token is missing required field iss.');
  }
  return iss;
}

export async function getJwkServer(env: EnvBindings, jwt: string): Promise<string> {
  const iss = getIss(jwt);
  const platform = await getPlatform(env, iss);
  return platform.jwks_uri;
}

export async function validateRemoteJwt(env: EnvBindings, jwksUrl: string, jwt: string): Promise<JwtValidationResult> {
  let jwks = await getRemoteJWKs(env, jwksUrl);

  if (!jwks) {
    jwks = await fetchRemoteJwks(jwksUrl);
    if (!jwks) {
      throw new Error(`Unable to retrieve JWKS from ${jwksUrl}`);
    }
    await setRemoteJWKs(env, jwksUrl, jwks);
  }

  const localJwks = createLocalJWKSet(jwks);
  let token;

  try {
    const payload = await jwtVerify(jwt, localJwks);
    token = payload.payload as unknown as IdToken;
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code === 'ERR_JWKS_NO_MATCHING_KEY') {
      jwks = await fetchRemoteJwks(jwksUrl);
      if (!jwks) {
        throw new Error(`There was an error: ${e}. Unable to retrieve JWKS from ${jwksUrl}`);
      }
      jwks = jwks as JSONWebKeySet;
      await setRemoteJWKs(env, jwksUrl, jwks);
      const payload = await jwtVerify(jwt, localJwks);
      token = payload.payload as unknown as IdToken;
    } else {
      throw e;
    }
  }

  const result: JwtValidationResult = {
    verified: true,
    token,
    error: null,
  };
  return result;
}

export async function validateIdToken(idToken: string, env: EnvBindings): Promise<IdToken> {
  try {
    const jwksUrl = await getJwkServer(env, idToken);
    const result = await validateRemoteJwt(env, jwksUrl, idToken);
    if (!result || !result.token || !result.verified) {
      throw new Error('Invalid tool launch. Please launch the application again.');
    }
    return result.token;
  } catch (error: any) {
    if (error.name === 'JWSSignatureVerificationFailed') {
      throw new Error(`Unsecured tool launch. Please launch the application again. ${error.name}: ${error.message}.`);
    }
    throw new Error(`An error occured while launching the tool. Please launch the application again. ${error.name}: ${error.message}.`);
  }
}
