import { env, runInDurableObject, runDurableObjectAlarm } from 'cloudflare:test';
import { beforeEach, describe, expect, it, afterEach } from 'vitest';
import { OIDCStateDurableObject, StoredState } from './oidc_state';
import { OIDCState } from '@atomicjolt/lti-server';

describe("OIDCStateDurableObject", () => {
  let id: DurableObjectId;
  let stub: DurableObjectStub<OIDCStateDurableObject>;

  // Setup before each test
  beforeEach(() => {
    // Create a new unique ID and stub for each test
    id = env.OIDC_STATE.newUniqueId();
    // Use type assertion to tell TypeScript this is the correct type of stub
    stub = env.OIDC_STATE.get(id) as DurableObjectStub<OIDCStateDurableObject>;
  });

  // Clean up after each test
  afterEach(async () => {
    try {
      // Clean up by running the destroy method
      await runInDurableObject<OIDCStateDurableObject, void>(stub, async (instance) => {
        await instance.destroy();
      });
    } catch (error) {
      // Log cleanup errors but don't fail the test
      console.error("Cleanup error:", error);
    }
  });

  describe("constructor", () => {
    it("sets an alarm", async () => {
      await runInDurableObject<OIDCStateDurableObject, void>(stub, async (_instance, state) => {
        // Verify that an alarm was set
        const alarms = await state.storage.getAlarm();
        expect(alarms).not.toBeNull();

        // Only check that the alarm is in the future, not exactly when
        const now = Date.now();
        expect(alarms).toBeGreaterThan(now);
      });
    });
  });

  describe("set", () => {
    it("stores OIDC state with expiration time", async () => {
      // Use the real current time for this test
      const now = Date.now();

      const mockOIDCState: OIDCState = {
        nonce: "test-nonce",
        state: "random-state-value",
        datetime: new Date(now).toISOString()
      };

      await runInDurableObject<OIDCStateDurableObject, void>(stub, async (instance, state) => {
        await instance.set(mockOIDCState);

        // Verify the state was stored correctly
        const storedState = await state.storage.get<StoredState>("state");
        expect(storedState).toBeDefined();
        expect(storedState?.data).toEqual(mockOIDCState);

        // Verify the expiration time is in the future
        expect(storedState?.expiresAt).toBeGreaterThan(now);
      });
    });
  });

  describe("get", () => {
    it("retrieves valid OIDC state", async () => {
      const now = Date.now();

      const mockOIDCState: OIDCState = {
        nonce: "test-nonce",
        state: "random-state-value",
        datetime: new Date(now).toISOString()
      };

      await runInDurableObject<OIDCStateDurableObject, void>(stub, async (instance) => {
        // Store the state first
        await instance.set(mockOIDCState);

        // Retrieve the state
        const retrievedState = await instance.get();

        // Verify the retrieved state matches the original
        expect(retrievedState).toEqual(mockOIDCState);
      });
    });

    it("throws error when state is missing", async () => {
      await runInDurableObject<OIDCStateDurableObject, void>(stub, async (instance) => {
        // Attempt to get state without setting it first
        await expect(instance.get()).rejects.toThrow("Missing LTI state. Please launch the application again.");
      });
    });

    it("throws error and cleans up when state is expired", async () => {
      const now = Date.now();

      const mockOIDCState: OIDCState = {
        nonce: "test-nonce",
        state: "random-state-value",
        datetime: new Date(now).toISOString()
      };

      await runInDurableObject<OIDCStateDurableObject, void>(stub, async (instance, state) => {
        // Store state directly with an expired timestamp
        await state.storage.put("state", {
          data: mockOIDCState,
          expiresAt: now - 1000 // Expired 1 second ago
        });

        // Attempt to get the expired state
        await expect(instance.get()).rejects.toThrow("LTI state has expired. Please launch the application again.");

        // Verify the state was cleaned up
        const storedState = await state.storage.get<StoredState>("state");
        expect(storedState).toBeUndefined();
      });
    });
  });

  describe("destroy", () => {
    it("deletes all storage data", async () => {
      const now = Date.now();

      const mockOIDCState: OIDCState = {
        nonce: "test-nonce",
        state: "random-state-value",
        datetime: new Date(now).toISOString()
      };

      await runInDurableObject<OIDCStateDurableObject, void>(stub, async (instance, state) => {
        // Store the state first
        await instance.set(mockOIDCState);

        // Verify state is stored
        expect(await state.storage.get<StoredState>("state")).toBeDefined();

        // Destroy the state
        await instance.destroy();

        // Verify storage is empty
        expect(await state.storage.get<StoredState>("state")).toBeUndefined();
      });
    });
  });

  describe("alarm", () => {
    it("deletes all storage data when alarm fires", async () => {
      const now = Date.now();

      const mockOIDCState: OIDCState = {
        nonce: "test-nonce",
        state: "random-state-value",
        datetime: new Date(now).toISOString()
      };

      // Set up the state
      await runInDurableObject<OIDCStateDurableObject, void>(stub, async (instance, state) => {
        // Store the state first
        await instance.set(mockOIDCState);

        // Verify state is stored
        expect(await state.storage.get<StoredState>("state")).toBeDefined();
      });

      // Run the alarm manually
      const alarmRan = await runDurableObjectAlarm(stub);

      // Verify alarm ran
      expect(alarmRan).toBe(true);

      // Check that state was cleaned up
      await runInDurableObject<OIDCStateDurableObject, void>(stub, async (_instance, state) => {
        const storedState = await state.storage.get<StoredState>("state");
        expect(storedState).toBeUndefined();
      });
    });
  });
});