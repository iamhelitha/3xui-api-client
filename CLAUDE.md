# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A zero-runtime-dependency-beyond-axios Node.js client library (CommonJS) for the [3x-ui](https://github.com/MHSanaei/3x-ui) VPN panel API. Published to npm as `3xui-api-client`. It wraps the panel's REST API with automatic session management, credential generation, and protocol config builders.

## Commands

```bash
npm run lint            # eslint over index.js and src/ — the only meaningful CI-style check
npx jest test/unit      # run unit tests IF any exist under test/unit (mocked, no panel needed)
```

- `npm test` is a no-op echo — there is **no** automated test suite wired to it.
- The numbered scripts in `test/` (`01_login.js` … `22_*.js`) are **interactive harness scripts** that export a function and require a *live 3x-ui panel* plus an external runner (not in this repo). They are not Jest suites; don't expect `npm test`/`npx jest` to exercise them meaningfully. The README's `npm run test:login` / "run all tests" instructions refer to scripts that no longer exist.
- Jest is configured (`testMatch: **/test/**/*.js`), so when adding real unit tests, run them with an explicit path (e.g. `npx jest test/unit`) to avoid picking up the interactive scripts.

## Architecture

### One class, two API surfaces, two auth modes

Everything centers on the `ThreeXUI` class in **`index.js`** (~1750 lines — the bulk of the library). `src/` holds supporting modules composed into it.

- **Dual panel support.** 3x-ui has two generations: *modern* (v2.x+, React, logs in at `/panel/api/login`) and *legacy* (v1.x, Vue, logs in at `/login`). `login()` auto-detects by trying modern first then falling back to legacy, and persists the detected `panelType` in the session. Controlled by the `panelType` constructor option (`'auto'` | `'modern'` | `'legacy'`). Modern panels also require a CSRF token fetched from `/csrf-token` before login, carried as `X-CSRF-Token`.
- **Two method families.** Methods are grouped by banner comments in `index.js`: **MODERN API METHODS** (`/panel/api/clients/...`, `/panel/api/nodes/...`, groups, custom geo) and **ORIGINAL/LEGACY API METHODS** (`/panel/api/inbounds/...`). Modern variants are typically named with a `Modern` infix (e.g. `getModernClientIps` vs legacy `getClientIps`). When adding an endpoint, place it in the correct family and follow the naming convention.
- **Two auth modes.** Cookie-based (username + password, with automatic session caching/refresh) **or** API token (`options.token` / `apiToken`, sent as a `Bearer` header, skips cookie login entirely).

### The request pipeline (`_request`)

All API methods funnel through `_request(method, path, data, extraHeaders)`. This is the single place that handles authentication, retries, and **stale-session recovery**, so behavior changes affecting auth belong here. Key invariants:

- **Cookie auth:** a stale session may surface as `401`, `404` (auth-gated route falls through to a not-found handler), or an HTTP `200` with an HTML login-page body. All three trigger one bounded, backed-off forced re-login + retry, governed by `maxLoginRetries` and `loginRetryBackoff`. Helpers: `_isStaleSessionError`, `_looksLikeLoginPage`, `_retryAfterRelogin`.
- **Token auth:** a `401` throws a clear "token invalid" error (no retry); a `404` is treated as a genuine missing resource and surfaces unchanged.
- Concurrent logins are serialized via a `loginMutex` in `_ensureAuthenticated`.

### `src/` modules

Wired into `module.exports` via **lazy getters** (`Object.defineProperties` at the bottom of `index.js`) specifically to avoid the circular dependency where `src/middleware/WebMiddleware.js` requires `index.js`.

- `session/SessionManager.js` — pluggable `SessionStore` abstraction. Defaults to in-memory; `createSessionManager(config)` supports database/redis-backed stores. Cookies are stored **plaintext** (admin-equivalent credentials) and session keys are deterministic by design — see README "Session Security".
- `security/SecurityEnhancer.js` — exports `InputValidator` (URL/username/password/payload validation applied in the constructor and on inputs), `SecureHeaders`, `SecurityMonitor` (in-memory rate limiting), `CredentialSecurity`, `ErrorSecurity`.
- `generators/CredentialGenerator.js` — UUIDs, reality keypairs, passwords, etc. per protocol.
- `builders/ProtocolBuilders.js` — fluent builders (`VLESSBuilder`, `VMESSBuilder`, `TrojanBuilder`, `ShadowsocksBuilder`, `WireGuardBuilder`) for constructing inbound/client configs.
- `middleware/WebMiddleware.js` — Express middleware, Next.js route helpers, and a React hook factory.
- `utils/ByteConversion.js` — `convertBandwidthFields`; `totalGB` values in client methods are auto-converted GB→bytes before hitting the API.

## Gotchas when editing

- **`index.d.ts` is hand-maintained.** Any change to a public method's signature or response shape must be mirrored there (the file is shipped as the package's types). Reuse the `ModernApiResponse<T>` envelope type for `{ success, msg, obj }` responses.
- **CommonJS only.** `package.json` declares `"type": "commonjs"` and `exports` route both `require` and `import` to `index.js`. A previous `index.mjs` ESM wrapper was removed (#8) because its runtime `require` was invisible to bundler file-tracing (Next.js standalone, esbuild, Rollup) — do **not** reintroduce a separate ESM entry.
- **`baseURL` must not end with `/panel`** — the library appends panel paths itself and will warn + auto-strip a trailing `/panel`.
- **Lint style is enforced** (see `eslint.config.js`): 4-space indent, single quotes, semicolons, `===` only, no `comma-dangle`, `_`-prefixed args are exempt from `no-unused-vars`. Run `npm run lint` before finishing.

## Documentation / wiki

There are **two copies of the wiki that must be kept byte-identical**: the in-repo `wiki/` folder, and the separate GitHub wiki repo (`3xui-api-client.wiki`, remote `…/3xui-api-client.wiki.git`, default branch `master`). Any doc change must be applied to **both** and committed/pushed separately — the in-repo copy lands on `main`, the wiki repo on its own `master`. When editing one, mirror the exact same change to the other.

> Note: some wiki pages (e.g. `System-Operations.md`) contain a stray non-text byte, so `file` reports them as `data` and plain `grep` skips them as binary — use `grep -a` to search those files.

## Release process

Releases are cut directly on `main`:
1. Bump `version` in `package.json` (`npm version <x.y.z> --no-git-tag-version` also updates the lockfile).
2. Move the `[Unreleased]` CHANGELOG section to the new version with today's date (Keep a Changelog format, semver).
3. Commit `chore: release vX.Y.Z`, tag `vX.Y.Z`, push branch + tag.
4. `gh release create vX.Y.Z` with notes; publishing to npm (`npm publish`) is a separate, manual step.
