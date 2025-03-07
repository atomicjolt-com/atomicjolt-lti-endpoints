import { test, expect } from 'vitest';
import { setOIDC, getOIDC } from './oidc';
import type { OIDCStateDurableObject } from '../durable/oidc_state';
import { env } from "cloudflare:test";
import { OIDCState } from '@atomicjolt/lti-server';

test('getOIDC returns OIDC state', async (_t) => {
  const state = 'test-state';
  const oidcState: OIDCState = {
    state,
    nonce: crypto.randomUUID(),
    datetime: new Date().toISOString(),
  };
  await setOIDC(env, oidcState);
  const result = await getOIDC(env, state);
  expect(result).toEqual(oidcState);
});

test('getOIDC throws error for missing OIDC state', async (_t) => {
  const state = 'test-state';

  // Mock Durable Object instance that throws error
  const mockDurableObject = {
    get: async () => {
      throw new Error('Missing LTI state. Please launch the application again.');
    },
  } as unknown as OIDCStateDurableObject;

  // Mock environment with OIDC_STATE
  const env = {
    OIDC_STATE: {
      idFromName: (name: string) => ({ name }),
      get: () => mockDurableObject,
    },
  };

  await expect(getOIDC(env as any, state)).rejects.toThrow(
    'Missing LTI state. Please launch the application again.'
  );
});