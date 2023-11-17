import type { EnvBindings } from '../../types';
import type { Platform } from '@atomicjolt/lti-server/types';
import type { PlatformConfiguration } from '@atomicjolt/lti-types';
import { KNOWN_PLATFORMS } from '../libs/known_platforms';


export async function getPlatform(env: EnvBindings, iss: string): Promise<Platform> {
  let platform = KNOWN_PLATFORMS[iss];

  if (!platform) {
    const record = await env.PLATFORMS.get(iss);
    if (record) {
      const config: PlatformConfiguration = JSON.parse(record);
      platform = {
        iss: config.issuer,
        jwksUrl: config.jwks_uri,
        tokenUrl: config.token_endpoint,
        oidcUrl: config.authorization_endpoint,
      };
    }
  }

  if (!platform) {
    throw new Error(`Unable to resolve platform information for iss: ${iss}`);
  }

  return platform;
}

export async function setPlatform(env: EnvBindings, iss: string, platform: Platform) {
  await env.PLATFORMS.put(iss, JSON.stringify(platform));
}

export async function deletePlatform(env: EnvBindings, iss: string) {
  await env.PLATFORMS.delete(iss);
}
