import type { EnvBindings } from '../../types';
import type { PlatformConfiguration } from '@atomicjolt/lti-types';
export declare function getPlatform(env: EnvBindings, iss: string): Promise<PlatformConfiguration>;
export declare function setPlatform(env: EnvBindings, iss: string, platform: PlatformConfiguration): Promise<void>;
export declare function deletePlatform(env: EnvBindings, iss: string): Promise<void>;
//# sourceMappingURL=platforms.d.ts.map