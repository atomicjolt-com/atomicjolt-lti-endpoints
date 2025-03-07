import { DurableObject } from "cloudflare:workers";
import type { EnvBindings } from '../types';
import { ALLOWED_LAUNCH_TIME, OIDCState } from "@atomicjolt/lti-server";

// Interface for stored state with expiration
interface StoredState {
  data: OIDCState;
  expiresAt: number;
}

export class OIDCStateDurableObject extends DurableObject<EnvBindings> {
  private readonly TTL = 5 * 60 * 1000; // 5 mins in milliseconds

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);

    // Use an alarm to handle time to live
    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.setAlarm(Date.now() + this.TTL);
    });
  }

  // Store OIDC state with expiration
  async set(oidcState: OIDCState): Promise<void> {
    const stateWithExpiry: StoredState = {
      data: oidcState,
      expiresAt: Date.now() + (ALLOWED_LAUNCH_TIME * 1000)
    };

    await this.ctx.storage.put('state', stateWithExpiry);
  }

  // Retrieve OIDC state if not expired
  async get(): Promise<OIDCState> {
    const stateWrapper = await this.ctx.storage.get<StoredState>('state');

    if (!stateWrapper) {
      throw new Error('Missing LTI state. Please launch the application again.');
    }

    // Check if expired
    if (Date.now() > stateWrapper.expiresAt) {
      await this.ctx.storage.delete('state'); // Clean up expired state
      throw new Error('LTI state has expired. Please launch the application again.');
    }

    return stateWrapper.data;
  }

  // Manually delete the state
  async destroy(): Promise<void> {
    await this.ctx.storage.deleteAll();
  }

  // Handle alarm events for cleanup
  async alarm() {
    await this.ctx.storage.deleteAll();
  }

}