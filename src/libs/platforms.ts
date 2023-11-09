import * as jose from 'jose';
import type { Platform } from '@atomicjolt/lti-server/types';
import {
  CANVAS_PUBLIC_JWKS_URL,
  CANVAS_OIDC_URL,
  CANVAS_AUTH_TOKEN_URL,
  CANVAS_BETA_PUBLIC_JWKS_URL,
  CANVAS_BETA_AUTH_TOKEN_URL,
  CANVAS_BETA_OIDC_URL,
} from '@atomicjolt/lti-types';
import type { Platforms } from '@atomicjolt/lti-server/types';


//////////////////////////////////////////////////////
// TODO these should be dynamic values stored in a database
export const PLATFORMS: Platforms = {
  'https://canvas.instructure.com': {
    iss: 'https://canvas.instructure.com',
    jwksUrl: CANVAS_PUBLIC_JWKS_URL,
    tokenUrl: CANVAS_AUTH_TOKEN_URL,
    oidcUrl: CANVAS_OIDC_URL,
  },
  'https://canvas.beta.instructure.com': {
    iss: 'https://canvas.beta.instructure.com',
    jwksUrl: CANVAS_BETA_PUBLIC_JWKS_URL,
    tokenUrl: CANVAS_BETA_AUTH_TOKEN_URL,
    oidcUrl: CANVAS_BETA_OIDC_URL,
  },
  'https://schoology.schoology.com': {
    iss: 'https://schoology.schoology.com',
    jwksUrl: "https://lti-service.svc.schoology.com/lti-service/.well-known/jwks",
    tokenUrl: "https://lti-service.svc.schoology.com/lti-service/access-token",
    oidcUrl: "https://lti-service.svc.schoology.com/lti-service/authorize-redirect",
  },
  'https://ltiadvantagevalidator.imsglobal.org': {
    iss: 'https://ltiadvantagevalidator.imsglobal.org',
    jwksUrl: "https://oauth2server.imsglobal.org/jwks",
    tokenUrl: "https://ltiadvantagevalidator.imsglobal.org/ltitool/authcodejwt.html",
    oidcUrl: "https://ltiadvantagevalidator.imsglobal.org/ltitool/oidcauthurl.html",
  },
  // Leave this in place for tests
  'https://lms.example.com': {
    iss: 'https://lms.example.com',
    jwksUrl: "https://lms.example.com/jwks",
    tokenUrl: "https://lms.example.com/auth",
    oidcUrl: "https://lms.example.com/oidc",
  },
};


export async function getJwkServer(jwt: string): Promise<string> {
  const decoded = jose.decodeJwt(jwt);
  const iss = decoded?.iss;
  if (!iss) {
    throw new Error('LTI token is missing required field iss.');
  }
  const platform = PLATFORMS[iss];
  if (!platform) {
    throw new Error(`Unable to resolve platform information for iss: ${iss}`);
  }
  return platform.jwksUrl;
}

export function getPlatformOIDCUrl(iss: string): string {
  // Use the iss to get the platform OIDC
  const platform: Platform | undefined = PLATFORMS[iss];
  if (!platform) {
    throw new Error(`Unable to resolve platform information for iss: ${iss}`);
  }
  return platform.oidcUrl;
}
