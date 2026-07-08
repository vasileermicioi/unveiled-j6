## Why

Admin partner and event list routes shipped in catalog-03/04 with search and pagination wired in the UI, but the domain layer and form controls have gaps: partner lists have no stable sort order, partner search still matches contact email (not what admins expect), the shared search form may not submit `q` reliably with HeroUI primitives, and pagination can show empty pages when `page` exceeds the filtered result set. This follow-up hardens list discovery before catalog-05 public surfaces depend on a trustworthy admin catalog.

## What Changes

- **Sort order:** `/admin/partners` and `/admin/events` list rows **newest first** — `created_at DESC`, `id DESC` tie-break per `pagination-and-search.md`.
- **Partner search:** `?q=` matches **partner name only** (drop contact-email ILIKE).
- **Event search:** keep `?q=` ILIKE on **event title** and denormalized **partner name**; verify count filter matches list filter.
- **Search form fix:** `AdminSearchForm` uses `TextField` + `Input` with `name="q"` so GET submissions include the term (same class of bug as partner address textarea).
- **Pagination hardening:** clamp or redirect when `page` exceeds total pages; preserve `q` in prev/next links; integration tests for offset/limit/count alignment.
- **Domain tests:** `@unveiled/db` tests for `listPartners`, `listEvents`, `countPartners`, `countEvents` covering order, search, and pagination.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Admin partner and event list ordering, search scope, and pagination behavior.

## Impact

- **Packages:** `@unveiled/db` — `listPartners`, `listEvents`, `countPartners`, `countEvents`, `partnerSearchCondition`; new or extended catalog integration tests.
- **App:** `AdminSearchForm`, `admin-list.ts` (page clamping), partner/events list routes if redirect-on-clamp is route-level.
- **Docs:** `.dev-plan/current-iteration/catalog-04-admin-list-search-pagination.md` (sibling of catalog-04 CRUD step); optional one-line update to `pagination-and-search.md` partner search column.
- **Out of scope:** Member `/events` feed, `/admin/users` search, partner portal guest list, keyset/cursor pagination, progressive-enhancement auto-submit.
