## Why

Phase 7 needs waitlist join, self-cancel, and automatic promotion, but `@unveiled/db` has no `waitlist_entries` table or domain layer yet. Phase 6 already shipped `bookEvent` and the transactional client; this step adds persistence and package-level waitlist logic that **calls the same booking transaction on promotion**, so later UI/email (step 02) and admin capacity hooks can reuse one mergeable domain without inventing a second booking path.

## What Changes

- Add Drizzle schema `public.waitlist_entries` (`WAITING` | `PROMOTED` | `CANCELLED`, `requested_qty`, `skipped_once`) with indexes and a partial unique constraint for one active `WAITING` row per `(user_id, event_id)`
- Generate and commit migration SQL under `packages/db/drizzle/`; export schema from `@unveiled/db`
- Implement waitlist domain in `packages/db/src/waitlist/`: `joinWaitlist`, `cancelWaitlistEntry`, `listUserWaitlistEntries`, `processWaitlistForEvent`, `promoteWaitlistEntry`
- Promotion **must** call `bookEvent` (idempotency key per entry, e.g. `waitlist-promote:{entryId}`); never duplicate capacity/credit/ledger writes
- Unit/integration tests for join/duplicate, cancel, queue order, skip-on-ineligible, partial capacity
- **No** SSR waitlist routes, promotion email, profile/billing, admin UI, Ladle, Playwright, or seed sold-out event (those are later steps)

## Capabilities

### New Capabilities

- `waitlist`: Persist waitlist entries and provide join/cancel/list/promotion domain functions that promote via `bookEvent`, with queue order, skip-on-ineligible (`skipped_once`), and owner-scoped cancel

### Modified Capabilities

- _(none)_ — `bookEvent` requirements stay as shipped in Phase 6; waitlist consumes that API without changing booking persistence rules

## Impact

- **Code:** `packages/db` only — schema, migration, `src/waitlist/*`, public exports; no `apps/web` routes or UI
- **Database:** new `waitlist_entries` table/enum/indexes/partial unique on Neon `public`; no `neon_auth` modeling
- **Downstream:** Consumed by `waitlist-account-02-waitlist-ui-and-email` (routes + capacity hook + email) and Phase 8 admin promote/cancel paths via exported processors
- **Docs:** step plan already lives in `.dev-plan/current-iteration/`; mark step 01 done in `waitlist-account-parent-guide.md` after apply; update `docs/product/` only if code must diverge from schema-overview / `waitlist.feature`
- **Out of scope:** waitlist SSR pages, Resend promotion email, profile/billing, admin waitlist HQ, seed sold-out event, Ladle, Playwright
