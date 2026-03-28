# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Node.js scraper for Google Play Store data. ES module (`"type": "module"`). Not actively maintained — the parser breaks when Google changes their Play Store HTML layout.

## Commands

```bash
npm test                          # Run all tests (Vitest, 5s default timeout)
npm test -- test/lib.app.js       # Run a single test file
npm test -- -t "pattern"          # Run tests with titles matching pattern
npm run test:watch                # Vitest watch mode
npm run lint                      # ESLint 9 flat (@eslint/js recommended + Prettier)
npm run format                    # Format code with Prettier
npm run format:check              # Check formatting without writing
```

CI runs lint and tests on Node 20/22 (Vitest 4 requires Node ≥ 20) (tests retried up to 3× for Play Store flakiness). `npm audit --audit-level=critical` must pass (blocks the job on critical issues only).

## Architecture

**Data flow:** User options → URL/body construction → HTTP request (got + cookie jar + throttling) → HTML/JSON parsing → field extraction via declarative mappings → structured result object.

**Entry point** (`index.js`): Exports all 10 scraper methods plus constants. `memoized()` returns cached versions of all methods sharing a single memoized `appMethod`. Memoization uses memoizee with `normalizer: JSON.stringify` and `promise: true`. `app()` shallow-clones options and **deep-clones** `requestOptions` so callers are not mutated and cache keys stay stable.

**Scraper methods** (`lib/*.js`): Each method (app, list, search, developer, reviews, similar, permissions, datasafety, suggest, categories) is a standalone module returning a Promise. The `search` method receives `appMethod` via `R.partial` to enrich results with full app details.

**Data extraction** (`lib/utils/scriptData.js`): Parses JavaScript data embedded in HTML `<script>` tags. Uses declarative **field mappings** — arrays of nested indices like `[1, 2, 51, 0, 1]` — to navigate deeply nested response structures via `R.path()`. Mappings support fallback paths for when Google changes their schema. `AF_dataServiceRequests` blobs are evaluated in an isolated `node:vm` context with a timeout (not global `eval`); do not point this scraper at untrusted HTML.

**Search** (`lib/search.js`): Uses `/store/search` (not `/work/search`) so the `price` filter (free/paid/all) works. Store search uses ds:4 structure; pagination is limited to ~30 results (first page) as the store uses a different pagination API than the batchexecute endpoint. Roadmap for dual store/work search, charts, and discovery: [docs/SEARCH_AND_DISCOVERY_PLAN.md](docs/SEARCH_AND_DISCOVERY_PLAN.md).

**Request layer** (`lib/utils/request.js`): Wraps `got` with a persistent `CookieJar` (required for pagination) and optional throttling. Most methods POST to Google Play's `/data/batchexecute` endpoint with encoded nested-JSON payloads.

**Pagination** (`lib/utils/processPages.js`): Token-based pagination for list/search/reviews. Reviews also support bulk retrieval mode.

**Throttling** (`lib/utils/throttle.js`): Decorator pattern — wraps the request function with a sliding-window rate limiter (configurable slots/interval).

## Code Style

- Formatting via Prettier; ESLint uses `@eslint/js` recommended (no style preset beyond that)
- 2-space indentation, LF line endings, UTF-8
- Heavy use of Ramda (`R.path`, `R.map`, `R.assoc`, `R.partial`)
- All async code is Promise-based (no async/await in the codebase)
- Debug logging via `debug` module with per-module scoped loggers

## Key Patterns

- **Mapping declarations**: When Google changes their response structure, the fix is usually updating the numeric path arrays in the mapping objects (e.g., `{ score: ['ds:5', 1, 2, 51, 0, 1] }` in `lib/app.js`).
- **`search` depends on `appMethod`**: Unlike other methods, search is partially applied with `appMethod` to fetch full details for each result.
- **Tests**: Most suites hit live Google Play (integration) and can flake on rate limits; some use long timeouts. **Unit / fast tests** live beside them: `test/utils.scriptData.js`, `test/utils.mappingHelpers.js`, `test/utils.throttle.js` (fake timers, no network), and `test/lib.memoized.js` (mocked HTTP + HTML fixture under `test/fixtures/`).
