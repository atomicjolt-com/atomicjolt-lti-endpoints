import type { EnvBindings } from '../../types';
import type { Platform } from '@atomicjolt/lti-server/types';
export declare function getPlatform(env: EnvBindings, iss: string): Promise<Platform>;
export declare function setPlatform(env: EnvBindings, iss: string, platform: Platform): Promise<void>;
export declare function deletePlatform(env: EnvBindings, iss: string): Promise<void>;
//# sourceMappingURL=platforms.d.ts.map