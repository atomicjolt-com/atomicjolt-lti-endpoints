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
  handlePlatformResponse: Function,
): Promise<Response> {
  const clientRegistrationRequest = getToolConfiguration();
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

  const response = await fetch(registrationEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(clientRegistrationRequest)
  });
  const platformResponse: ToolConfiguration = await response.json()

  // Pass the response back to the store so that any required data can be saved  
  handlePlatformResponse(platformResponse);

  return c.html(dynamicRegistrationFinishHtml());
}


// // Finishes the registration process
// pub async fn dynamic_registration_finish(
//   registration_endpoint: & str,
//   registration_token: & str,
//   dynamic_registration_store: & dyn DynamicRegistrationStore,
// ) -> Result < HttpResponse, AtomicToolError > {
//   let client_registration_request = dynamic_registration_store.get_client_registration_request();
//   // Send a request to the provider to register the tool
//   let platform_response = register_tool(
//     registration_endpoint,
//     registration_token,
//     & client_registration_request,
//   )
//     .await ?;

//   // Pass the response back to the store so that any required data can be saved
//   dynamic_registration_store.handle_platform_response(platform_response) ?;
//   let html = dynamic_registration_store.complete_html();
//   Ok(HttpResponse:: Ok().content_type("text/html").body(html))
// }

