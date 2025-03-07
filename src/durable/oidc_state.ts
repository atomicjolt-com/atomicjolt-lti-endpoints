import { DurableObject } from "cloudflare:workers";
import type { EnvBindings } from '../types';
import { ALLOWED_LAUNCH_TIME, OIDCState } from "@atomicjolt/lti-server";

// Interface for stored state with expiration
interface StoredState {
  data: OIDCState;
  expiresAt: number;
}

export class OIDCStateDurableObject extends DurableObject<EnvBindings> {
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // Cleanup every hour (in ms)

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);

    // Schedule the first cleanup
    this.ctx.storage.setAlarm(Date.now() + this.CLEANUP_INTERVAL);
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
    //await this.ctx.storage.delete('state');
    try {
      await this.ctx.storage.delete('state');
    } catch (error) {
      // Log error but don't throw, allowing cleanup to continue
      console.error('Error deleting state during cleanup:', error);
    }
  }

  // Handle alarm events for cleanup
  async alarm(): Promise<void> {
    try {
      // Get all stored items
      const storedItems = await this.ctx.storage.list<StoredState>();
      const now = Date.now();
      let cleanupCount = 0;

      // Check each item for expiration
      for (const [key, value] of storedItems.entries()) {
        if (value.expiresAt && now > value.expiresAt) {
          await this.ctx.storage.delete(key);
          cleanupCount++;
        }
      }

      console.log(`Cleaned up ${cleanupCount} expired items`);
    } catch (error) {
      console.error('Error during scheduled cleanup:', error);
    } finally {
      // Reschedule the next cleanup
      this.ctx.storage.setAlarm(Date.now() + this.CLEANUP_INTERVAL);
    }
  }
}