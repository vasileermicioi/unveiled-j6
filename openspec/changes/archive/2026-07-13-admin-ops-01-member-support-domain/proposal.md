## Why

Phase 8 Membership HQ needs package-level admin member support before any SSR routes land. Credits, ledger types (`ADMIN_ADJUST`, `REFUND`), and subscription statuses already exist, but there are no domain exports to list/search members, load detail “intel,” adjust or refund credits, or freeze/unfreeze (`UNPAID` ↔ `ACTIVE`). This step ships those testable APIs so later admin UI and mutation pages can call packages only.

## What Changes

- Add admin member domain under `packages/db` (e.g. `src/admin/` or `src/members/`): `listMembers`, `getMemberDetail`, `adjustMemberCredits`, `refundMemberCredits` with typed errors (reject zero adjust; keep credits ≥ 0)
- Add freeze/unfreeze next to subscription writes (`@unveiled/billing` or `@unveiled/db`): set status `UNPAID` / restore `ACTIVE` without clearing Stripe IDs; preserve plan, payment method, and billing address
- Export public APIs from package `index.ts`; add co-located unit/integration tests
- Sort member list by name then email; support filter by name, email, or role (query params wired later in UI steps)
- **No** SSR admin routes, comp ticket, booking cancel, waitlist admin, GDPR, Ladle, or Playwright in this step

## Capabilities

### New Capabilities

- `admin-users`: Admin-only domain operations for Membership HQ — list/search members, load detail aggregates (preferences, history counts, available behavior fields), credit adjust via `ADMIN_ADJUST`, support `REFUND` ledger entries decoupled from booking cancel, and freeze/unfreeze subscription status while preserving Stripe identifiers

### Modified Capabilities

- _(none)_ — ledger enum and webhook “do not clear `UNPAID`” rules already shipped; this step adds admin writers that consume them without changing Stripe lifecycle requirements

## Impact

- **Code:** `packages/db` (member list/detail + credit adjust/refund); freeze/unfreeze in `@unveiled/billing` or `@unveiled/db` beside existing subscription writes; public exports; no `apps/web` routes or UI
- **Database:** no new tables/migrations — uses existing `users`, `subscriptions`, `credit_ledger`, bookings/waitlist/saved counts
- **Downstream:** Consumed by `admin-ops-02-capacity-ops-domain`, `admin-ops-03-membership-hq-ui`, `admin-ops-04-admin-mutation-pages`
- **Docs:** step plan in `.dev-plan/current-iteration/admin-ops-01-member-support-domain.md`; mark step 01 done in `admin-ops-parent-guide.md` after apply; update `docs/product/` only if behavior must diverge from `admin-users.feature` / `credits-subscription.feature`
- **Out of scope:** UI routes; comp ticket; booking cancel; waitlist admin; GDPR anonymize/delete; Playwright / Ladle
