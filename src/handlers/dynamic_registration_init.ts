import type { Context } from 'hono';
import type { PlatformConfiguration } from '@atomicjolt/lti-types';
import { setPlatform } from '../models/platforms';

export type DynamicRegistrationHtml = (platformConfiguration: PlatformConfiguration, registrationToken: string) => string;

async function handleDynamicRegistrationInit(
  c: Context,
  dynamicRegistrationHtml: DynamicRegistrationHtml
): Promise<Response> {
  // Get the registration token and openid configuration URL from the query string
  const registrationToken = c.req.query('registration_token') as string;
  const openidConfigurationUrl = c.req.query('openid_configuration') as string;

  // Get the platform configuration
  const response = await fetch(openidConfigurationUrl);
  const platformConfiguration = await response.json() as PlatformConfiguration;

  // The issuer domain must match the openid-configuration URL domain
  if (new URL(openidConfigurationUrl).host !== new URL(platformConfiguration.issuer).host) {
    throw new Error('Invalid Issuer in platform configuration.');
  }

  // Store the platform configuration
  await setPlatform(c.env, platformConfiguration.issuer, platformConfiguration);

  // Generate the UI to present to the user during install
  return c.html(dynamicRegistrationHtml(platformConfiguration, registrationToken));
}

export { handleDynamicRegistrationInit };