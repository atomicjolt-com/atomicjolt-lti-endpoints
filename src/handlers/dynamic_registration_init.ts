import type { Context } from 'hono';
import type { PlatformConfiguration } from '@atomicjolt/lti-types';

async function handleDynamicRegistrationInit(c: Context, dynamicRegistrationHtml: Function): Promise<Response> {
  const formData = await c.req.formData();
  const registrationToken = formData.get('registration_token') as string;
  const openidConfigurationUrl = formData.get('openid_configuration') as string;

  // Get the platform configuration
  const response = await fetch(openidConfigurationUrl);
  const platformConfiguration = await response.json() as PlatformConfiguration;

  // The issuer domain must match the openid-configuration URL domain
  if (new URL(openidConfigurationUrl).host !== new URL(platformConfiguration.issuer).host) {
    throw new Error('Invalid Issuer in platform configuration.');
  }

  // Generate the UI to present to the user during install
  return c.html(dynamicRegistrationHtml(platformConfiguration, registrationToken));
}

export { handleDynamicRegistrationInit };