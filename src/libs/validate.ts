import type { Context } from 'hono';
import type { IdToken } from '@atomicjolt/lti-server';
import { validateNonce } from '@atomicjolt/lti-server';
import { getOIDC } from '../models/oidc';
import { validateIdToken } from './jwks';

export async function validateRequest(
  c: Context,
  state: string,
  idToken: string
): Promise<IdToken> {

  if (!state) {
    throw new Error('Missing state. Please launch the application again.');
  }

  const validatedIdToken = await validateIdToken(idToken, c.env);
  const oidcState = await getOIDC(c.env, state);
  if (state !== oidcState.state) {
    throw new Error('Incorrect LTI state. Please launch the application again.');
  }

  await validateNonce(oidcState, validatedIdToken);

  return validatedIdToken;
}
