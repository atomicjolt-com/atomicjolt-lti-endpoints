import 'vite/client';
import { KVNamespace, DurableObjectNamespace } from '@cloudflare/workers-types';
import type { IdToken } from '@atomicjolt/lti-types';
import type {
  LTIStorageParams,
  InitSettings,
  LaunchSettings,
} from '@atomicjolt/lti-client/types';

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