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
npm run lint                      # ESLint with semistandard + Prettier
npm run format                    # Format code with Prettier
npm run format:check              # Check formatting without writing
```

CI runs lint, tests, and `npm audit` against Node 16/18/20.

## Architecture

**Data flow:** User options → URL/body construction → HTTP request (got + cookie jar + throttling) → HTML/JSON parsing → field extraction via declarative mappings → structured result object.

**Entry point** (`index.js`): Exports all 10 scraper methods plus constants. `memoized()` returns cached versions of all methods sharing a single memoized `appMethod`.

**Scraper methods** (`lib/*.js`): Each method (app, list, search, developer, reviews, similar, permissions, datasafety, suggest, categories) is a standalone module returning a Promise. The `search` method receives `appMethod` via `R.partial` to enrich results with full app details.

**Data extraction** (`lib/utils/scriptData.js`): Parses JavaScript data embedded in HTML `<script>` tags. Uses declarative **field mappings** — arrays of nested indices like `[1, 2, 51, 0, 1]` — to navigate deeply nested response structures via `R.path()`. Mappings support fallback paths for when Google changes their schema.

**Search** (`lib/search.js`): Uses `/store/search` (not `/work/search`) so the `price` filter (free/paid/all) works. Store search uses ds:4 structure; pagination is limited to ~30 results (first page) as the store uses a different pagination API than the batchexecute endpoint. Roadmap for dual store/work search, charts, and discovery: [docs/SEARCH_AND_DISCOVERY_PLAN.md](docs/SEARCH_AND_DISCOVERY_PLAN.md).

**Request layer** (`lib/utils/request.js`): Wraps `got` with a persistent `CookieJar` (required for pagination) and optional throttling. Most methods POST to Google Play's `/data/batchexecute` endpoint with encoded nested-JSON payloads.

**Pagination** (`lib/utils/processPages.js`): Token-based pagination for list/search/reviews. Reviews also support bulk retrieval mode.

**Throttling** (`lib/utils/throttle.js`): Decorator pattern — wraps the request function with a sliding-window rate limiter (configurable slots/interval).

## Code Style

- Semicolons required (semistandard)
- 2-space indentation, LF line endings, UTF-8
- Heavy use of Ramda (`R.path`, `R.map`, `R.assoc`, `R.partial`)
- All async code is Promise-based (no async/await in the codebase)
- Debug logging via `debug` module with per-module scoped loggers

## Key Patterns

- **Mapping declarations**: When Google changes their response structure, the fix is usually updating the numeric path arrays in the mapping objects (e.g., `{ score: ['ds:5', 1, 2, 51, 0, 1] }` in `lib/app.js`).
- **`search` depends on `appMethod`**: Unlike other methods, search is partially applied with `appMethod` to fetch full details for each result.
- **Tests hit live Google Play**: Tests are integration tests making real HTTP requests — they can be flaky due to network/rate-limiting. Some have extended timeouts (up to 200s).
