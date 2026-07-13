## Why

Phase 8 admin capacity ops need package-level cancel, waitlist admin, and comp-ticket helpers before SSR mutation pages. Booking already supports `skipCreditCharge`, and waitlist already has `promoteWaitlistEntry` / `processWaitlistForEvent`, but there is no admin cancel (capacity restore + waitlist trigger, no auto-refund), no admin waitlist list query, and no thin `createCompTicket` wrapper. This step ships those domain exports so later admin routes call packages only.

## What Changes

- Add `cancelBookingAsAdmin` — only `CONFIRMED` → `CANCELLED`; restore event remaining capacity by ticket count; **no** credit refund / `REFUND` ledger; call `processWaitlistForEvent` for that event
- Add admin waitlist list query (filter by `eventId`, `status`, pagination) including skip-history fields
- Wire manual promote to existing `promoteWaitlistEntry` for a chosen entry id (out-of-queue support path)
- Add `createCompTicket` wrapper around `bookEvent({ skipCreditCharge: true })` — capacity enforced, no charge ledger row
- Co-located unit/integration tests; public exports from `@unveiled/db`
- **No** SSR admin routes, Membership HQ UI, GDPR, Ladle, or Playwright in this step

## Capabilities

### New Capabilities

- _(none)_ — behavior extends existing booking, waitlist, and credits-subscription domains

### Modified Capabilities

- `booking`: Admin cancellation of `CONFIRMED` bookings with capacity restore, waitlist processing trigger, and no credit refund as part of cancel
- `waitlist`: Admin waitlist listing (status + skip history) and manual promote of a specific `WAITING` entry via the shared promotion path
- `credits-subscription`: Comp-ticket domain helper that creates a confirmed booking through the shared booking transaction with `skipCreditCharge` semantics

## Impact

- **Code:** `packages/db` — admin cancel + waitlist-admin list + comp helper (likely under `src/admin/` next to step-01 member support, reusing `booking/` and `waitlist/`); public exports; no `apps/web` routes or UI
- **Database:** no new tables/migrations — uses existing `bookings`, `events`, `waitlist_entries`, `users`, `credit_ledger`
- **Upstream:** Depends on `admin-ops-01-member-support-domain` (merged); Phase 7 booking/waitlist modules
- **Downstream:** Consumed by `admin-ops-04-admin-mutation-pages`, `admin-ops-05-ladle-e2e`
- **Docs:** step plan in `.dev-plan/current-iteration/admin-ops-02-capacity-ops-domain.md`; mark step 02 done in `admin-ops-parent-guide.md` after apply; update `docs/product/` only if behavior must diverge from `booking.feature` / `waitlist.feature` / `credits-subscription.feature`
- **Out of scope:** UI; GDPR delete; member self-cancel; partner check-in; Membership HQ list/detail UI (step 03)
