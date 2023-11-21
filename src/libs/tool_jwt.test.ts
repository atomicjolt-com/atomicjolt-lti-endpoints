import { expect, it, describe, afterEach } from 'vitest';
import { signToolJwt, verifyToolJwt } from './tool_jwt';
import { destroyKeySets } from '../test/state_helper';
import { getKeySets } from '../models/key_sets';
import { getDefaultToolJwt } from './tool_jwt';

const env = getMiniflareBindings();

describe('verifyToolJwt', () => {
  afterEach(async () => {
    await destroyKeySets(env);
  });

  it('should verify a valid JWT', async () => {
    // Generate a keyset
    await getKeySets(env);
    const platformIss = 'https://platform.example.com';
    const host = 'https://example.com';
    const iss = (new URL(host)).host;
    let deepLinkClaimData;

    const toolJwt = getDefaultToolJwt(
      '1',
      '234',
      iss,
      'user 1',
      platformIss,
      'https://example.com/names_and_roles',
      deepLinkClaimData,
    );
    const signed = await signToolJwt(env, toolJwt);

    const mockContext = {
      req: {
        header: () => `Bearer ${signed}`,
        url: host,
      },
      env,
    };

    const result = await verifyToolJwt(mockContext as any);
    expect(result).toBeDefined();
  });

  // it('should throw an error for an invalid JWT', async () => {
  //   const iss = 'https://example.com';
  //   const signed = 'invalid';
  //   const mockContext = {
  //     req: {
  //       header: () => `Bearer ${signed}`,
  //       url: iss,
  //     },
  //   };
  //   const result = await verifyToolJwt(mockContext as any);
  //   expect(result).toBeNull();
  // });
});