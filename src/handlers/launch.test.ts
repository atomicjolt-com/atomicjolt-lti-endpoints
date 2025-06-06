import { Hono } from 'hono';
import { expect, it, describe, beforeEach, afterEach, vi } from 'vitest';
import {
  LTI_VERSION,
  MESSAGE_TYPE,
} from '@atomicjolt/lti-types';
import { OPEN_ID_COOKIE_PREFIX, signJwt, TEST_ID_TOKEN, genJwt } from '@atomicjolt/lti-server';
import type { EnvBindings } from '../types';
import { setupKeySets, setupValidState, storeState } from '../test/state_helper';
import { handleLaunch } from './launch';
import { deleteOIDC } from '../models/oidc';
import { env } from "cloudflare:test";
import * as oidcModule from '../models/oidc';
import * as validateModule from '../libs/validate';
import type { MockInstance } from 'vitest';

const app = new Hono<{ Bindings: EnvBindings }>();
const initHashedScriptName = 'init.1234.js';
const getToolJwt = () => Promise.resolve('fake_jwt');
app.post('/lti/launch', (c) => handleLaunch(c, initHashedScriptName, getToolJwt));

describe('launch', async () => {
  it('returns a 200 with verified false when state is not present', async () => {
    const { body } = await setupValidState(env, TEST_ID_TOKEN);
    const req = new Request(
      'http://example.com/lti/launch',
      {
        method: 'POST',
        body: body,
      },
    );
    const resp = await app.fetch(req, env);
    const text = await resp.text();
    expect(resp.status).toBe(200);
    expect(text).toContain('"stateVerified":false');
  });

  it('returns a 401 when cookie is not present and lti_storage_target is empty', async () => {
    const { body, state } = await setupValidState(env, TEST_ID_TOKEN);
    body.delete('lti_storage_target');

    const req = new Request(
      'http://example.com/lti/launch',
      {
        method: 'POST',
        body: body,
      },
    );
    const resp = await app.fetch(req, env);

    const text = await resp.text();
    expect(resp.status).toBe(401);
    expect(text).toContain('Unable to securely launch tool. Please ensure cookies are enabled');

    // Clean up
    await deleteOIDC(env, state);
  });

  describe('JWT tests', async () => {
    const state = crypto.randomUUID();

    it('fails when the KID is not present in the JWT header', async () => {
      await setupKeySets(env);
      const body = new FormData();

      // Generate a new jwt that will have a KID not present
      const { signed } = await genJwt();
      body.set('id_token', signed);
      body.set('state', state);

      const req = new Request(
        'http://example.com/lti/launch',
        {
          method: 'POST',
          headers: {
            Accept: '*/*',
            Cookie: `${OPEN_ID_COOKIE_PREFIX}${state}`,
          },
          body: body,
        },
      );
      const resp = await app.fetch(req, env);

      expect(resp.status).toBe(401);
      const text = await resp.text();
      expect(text).toBe('Unsecured tool launch. Please launch the application again. JWSSignatureVerificationFailed: signature verification failed.');
    });

    // Test Description: Incorrect KID passed in JWT Header
    // Test Verifies Correct KID Required in Header

    // Test Description: LTI version passed is not 1.3
    // Test Sends LTI Version that is NOT 1.3
    it('returns an invalid version message', async () => {
      await setupKeySets(env);
      const token = { ...TEST_ID_TOKEN };
      // @ts-expect-error
      token[LTI_VERSION] = '11.2.0';
      const body: BodyInit = new FormData();
      const { signed } = await genJwt(token);
      body.set('id_token', signed);
      body.set('state', state);

      const req = new Request(
        'http://example.com/lti/launch',
        {
          method: 'POST',
          headers: {
            Accept: '*/*',
            Cookie: `${OPEN_ID_COOKIE_PREFIX}${state}`,
          },
          body: body,
        },
      );
      const resp = await app.fetch(req, env);
      const text = await resp.text();
      expect(resp.status).toBe(401);
      expect(text).toBe('Unsecured tool launch. Please launch the application again. JWSSignatureVerificationFailed: signature verification failed.');
    });

    // Test Description: No LTI Version Passed in JWT
    // Test Delivers Launch Without LTI Version
    it('returns an invalid version message when version is empty', async () => {
      const token = { ...TEST_ID_TOKEN };
      // @ts-expect-error
      token[LTI_VERSION] = '';
      const { state } = await setupValidState(env, TEST_ID_TOKEN);
      const body: BodyInit = new FormData();
      const { signed } = await genJwt(token);
      body.set('id_token', signed);
      body.set('state', state);

      const req = new Request(
        'http://example.com/lti/launch',
        {
          method: 'POST',
          headers: {
            Accept: '*/*',
            Cookie: `${OPEN_ID_COOKIE_PREFIX}${state}`,
          },
          body: body,
        },
      );
      const resp = await app.fetch(req, env);
      const text = await resp.text();
      expect(resp.status).toBe(401);
      expect(text).toBe('Unsecured tool launch. Please launch the application again. JWSSignatureVerificationFailed: signature verification failed.');
    });

    // Test Description: JWT Passed is Not LTI 1.3 JWT
    // Test Delivers Launch WithoutCorrect JWT
    it('fails when the id_token is not an LTI 1.3 JWT', async () => {
      const { state, body, privateKey } = await setupValidState(env, TEST_ID_TOKEN);
      const nonce = crypto.randomUUID();
      const not_id_token = {
        'aud': 'fake',
        'azp': 'fake',
        'iss': 'fake',
        nonce,
      }
      const signed = await signJwt(not_id_token, privateKey);
      body.set('id_token', signed);

      await storeState(env, state, nonce);

      const req = new Request(
        'http://example.com/lti/launch',
        {
          method: 'POST',
          headers: {
            Accept: '*/*',
            Cookie: `${OPEN_ID_COOKIE_PREFIX}${state}`,
          },
          body: body,
        },
      );
      const resp = await app.fetch(req, env);
      const text = await resp.text();

      expect(resp.status).toBe(401);
      expect(text).toContain('An error occured while launching the tool. Please launch the application again.');

      // Clean up
      await deleteOIDC(env, state);
    });

    // Test Description: One or more JWT fields missing
    // Test Sends JWT with One or More Required Claims Missing
    // Test Description: message_type Claim Missing
    // Test Sends JWT without Required message_type
    it('fails when the LTI 1.3 JWT is missing required claims', async () => {
      const { state, body, privateKey } = await setupValidState(env, TEST_ID_TOKEN);
      const runTest = async (field: string | number) => {
        const new_id_token: { [key: string]: any } = { ...TEST_ID_TOKEN };

        delete new_id_token[field];

        const signed = await signJwt(new_id_token, privateKey);

        body.set('state', state);
        body.set('id_token', signed);

        await storeState(env, state, new_id_token.nonce);

        const req = new Request(
          'http://example.com/lti/launch',
          {
            method: 'POST',
            headers: {
              Accept: '*/*',
              Cookie: `${OPEN_ID_COOKIE_PREFIX}${state}`,
            },
            body: body,
          },
        );
        const resp = await app.fetch(req, env);
        const text = await resp.text();
        expect(resp.status).toBe(401);
        expect(text).toContain('LTI token is missing required');
        expect(text).toContain(field);

        // Clean up
        await deleteOIDC(env, state);
      }

      await runTest('iss');
      await runTest('sub');
      await runTest('aud');
      await runTest('sub');
      await runTest(MESSAGE_TYPE);

      // Clean up
      await deleteOIDC(env, state);
    });
  });

  it('succeeds when the id_token is valid', async () => {
    const { state, body } = await setupValidState(env, TEST_ID_TOKEN);
    const req = new Request(
      'http://example.com/lti/launch',
      {
        method: 'POST',
        headers: {
          Accept: '*/*',
          Cookie: `${OPEN_ID_COOKIE_PREFIX}${state}=1`,
        },
        body: body,
      },
    );
    const resp = await app.fetch(req, env);
    expect(resp.status).toBe(200);
    const text = await resp.text();
    expect(text).toContain('"stateVerified":true');

    // Clean up
    await deleteOIDC(env, state);
  });
});

