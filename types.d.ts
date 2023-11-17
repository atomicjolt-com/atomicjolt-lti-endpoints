import 'vite/client';
import { KVNamespace, DurableObjectNamespace } from '@cloudflare/workers-types';
import type { IdToken } from '@atomicjolt/lti-types';
import type {
  LTIStorageParams,
  InitSettings,
  LaunchSettings,
} from '@atomicjolt/lti-client/types';

export interface Platform {
  iss: string;
  jwksUrl: string;
  tokenUrl: string;
  oidcUrl: string;
}

export interface Platforms {
  [key: string]: Platform;
}

export interface OIDCState {
  state: string;
  nonce: string;
  datetime: string;
}

export type LTIRequestBody = {
  state: string;
  id_token: string;
  lti_storage_target: string;
}

export type IdTokenResult = {
  verified: Boolean;
  token: IdToken | null;
  error: string | null;
};

export interface RedirectParams {
  idToken: string;
  state: string;
  ltiStorageTarget: string;
}

export interface KeySet {
  publicKey: string;
  privateKey: string;
}

export interface JWK_RESULT {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  e: string;
  n: string;
  d: string;
  p: string;
  q: string;
  dp: string;
  dq: string;
  qi: string;
}

export interface JWKS_RESULT {
  keys: JWK_RESULT[];
}

export type EnvBindings = {
  OIDC: KVNamespace;
  JWKS: KVNamespace;
  REMOTE_JWKS: KVNamespace;
  JWT_KEYS: KVNamespace;
  PLATFORMS: KVNamespace;
  OIDC_STATE: DurableObjectNamespace;
}

declare global {
  function setupMiniflareIsolatedStorage(): Function;
  function getMiniflareBindings(): EnvBindings;
  interface Window {
    INIT_SETTINGS: InitSettings;
    LAUNCH_SETTINGS: LaunchSettings;
  }
}