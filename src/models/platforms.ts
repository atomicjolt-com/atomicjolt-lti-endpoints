import type { EnvBindings } from '../types';
import type { PlatformConfiguration } from '@atomicjolt/lti-types';
import { KNOWN_PLATFORMS } from '../libs/known_platforms';

export async function getPlatform(env: EnvBindings, iss: string): Promise<PlatformConfiguration> {
  let config: PlatformConfiguration | undefined;
  const record = await env.PLATFORMS.get(iss);
  if (record) {
    config = JSON.parse(record) as PlatformConfiguration;
  } else {
    config = KNOWN_PLATFORMS[iss];
  }
  if (!config) {
    throw new Error(`Unable to resolve platform information for iss: ${iss}`);
  }

  return config;
}

export async function setPlatform(env: EnvBindings, iss: string, platform: PlatformConfiguration) {
  await env.PLATFORMS.put(iss, JSON.stringify(platform));
}

export async function deletePlatform(env: EnvBindings, iss: string) {
  await env.PLATFORMS.delete(iss);
}
