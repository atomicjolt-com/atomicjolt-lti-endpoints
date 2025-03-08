import { test, expect, afterEach, vi } from 'vitest';
import { setOIDC, getOIDC, deleteOIDC } from './oidc';
import { env } from "cloudflare:test";
import { OIDCState } from '@atomicjolt/lti-server';

// Keep track of states created during tests for cleanup
const testStates: string[] = [];

// Clean up after each test to avoid isolated storage issues
afterEach(async () => {
  try {
    // Use a try/catch to ensure cleanup errors don't break tests
    await Promise.allSettled(testStates.map(state => deleteOIDC(env, state)));
  } catch (error) {
    console.warn("Cleanup error (can be ignored):", error);
  }
});

test('getOIDC returns OIDC state', async () => {
  const state = `test-state-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  testStates.push(state);

  const oidcState: OIDCState = {
    state,
    nonce: crypto.randomUUID(),
    datetime: new Date().toISOString(),
  };

  await setOIDC(env, oidcState);

  const result = await getOIDC(env, state);
  expect(result).toEqual(oidcState);

  // Clean up right after the test
  await deleteOIDC(env, state);
});

test('deleteOIDC removes OIDC state', async () => {
  const mockDO = {
    destroy: vi.fn().mockResolvedValue(undefined)
  };

  const mockEnv = {
    OIDC_STATE: {
      idFromName: vi.fn().mockReturnValue('test-id'),
      get: vi.fn().mockReturnValue(mockDO)
    }
  };

  // Test the function directly with mocks
  await deleteOIDC(mockEnv as any, 'test-state');

  // Verify the mock was called correctly
  expect(mockEnv.OIDC_STATE.idFromName).toHaveBeenCalledWith('test-state');
  expect(mockEnv.OIDC_STATE.get).toHaveBeenCalled();
  expect(mockDO.destroy).toHaveBeenCalled();
});
