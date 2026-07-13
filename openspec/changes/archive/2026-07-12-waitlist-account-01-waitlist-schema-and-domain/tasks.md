## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/waitlist-account-01-waitlist-schema-and-domain.md`, parent guide, `docs/product/features/waitlist.feature`, and `schema-overview.md` (`waitlist_entries`)
- [x] 1.2 Confirm Phase 6 `bookEvent`, eligibility helpers, and `createTxDb` exist and `@unveiled/db` typechecks

## 2. Schema and migration

- [x] 2.1 Add `packages/db/src/schema/waitlist-entries.ts` with `waitlist_status` enum (`WAITING` | `PROMOTED` | `CANCELLED`), columns per design, FKs `ON DELETE RESTRICT`, indexes `(event_id, created_at)` and `(user_id, created_at)`
- [x] 2.2 Add partial unique index on `(user_id, event_id) WHERE status = 'WAITING'`
- [x] 2.3 Export table/types from `schema/index.ts`; run `bun run db:generate`; review SQL for partial unique; commit migration under `packages/db/drizzle/`

## 3. Waitlist domain

- [x] 3.1 Create `packages/db/src/waitlist/` with typed `WaitlistError` codes
- [x] 3.2 Implement `joinWaitlist` — validate qty 1–3; create `WAITING` or return existing duplicate; handle unique-violation race
- [x] 3.3 Implement `cancelWaitlistEntry` — owner-scoped; only `WAITING` → `CANCELLED`
- [x] 3.4 Implement `listUserWaitlistEntries` — filter by `userId` only
- [x] 3.5 Implement `promoteWaitlistEntry` — book-then-mark via `bookEvent` with idempotency `waitlist-promote:{entryId}`; never mark `PROMOTED` before booking succeeds; map eligibility failures to `skipped_once`
- [x] 3.6 Implement `processWaitlistForEvent` — queue by `created_at` ASC; attempt entries whose qty fits; skip ineligible (`skipped_once`); stop when capacity exhausted; document book-then-mark in module comment
- [x] 3.7 Export waitlist API from `packages/db/src/waitlist/index.ts` and `@unveiled/db` package entry

## 4. Tests

- [x] 4.1 Add unit and/or integration tests for join + duplicate, cancel (owner + forbidden), list scoping
- [x] 4.2 Add tests for process queue order, skip-on-ineligible + `skipped_once`, partial capacity, promotion idempotency (no double-book)
- [x] 4.3 Skip integration tests cleanly when `DATABASE_URL` is unset (match booking integration pattern)

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 5.2 Run waitlist tests (e.g. `bun test packages/db/src/waitlist`) — pass or skip cleanly without DB
- [x] 5.3 Confirm no route/UI/email/Ladle/Playwright files were added in this step
- [x] 5.4 Mark step 01 done in `waitlist-account-parent-guide.md`; update `docs/product/` only if schema/behavior diverged (prefer aligning code to docs)
