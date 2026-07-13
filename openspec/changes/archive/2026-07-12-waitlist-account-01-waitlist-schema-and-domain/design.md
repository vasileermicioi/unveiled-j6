## Context

Phase 6 shipped `bookEvent`, eligibility helpers, `createTxDb` (Neon Pool + `SELECT … FOR UPDATE`), and `bookings` / `credit_ledger`. Sold-out bookings hard-reject; there is no waitlist table or domain yet.

Phase 7 step 01 adds persistence + package-level waitlist logic only. Product SoT: `docs/product/features/waitlist.feature`, `docs/product/database/schema-overview.md` (`waitlist_entries`). Step plan: `.dev-plan/current-iteration/waitlist-account-01-waitlist-schema-and-domain.md`. Parent: `waitlist-account-parent-guide.md`.

Domain boundary (vision-and-domains): **Booking** is the only writer of purchase bookings / `BOOKING` ledger rows; waitlist promotion **calls** `bookEvent` — it must not duplicate capacity/credit logic. Auth gates live at call sites (step 02+); domain functions assume a trusted `userId`.

`bookEvent(db, input)` always opens its **own** `db.transaction(…)` on a `TxDb`. Nested interactive transactions are not supported by that API.

## Goals / Non-Goals

**Goals:**

- Drizzle `waitlist_entries` + enum + indexes + partial unique `(user_id, event_id) WHERE status = 'WAITING'`.
- Domain: `joinWaitlist`, `cancelWaitlistEntry`, `listUserWaitlistEntries`, `processWaitlistForEvent`, `promoteWaitlistEntry`.
- Promotion via `bookEvent` with per-entry idempotency (`waitlist-promote:{entryId}`); queue by `created_at` ASC; skip ineligible (`skipped_once`); stop when capacity exhausted.
- Never leave `PROMOTED` without a corresponding booking.
- Unit/integration tests; public exports from `@unveiled/db`.

**Non-Goals:**

- SSR routes `/events/:id/waitlist`, `/waitlist/:id/cancel`.
- Promotion email / Resend.
- Profile / billing pages; admin waitlist UI.
- Wiring `updateEvent` capacity hook or seed sold-out event (step 02).
- Ladle / Playwright.
- Changing `bookEvent`’s transaction API to accept an outer `tx` (optional follow-up; not required if promotion uses book-then-mark).

## Decisions

### 1. Schema file and constraints

Add `packages/db/src/schema/waitlist-entries.ts`; re-export from `schema/index.ts`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK `defaultRandom()` | |
| `eventId` | FK → `events.id` `ON DELETE RESTRICT` | |
| `userId` | FK → `users.id` `ON DELETE RESTRICT` | text, matches users PK |
| `requestedQty` | integer NOT NULL | domain validates 1–3 (same as booking) |
| `status` | enum `WAITING` \| `PROMOTED` \| `CANCELLED` | |
| `skippedOnce` | boolean NOT NULL default false | set on ineligible promotion attempt |
| `createdAt` / `updatedAt` | timestamptz | |

**Indexes:**

- `(event_id, created_at)` — queue order
- `(user_id, created_at)` — member list
- **Partial unique:** `(user_id, event_id) WHERE status = 'WAITING'` — one active wait per user+event

```ts
uniqueIndex("waitlist_entries_user_event_waiting_uidx")
  .on(table.userId, table.eventId)
  .where(sql`${table.status} = 'WAITING'`);
```

Verify generated SQL uses a partial unique index; if Drizzle emits a full unique, fix with custom SQL in the migration.

**Rationale:** Matches schema-overview + `waitlist.feature` duplicate-join decision. Partial unique is the DB half of “one WAITING row”; domain still checks-and-returns existing on duplicate join for a friendly result.

### 2. Domain module layout

```
packages/db/src/waitlist/
  index.ts
  errors.ts              # WaitlistError codes
  join-waitlist.ts
  cancel-waitlist-entry.ts
  list-user-waitlist-entries.ts
  process-waitlist-for-event.ts
  promote-waitlist-entry.ts
  waitlist.unit.test.ts
  waitlist.integration.test.ts  # skip cleanly if DATABASE_URL unset
```

Export from `@unveiled/db` via `export * from "./waitlist"` (same pattern as booking).

**Alternatives:** New `@unveiled/waitlist` package — rejected (overkill; booking already lives under `@unveiled/db`). Domain in `apps/web` — rejected (AGENTS: business logic in packages).

### 3. Transaction nesting: book-then-mark (no outer wrap around `bookEvent`)

**Chosen approach:** each promotion attempt is a short sequence:

1. Load candidate `WAITING` entry (and optionally re-check current `remaining_capacity` before attempting).
2. Call `bookEvent(txDb, { userId, eventId, ticketsCount: requestedQty, idempotencyKey: \`waitlist-promote:${entryId}\` })`.
3. On **success** (`created: true` or idempotent hit): update entry → `PROMOTED` (only if still `WAITING`).
4. On **ineligibility** (`INELIGIBLE_SUBSCRIPTION`, `PAST_DUE`, `INSUFFICIENT_CREDITS`, `USER_NOT_FOUND`): leave `WAITING`, set `skippedOnce = true`, continue to next entry.
5. On **`SOLD_OUT`**: stop the processor (capacity exhausted for this qty / remaining).
6. On other hard errors: surface/throw; do not mark `PROMOTED`.

