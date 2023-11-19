import { KeyLike } from 'jose';
import { IdToken } from '@atomicjolt/lti-types';
import type { EnvBindings } from '../../types';
export declare function storeState(env: EnvBindings, state: string, nonce: string): Promise<void>;
export declare function destroyKeySets(env: EnvBindings): Promise<void[]>;
export declare function setupValidState(env: EnvBindings, token: IdToken): Promise<{
    state: string;
    body: FormData;
    privateKey: KeyLike;
}>;
//# sourceMappingURL=state_helper.d.ts.map