import type { Context } from 'hono';
import type { ToolConfiguration } from '@atomicjolt/lti-types';
import dynamicRegistrationFinishHtml from "../html/dynamic_registration_finish_html";

export type SecureJsonHeaders = {
  'Content-Type': string
  Accept: string
  AUTHORIZATION?: string
};

// Finishes the registration process
export async function handleDynamicRegistrationFinish(
  c: Context,
  getToolConfiguration: Function,
  handlePlatformResponse: Function | null = null,
  renderFinishHtml: Function | null = null,
): Promise<Response> {

  const formData = await c.req.formData();
  const registrationEndpoint = formData.get('registrationEndpoint') as string;
  const registrationToken = formData.get('registrationToken') as string;

  // Send a request to the provider to register the tool
  const headers: SecureJsonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (registrationToken) {
    headers['AUTHORIZATION'] = `Bearer ${registrationToken}`;
  }

  const host = (new URL(c.req.url)).host;
  const toolConfiguration = getToolConfiguration(host);
  const response = await fetch(registrationEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(toolConfiguration)
  });
  const platformResponse: ToolConfiguration = await response.json();
  console.log(platformResponse);

  if (handlePlatformResponse) {
    return handlePlatformResponse(platformResponse);
  }

  if (renderFinishHtml) {
    return c.html(renderFinishHtml(platformResponse));
  }
  return c.html(dynamicRegistrationFinishHtml());
}
