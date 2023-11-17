import { expect, it, describe } from 'vitest';
import { getIss } from './jwks';
import { TEST_ID_TOKEN, genJwt } from '@atomicjolt/lti-server';

describe('getIss', function () {
  it('should return the iss field from a valid JWT', async () => {
    const token = { ...TEST_ID_TOKEN };
    const { signed } = await genJwt(token);
    const jwt = signed;
    const iss = getIss(jwt);
    expect(iss).to.equal(token.iss);
  });

  it('should throw an error if the iss field is missing', async () => {
    const token = { ...TEST_ID_TOKEN };
    // @ts-expect-error
    delete token['iss'];
    const { signed } = await genJwt(token);
    const jwt = signed;

    expect(() => getIss(jwt)).to.throw('LTI token is missing required field iss.');
  });
});