Document this in a module-level comment on `process-waitlist-for-event.ts` / `promote-waitlist-entry.ts`.

**Why not nest `bookEvent` inside an outer waitlist transaction?**

- `bookEvent` always calls `db.transaction(…)`; nesting is undefined / unsupported with the current Pool client.
- Changing `bookEvent` to accept an optional outer `tx` is a larger Phase 6 API change; defer unless book-then-mark proves racy in practice.

**Failure handling / invariants:**

- Never set `PROMOTED` before `bookEvent` succeeds.
- If booking commits but status update fails: retry is safe — same idempotency key returns existing booking; processor updates status to `PROMOTED`.
- If status were wrongly set to `PROMOTED` without booking: forbidden by this ordering; tests assert booking exists when status is `PROMOTED`.

**Alternatives considered:**

- Refactor `bookEvent` to accept `tx` — cleaner atomicity, more churn; out of scope unless needed.
- Mark `PROMOTED` first then book — rejected (partial `PROMOTED` without booking).

### 4. `processWaitlistForEvent` vs `promoteWaitlistEntry`

| Function | Behavior |
|---|---|
| `processWaitlistForEvent(txDb, eventId)` | Load `WAITING` for event ordered by `created_at` ASC; while capacity may remain, try each entry whose `requestedQty` fits current remaining capacity (re-read capacity between attempts or after each book); skip oversized qty without marking skipped (leave WAITING, continue — quantity doesn’t fit *yet*); apply skip rules only for eligibility failures |
| `promoteWaitlistEntry(txDb, entryId)` | Single-entry promote for Phase 8 admin; may ignore queue order; same book-then-mark path |

Return a small result type, e.g. `{ promoted: BookEventResult[]; skipped: string[]; stoppedReason?: "CAPACITY" | "EMPTY" }` so step 02 can email without re-querying blindly.

**Queue / partial capacity:**

- Attempt strictly in join-time order.
- If entry’s `requestedQty` > remaining capacity: **do not** set `skipped_once`; leave `WAITING` and try later entries only if a *smaller* later request could fit — **product nuance:** `waitlist.feature` says “earliest eligible whose requested ticket count fits”. So skip over entries that don’t fit capacity **without** `skipped_once`, continue to next that fits; stop when no further entry’s qty fits remaining capacity (or after a successful promote that exhausts capacity). Prefer: while iterating in order, if qty > remaining, continue to next; if qty ≤ remaining, attempt book; on SOLD_OUT race, stop.

### 5. Join and cancel semantics

**`joinWaitlist(db, { userId, eventId, requestedQty })`:**

- Validate `requestedQty` ∈ {1,2,3}.
- If existing `WAITING` for same user+event → return `{ entry, created: false }` (no second row).
- Else insert `WAITING`, `skippedOnce: false`.
- Catch unique-violation from partial index as duplicate → re-fetch and return existing.
- Does **not** require sold-out check in domain (UI enforces in step 02); optional soft check OK but not required this step.

**`cancelWaitlistEntry(db, { entryId, userId })`:**

- Load entry; require `entry.userId === userId` and `status === WAITING`; else typed error.
- Set `CANCELLED`; excluded from promotion queries (`status = WAITING` only).

**`listUserWaitlistEntries(db, userId)`:**

- Filter `user_id = userId` only (never leak other users).

Join/cancel/list MAY use `createDb` (HTTP) or `TxDb`; promotion **must** use `TxDb` because `bookEvent` requires it.

### 6. Errors and tests

Typed `WaitlistError` codes e.g. `NOT_FOUND`, `FORBIDDEN`, `NOT_WAITING`, `INVALID_QTY`, `DUPLICATE` (optional if duplicate is soft-return).

Tests mirror booking package:

- Unit: pure helpers / error mapping if any; mock-free where possible.
- Integration (gated on `DATABASE_URL`): join + duplicate, cancel, process queue order, skip ineligible + `skipped_once`, partial capacity, promote idempotency key does not double-book.

Skip integration cleanly when `DATABASE_URL` unset (same pattern as `book-event.integration.test.ts`).

## Risks / Trade-offs

- **[Book-then-mark race: capacity between book and mark]** → Mitigation: `bookEvent` already locks event row; idempotency key prevents double-book; status update is idempotent (`WHERE status = 'WAITING'`).
- **[Partial unique index Drizzle support]** → Mitigation: inspect generated migration SQL; hand-edit if needed; add integration test for duplicate WAITING insert.
- **[Skipping oversized qty vs stopping]** → Mitigation: follow feature wording — attempt earliest whose qty **fits**; oversized entries stay WAITING without `skipped_once`; document in module comment.
- **[Promotion trigger not wired in this step]** → Acceptable: export processors for step 02 capacity hook and Phase 8 cancel path.
- **[No email on promote]** → Step 02 responsibility; processor returns promoted booking ids for later notification.

## Migration Plan

1. Add schema file + exports.
2. `bun run db:generate` → review partial unique SQL → commit under `packages/db/drizzle/`.
3. Implement domain + tests; export from package index.
4. `bun run lint`, `bun run typecheck`, `bun test packages/db/src/waitlist` (or package filter).
5. Apply migration on staging when deploying the branch; rollback = reverse migration (drop table/enum) if needed before dependents ship.

## Open Questions

- None blocking apply: book-then-mark and partial unique are decided above. If Neon rejects the generated partial index syntax during apply, fix migration SQL in-repo (do not drop uniqueness).
