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
  const platformResponse: ToolConfiguration = await response.json()
  console.log(platformResponse);

  // TODO store client id or deployment id here as needed
  // platformResponse.client_id
  // platformResponse['https://purl.imsglobal.org/spec/lti-tool-configuration'].deployment_id

  return c.html(dynamicRegistrationFinishHtml());
}
