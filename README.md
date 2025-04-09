# AtomicJolt LTI Endpoints

A JavaScript library for handling LTI 1.3 launches, designed to work with Hono and Cloudflare Workers.

## Installation

```bash
npm install @atomicjolt/lti-endpoints
```

## Overview

This library provides server-side utilities for implementing the Learning Tools Interoperability (LTI) 1.3 standard. It's designed to work alongside [@atomicjolt/lti-client](https://www.npmjs.com/package/@atomicjolt/lti-client) to provide a complete LTI solution.

For more information about the LTI standard, see the [1EdTech working group documentation](https://www.imsglobal.org/activity/learning-tools-interoperability).

## Prerequisites

- Cloudflare Workers environment

## Setup

### Create the Required KV Namespaces

Run these commands to set up the necessary KV namespaces:

```bash
# Create KEY_SETS namespace
npx wrangler kv:namespace create KEY_SETS
npx wrangler kv:namespace create KEY_SETS --preview

# Create REMOTE_JWKS namespace
npx wrangler kv:namespace create REMOTE_JWKS
npx wrangler kv:namespace create REMOTE_JWKS --preview

# Create CLIENT_AUTH_TOKENS namespace
npx wrangler kv:namespace create CLIENT_AUTH_TOKENS
npx wrangler kv:namespace create CLIENT_AUTH_TOKENS --preview

# Create PLATFORMS namespace
npx wrangler kv:namespace create PLATFORMS
npx wrangler kv:namespace create PLATFORMS --preview
```

After creating these namespaces, add their IDs to your `wrangler.toml` configuration file.

## Usage

For a complete implementation example, see the [atomic-lti-worker](https://github.com/atomicjolt-com/atomic-lti-worker) project.

### LTI Launch Flow

The LTI 1.3 launch process happens in three phases:

#### 1. OpenID Connect Initialization

- Server: Process the OIDC initialization request
- Server: Set state cookie
- Client: Return an HTML page with a call to `initOIDCLaunch` from [@atomicjolt/lti-client](https://www.npmjs.com/package/@atomicjolt/lti-client)

#### 2. Platform Redirect

- Server: Validate the redirect
- Server: Return an HTML page that redirects to the final LTI launch URL

#### 3. LTI Launch

- Server: Validate the request and check the nonce
- Server: Verify the state cookie is valid
- Client: Return an HTML page with a call to `ltiLaunch` from [@atomicjolt/lti-client](https://www.npmjs.com/package/@atomicjolt/lti-client)

## Development

### Running Tests

```bash
npm run test
```

### Building the Package

```bash
npm run build
```

### Publishing the Package

```bash
npm publish --access public
```

## Contributing

Report any issues using the [GitHub issue tracker](https://github.com/atomicjolt-com/atomicjolt-lti-endpoints/issues).

## License

MIT

This code is released as open source without any support or warranty. It is used by Atomic Jolt internally and is shared in case someone else finds it useful.
