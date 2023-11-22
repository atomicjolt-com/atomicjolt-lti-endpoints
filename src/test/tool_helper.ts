import { getDefaultToolJwt, signToolJwt } from '../libs/tool_jwt';
import { DeepLinkingClaim, NAMES_AND_ROLES_SCOPE } from '@atomicjolt/lti-types';
import { ClientAuthorizationResponse } from '@atomicjolt/lti-server/types';
import { setClientCredential } from '../models/client_credentials';
import { EnvBindings } from '../../types';

export async function setFakeToolJwt(env: EnvBindings) {
  const clientId = '1234';
  const deploymentId = 'd3838';
  const iss = 'example.com';
  const userId = '373';
  const platformIss = 'https://lms.example.com';
  const scopes = NAMES_AND_ROLES_SCOPE;
  const membershipsUrl = 'https://example.com/memberships';

  const credentials: ClientAuthorizationResponse = {
    access_token: 'faketoken',
    token_type: 'bearer',
    expires_in: (Date.now() / 1000) + (60 * 60),
    scope: scopes,
  };
  const credentialKey = clientId + scopes;
  await setClientCredential(env, credentialKey, credentials);

  const deepLinkClaimData: DeepLinkingClaim = {
    'deep_link_return_url': 'https://example.com/deep',
    'accept_types': ['ltiResourceLink'],
    'accept_presentation_document_targets': ['iframe', 'window'],
    'accept_media_types': 'text/html',
    'accept_multiple': false,
    'auto_create': false,
    'title': 'Test',
    'text': 'Test',
    'data': 'test',
  };

  const jwt = getDefaultToolJwt(
    clientId,
    deploymentId,
    iss,
    userId,
    platformIss,
    membershipsUrl,
    deepLinkClaimData,
  );
  const signed = await signToolJwt(env, jwt);
  const headers = {
    'Authorization': `Bearer ${signed}`,
    'Content-Type': 'application/json'
  }

  return headers;
}