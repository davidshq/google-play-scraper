# Search modes & app discovery — implementation plan

This document describes how to support **two search backends**, how **charts** fit in, and **other discovery paths** already available (or to add) in this library.

## Context

| Approach | Endpoint / mechanism | Strengths | Weaknesses |
|----------|----------------------|-----------|------------|
| **Store search** (current default) | `/store/search?c=apps&…&price=…` + `ds:4` HTML parsing | **`price`** (`free` / `paid` / `all`) matches consumer Play Store | ~**30** results per query without further pagination research |
| **Work search** (upstream pattern) | `/work/search` + `qnKhOb` batchexecute | Up to **~250** results | **Price filter** ineffective (Play for Work catalog skews free) |

---

## Phase 1 — Dual `search` modes

**Goal:** One `search()` API with an explicit mode so callers choose volume vs. price accuracy.

### API sketch

- Add `searchMode: 'store' | 'work'` (default `'store'` to keep current behavior).
- **`price`:** document that it only applies when `searchMode === 'store'`.
- **`num`:** document that values **> 30** are only useful for `searchMode === 'work'` until store pagination exists.

### Implementation

1. Refactor `lib/search.js`:
   - Shared: validation, `term`, `num`, `lang`, `country`, `throttle`, `cache`, `fullDetail`, `getPriceGoogleValue`.
   - **Store path:** existing URL, `skipClusterPage`, `STORE_*` mappings, `checkFinished` (may still cap at first page).
   - **Work path:** `/work/search`, `WORK_*` mappings, existing `checkFinished` + `qnKhOb` pagination.
2. Update `index.d.ts` for the new option.
3. Tests: matrix — store + `price: 'paid'`; work + `num: 55`; defaults unchanged.

### Optional later

- `searchMode: 'auto'` — e.g. use **store** when `price` is `free` or `paid`, **work** when `num > 30` and `price === 'all'` (document edge cases).

---

## Phase 2 — Documentation: charts vs search

**Charts are not search.** They answer “top apps in a collection/category,” not “apps matching keyword X.”

- **`list({ collection, category, num, … })`** — `vyAe2` batchexecute (`lib/list.js`). Collections e.g. `TOP_FREE`, `TOP_PAID`, `GROSSING`; categories from `constants.category`. Large `num` (e.g. 500) is already supported for charts.
- **`categories()`** — ids for driving systematic chart crawls.

**README / CLAUDE.md:** short subsection “When to use `list` vs `search`” with the table above.

---

## Phase 3 — Discovery graph (mostly already implemented)

Ways to find apps **without** text search, or to **expand** from a seed:

| Method | Role |
|--------|------|
| **`similar({ appId })`** | Similar apps/games from the app detail surface |
| **`developer({ devId })`** | All apps from a publisher (`developerId` from `app()` or list/search rows) |
| **`list({ collection, category })`** | Top charts by segment |
| **`suggest({ term })`** | Autocomplete strings → more search queries |
| **`app({ appId })`** | Full detail; pivots to `developer`, genre, category for `list` |

**Optional helper (future):** e.g. `discover({ seedAppId, maxApps })` — merge `similar` + `developer` + optional `list` with dedupe by `appId` (or document a cookbook example instead of a new API).

---

## Phase 4 — Research spike (optional)

- Capture browser network on `/store/search` when loading more results; identify RPC + payload if stable.
- If found, wire store pagination without dropping `price` — would lift the ~30 cap for **store** mode.

---

## Suggested implementation order

1. Phase 1 — `searchMode` + tests + types.
2. Phase 2 — README + `CLAUDE.md` cross-links.
3. Phase 3 — README “Discovery cookbook” or optional `discover` helper.
4. Phase 4 — as needed for store pagination.

---

## References in this repo

- `lib/search.js` — search
- `lib/list.js` — charts (`vyAe2`)
- `lib/similar.js`, `lib/developer.js`, `lib/suggest.js`, `lib/app.js`, `lib/categories.js`
- `lib/utils/processPages.js` — `checkFinished` / `qnKhOb` (work search pagination)
