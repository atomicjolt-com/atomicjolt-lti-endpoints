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
  KEY_SETS: KVNamespace;
  REMOTE_JWKS: KVNamespace;
  JWT_KEYS: KVNamespace;
  PLATFORMS: KVNamespace;
  CLIENT_AUTH_TOKENS: KVNamespace;
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


//
// Names and Roles
//
export interface NamesAndRolesResponse {
  result: MembershipContainer;
  next?: string;
  differences?: string;
}

export interface NamesAndRolesParams {
  role?: string;
  limit?: string;
  rlid?: string;
}


//
// Deep Linking
//

// Deep link shared
export interface Icon {
  url: string;
  width?: number;
  height?: number;
}

export interface Thumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface Embed {
  html: string;
}

export interface Window {
  targetName?: string;
  width?: number;
  height?: number;
  windowFeatures?: string;
}

export interface Iframe {
  src: string;
  width?: number;
  height?: number;
}

// Deep Link types
export interface File {
  type: string;
  url: string;
  title?: string;
  text?: string;
  icon?: Icon;
  thumbnail?: Thumbnail;
  expiresAt?: string;
}

export interface HtmlFragment {
  type: string;
  html: string;
  title?: string;
  text?: string;
}

export interface Image {
  type: string;
  url: string;
  title?: string;
  text?: string;
  icon?: Icon;
  thumbnail?: Thumbnail;
  width?: number;
  height?: number;
}

export interface Link {
  type: string;
  url: string;
  title?: string;
  text?: string;
  icon?: Icon;
  thumbnail?: Thumbnail;
  embed?: Embed;
  window?: Window;
  iframe?: Iframe;
}

export interface CustomParameter {
  key: string;
  value: string;
}

export interface LineItem {
  label?: string;
  scoreMaximum: number;
  resourceId?: string;
  tag?: string;
  gradesReleased?: boolean;
}

export interface DateTimeRange {
  startDateTime?: string;
  endDateTime?: string;
}

export interface LTIResourceLink {
  type: string;
  url?: string;
  title?: string;
  text?: string;
  icon?: Icon;
  thumbnail?: Thumbnail;
  window?: Window;
  iframe?: Iframe;
  custom?: CustomParameter[];
  lineItem?: LineItem;
  available?: DateTimeRange;
  submission?: DateTimeRange;
}

export interface DeepLinkPayload {
  iss: string; // client_id
  aud: string; // iss from id token
  azp: string; // client_id
  exp: number;
  iat: number;
  nonce: string;
  'https://purl.imsglobal.org/spec/lti/claim/message_type': string;
  'https://purl.imsglobal.org/spec/lti/claim/version': string;
  'https://purl.imsglobal.org/spec/lti/claim/deployment_id': string;
  'https://purl.imsglobal.org/spec/lti-dl/claim/content_items': ContentItem[];
  'https://purl.imsglobal.org/spec/lti-dl/claim/data'?: string;
}
