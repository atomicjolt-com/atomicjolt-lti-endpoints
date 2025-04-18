import type { Context } from 'hono';
import type { PlatformConfiguration, ToolConfiguration, RegistrationConfiguration } from '@atomicjolt/lti-types';
import dynamicRegistrationFinishHtml from "../html/dynamic_registration_finish_html";

export type SecureJsonHeaders = {
  'Content-Type': string
  Accept: string
  AUTHORIZATION?: string
};

export type GetToolConfiguration = (platformConfig: PlatformConfiguration, host: string) => ToolConfiguration;
export type HandlePlatformResponse = (registrationConfiguration: RegistrationConfiguration) => void;
export type RenderFinishHtml = (registrationConfiguration: RegistrationConfiguration) => string;

// Finishes the registration process
export async function handleDynamicRegistrationFinish(
  c: Context,
  getToolConfiguration: GetToolConfiguration,
  handlePlatformResponse: HandlePlatformResponse | null = null,
  renderFinishHtml: RenderFinishHtml | null = null,
): Promise<Response> {

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
  if (handlePlatformResponse) {
    handlePlatformResponse(registrationConfiguration);
  }

  if (renderFinishHtml) {
    return c.html(renderFinishHtml(registrationConfiguration));
  }
  return c.html(dynamicRegistrationFinishHtml());
}
