import { expect, it, describe } from 'vitest';
import { TEST_ID_TOKEN, genJwt } from '@atomicjolt/lti-server';
import { getJwkServer } from './jwks';
import { setPlatform } from '../models/platforms';
import { PlatformConfiguration } from '@atomicjolt/lti-types';
import { env } from "cloudflare:test";

describe('getJwkServer', async () => {
  it('should return the jwks_uri of the platform', async () => {
    const iss = TEST_ID_TOKEN.iss;
    const platform: PlatformConfiguration = {
      issuer: iss,
      jwks_uri: 'https://example.com/jwks',
      authorization_endpoint: 'https://example.com/authorize',
      token_endpoint: 'https://example.com/token',
    };

    await setPlatform(env, iss, platform);

    const { signed } = await genJwt(TEST_ID_TOKEN);
    const result = await getJwkServer(env, signed);

    expect(result).toBe(platform.jwks_uri);
  });
});
