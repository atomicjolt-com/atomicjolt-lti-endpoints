import type { Context } from 'hono';
import { type PlatformConfiguration, type ToolConfiguration, type RegistrationConfiguration, LTI_PLATFORM_CONFIGURATION } from '@atomicjolt/lti-types';
import dynamicRegistrationFinishHtml from "../html/dynamic_registration_finish_html";
import { EnvBindings } from '../types';
import { setPlatform } from '../models/platforms';

export type SecureJsonHeaders = {
  'Content-Type': string
  Accept: string
  AUTHORIZATION?: string
};

export type GetToolConfiguration = (platformConfig: PlatformConfiguration, host: string) => ToolConfiguration;
export type HandlePlatformResponse = (registrationConfiguration: RegistrationConfiguration, c: Context) => void;
export type RenderFinishHtml = (registrationConfiguration: RegistrationConfiguration) => string;

// Finishes the registration process
export async function handleDynamicRegistrationFinish(
  c: Context,
  getToolConfiguration: GetToolConfiguration,
  handlePlatformResponse: HandlePlatformResponse | null = null,
  renderFinishHtml: RenderFinishHtml | null = null,
): Promise<Response> {
  const env = c.env as EnvBindings;
  const formData = await c.req.formData();
  const rawPlatformConfiguration = formData.get('platformConfiguration') as string;
  const platformConfiguration = JSON.parse(decodeURIComponent(rawPlatformConfiguration)) as PlatformConfiguration;
  const registrationEndpoint = platformConfiguration.registration_endpoint;
  const registrationToken = formData.get('registrationToken') as string;

  if (!registrationEndpoint) {
    throw new Error('registration_endpoint not found in platform configuration');
  }

  // Send a request to the provider to register the tool
  const headers: SecureJsonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (registrationToken) {
    headers['AUTHORIZATION'] = `Bearer ${registrationToken}`;
  }

  const host = (new URL(c.req.url)).host;
  const toolConfiguration = getToolConfiguration(platformConfiguration, host);
  const response = await fetch(registrationEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(toolConfiguration)
  });
  const platformToolConfiguration: ToolConfiguration = await response.json();

  const registrationConfiguration: RegistrationConfiguration = {
    platformConfiguration,
    platformToolConfiguration,
  };

  // Extract platform information from the registration
  const iss = registrationConfiguration.platformConfiguration.issuer;
  const platform: PlatformConfiguration = {
    issuer: iss,
    authorization_endpoint: registrationConfiguration.platformConfiguration.authorization_endpoint || '',
    token_endpoint: registrationConfiguration.platformConfiguration.token_endpoint || '',
    jwks_uri: registrationConfiguration.platformConfiguration.jwks_uri || '',
    token_endpoint_auth_methods_supported: registrationConfiguration.platformConfiguration.token_endpoint_auth_methods_supported || [],
    token_endpoint_auth_signing_alg_values_supported:
      registrationConfiguration.platformConfiguration.token_endpoint_auth_signing_alg_values_supported || [],
    registration_endpoint: registrationConfiguration.platformConfiguration.registration_endpoint || '',
    scopes_supported: registrationConfiguration.platformConfiguration.scopes_supported || [],
    response_types_supported: registrationConfiguration.platformConfiguration.response_types_supported || [],
    subject_types_supported: registrationConfiguration.platformConfiguration.subject_types_supported || [],
    id_token_signing_alg_values_supported: registrationConfiguration.platformConfiguration.id_token_signing_alg_values_supported || [],
    claims_supported: registrationConfiguration.platformConfiguration.claims_supported || [],
    authorization_server: registrationConfiguration.platformConfiguration.authorization_server || '',
    [LTI_PLATFORM_CONFIGURATION]: registrationConfiguration.platformConfiguration[LTI_PLATFORM_CONFIGURATION],
  };

  // Store the platform configuration
  await setPlatform(env, iss, platform);

  if (handlePlatformResponse) {
    handlePlatformResponse(registrationConfiguration, c);
  }

  if (renderFinishHtml) {
    return c.html(renderFinishHtml(registrationConfiguration));
  }
  return c.html(dynamicRegistrationFinishHtml());
}
