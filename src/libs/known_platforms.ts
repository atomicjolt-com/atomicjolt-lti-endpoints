import {
  CANVAS_PUBLIC_JWKS_URL,
  CANVAS_OIDC_URL,
  CANVAS_AUTH_TOKEN_URL,
  CANVAS_BETA_PUBLIC_JWKS_URL,
  CANVAS_BETA_AUTH_TOKEN_URL,
  CANVAS_BETA_OIDC_URL,
} from '@atomicjolt/lti-types';
import type { PlatformConfigurations } from '@atomicjolt/lti-server';

export const KNOWN_PLATFORMS: PlatformConfigurations = {
  'https://canvas.instructure.com': {
    issuer: 'https://canvas.instructure.com',
    jwks_uri: CANVAS_PUBLIC_JWKS_URL,
    token_endpoint: CANVAS_AUTH_TOKEN_URL,
    authorization_endpoint: CANVAS_OIDC_URL,
  },
  'https://canvas.beta.instructure.com': {
    issuer: 'https://canvas.beta.instructure.com',
    jwks_uri: CANVAS_BETA_PUBLIC_JWKS_URL,
    token_endpoint: CANVAS_BETA_AUTH_TOKEN_URL,
    authorization_endpoint: CANVAS_BETA_OIDC_URL,
  },
  'https://schoology.schoology.com': {
    issuer: 'https://schoology.schoology.com',
    jwks_uri: "https://lti-service.svc.schoology.com/lti-service/.well-known/jwks",
    token_endpoint: "https://lti-service.svc.schoology.com/lti-service/access-token",
    authorization_endpoint: "https://lti-service.svc.schoology.com/lti-service/authorize-redirect",
  },
  'https://ltiadvantagevalidator.imsglobal.org': {
    issuer: 'https://ltiadvantagevalidator.imsglobal.org',
    jwks_uri: "https://oauth2server.imsglobal.org/jwks",
    token_endpoint: "https://ltiadvantagevalidator.imsglobal.org/ltitool/authcodejwt.html",
    authorization_endpoint: "https://ltiadvantagevalidator.imsglobal.org/ltitool/oidcauthurl.html",
  },
  // Leave this in place for tests
  'https://lms.example.com': {
    issuer: 'https://lms.example.com',
    jwks_uri: "https://lms.example.com/jwks",
    token_endpoint: "https://lms.example.com/auth",
    authorization_endpoint: "https://lms.example.com/oidc",
  },
};