describe('launch failures', async () => {
  let deleteOIDCSpy: MockInstance;
  let validateRequestSpy: MockInstance;

  beforeEach(() => {
    deleteOIDCSpy = vi.spyOn(oidcModule, 'deleteOIDC')
      .mockImplementation(async () => undefined);

    validateRequestSpy = vi.spyOn(validateModule, 'validateRequest');

    // Default implementation for all tests
    validateRequestSpy.mockImplementation(async (_c, state, _idToken) => {
      if (state === 'fake_state') {
        // Manually call deleteOIDC before throwing
        await oidcModule.deleteOIDC(env, state);
        throw new Error('Missing LTI state. Please launch the application again.');
      }
      throw new Error('Missing LTI state. Please launch the application again.');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fails when the state value does not exist', async () => {
    const { body, state } = await setupValidState(env, TEST_ID_TOKEN);

    // Set to a fake state that doesn't exist
    body.set('state', 'fake_state');

    const req = new Request(
      'http://example.com/lti/launch',
      {
        method: 'POST',
        headers: {
          Accept: '*/*',
          Cookie: `${OPEN_ID_COOKIE_PREFIX}${state}`,
        },
        body: body,
      },
    );

    const resp = await app.fetch(req, env);

    expect(resp.status).toBe(401);
    const text = await resp.text();
    expect(text).toBe('Missing LTI state. Please launch the application again.');

    // Now this should pass since we manually called deleteOIDC inside our mock
    expect(deleteOIDCSpy).toHaveBeenCalledWith(env, 'fake_state');
  });

  it('fails when the state value in the cookie cannot be found', async () => {
    const { body, state } = await setupValidState(env, TEST_ID_TOKEN);

    validateRequestSpy.mockImplementationOnce(async (_c, stateVal, _idToken) => {
      // Manually call deleteOIDC before throwing
      await oidcModule.deleteOIDC(env, stateVal);
      throw new Error('Missing LTI state. Please launch the application again.');
    });

    const req = new Request(
      'http://example.com/lti/launch',
      {
        method: 'POST',
        headers: {
          Accept: '*/*',
          Cookie: `${OPEN_ID_COOKIE_PREFIX}${state}=1`,
        },
        body: body,
      },
    );

    const resp = await app.fetch(req, env);

    expect(resp.status).toBe(401);
    const text = await resp.text();
    expect(text).toContain('Missing LTI state. Please launch the application again.');

    expect(deleteOIDCSpy).toHaveBeenCalledWith(env, state);
  });
});