## Why

Steps 01–02 shipped per-event list, Bookings-tab chrome, cancel-all (refund + waitlist close), and post-commit emails, but canonical `docs/product/` still describes only single-booking cancel (no refund + waitlist promotion) and has no Bookings tab. Until Gherkin, sitemap, pagination, coverage matrix, and Playwright match the shipped two-path behavior, CI proves the old contract and the parent feature cannot close.

## What Changes

- Add `docs/product/features/admin-event-bookings.feature` with the step-02 UI scenario titles plus **Member cannot open the Bookings tab**. Playwright `e2e/specs/admin-event-bookings.spec.ts` maps 1:1 (verbatim titles).
- Update `booking.feature`: DECISIONS two-path split (single cancel = no refund + promote; cancel-all = refund + close waitlist). Add cancel-all domain scenarios. Keep **Admin cancels a confirmed booking** asserting **no** credit refund.
- Update `waitlist.feature`: cancel-all closes `WAITING` and does not promote. Update `credits-subscription.feature`: `REFUND` is also produced by event cancel-all (`event-cancel-all:{bookingId}`).
- Sitemap: `/admin/bookings`, `/admin/events/:id/bookings`, `/admin/events/:id/bookings/cancel-all`; note Bookings tab; stop implying `/admin/bookings` is only export / cancel-under-users.
- Pagination page size 25 for `/admin/bookings` and `/admin/events/:id/bookings`. Patch `ui-component-map.md`, i18n inventory, authorization matrix if route rows need the new paths, `schema-overview.md` cancel-all paragraph (no schema change), `gaps-and-decisions.md` two-path row. `app-shell.md` only if admin tabs are listed (they are not today).
- Playwright: `admin-event-bookings.spec.ts` for the new feature file. Add booking.feature cancel-all titles to `booking.spec.ts` (shared helper OK). Waitlist + credits-subscription titles in their mapped spec files. Env-skips (`DATABASE_URL`, `E2E_ADMIN_*`) only — never `@skip-no-ui` for these MVP scenarios. Email scenarios skip with the existing no-inbox-harness rationale.
- Coverage-matrix rows for every new shipped scenario. Mark step 03 and the parent feature done.
- Out of scope: new domain behavior, extra email providers, event unpublish, partner portal, changing single-cancel refund policy, CSV export changes, new visual tokens.

## Capabilities

### New Capabilities

_(none — `admin-event-bookings` already exists from step 02)_

### Modified Capabilities

- `admin-event-bookings`: Canonical `docs/product/features/admin-event-bookings.feature`, sitemap, pagination, UI map, i18n inventory, authorization matrix, coverage matrix, and Playwright SHALL record the shipped Bookings tab, per-event list, cancel-all confirm UI, and ADMIN-only access. Members SHALL remain unable to open admin bookings routes. Playwright titles SHALL match Gherkin `Scenario:` lines verbatim.
- `booking`: Product Gherkin SHALL distinguish admin single-cancel (never auto-refunds; waitlist may promote) from event cancel-all (refunds charged credits; waitlist closed, not promoted). Playwright SHALL cover both paths so they cannot regress into each other. Schema overview and gaps-and-decisions SHALL describe the two-path cancel policy.
- `waitlist`: Canonical waitlist Gherkin SHALL state that event cancel-all sets every `WAITING` entry to `CANCELLED` and MUST NOT promote. Promotion remains triggered by single-booking cancel and capacity increase only.
- `credits-subscription`: Canonical credits Gherkin SHALL state that `REFUND` ledger rows are also written by event cancel-all when `total_credits > 0`, in addition to the existing admin manual goodwill refund. Single-booking admin cancel still MUST NOT write `REFUND`.

## Impact

- **Product SoT:** `docs/product/features/{admin-event-bookings,booking,waitlist,credits-subscription}.feature`, `docs/product/sitemap/sitemap.md`, `docs/product/extras/{pagination-and-search,content-i18n-inventory,authorization-matrix,gaps-and-decisions}.md`, `docs/product/ui/ui-component-map.md`, `docs/product/database/schema-overview.md`, `docs/product/testing/coverage-matrix.md`.
- **E2E:** new `e2e/specs/admin-event-bookings.spec.ts`; additions to `e2e/specs/booking.spec.ts`, `waitlist.spec.ts`, `credits-subscription.spec.ts`. Reuse `loginAdminForMembershipHq` / `settleAdminSession` / billing + waitlist fixtures. Seed an event with two CONFIRMED bookings (one paid, one comp if practical) plus a waitlist entry for cancel-all.
- **Runtime:** no intended behavior change. Domain (`cancelAllBookingsForEvent`), Bookings tab, confirm page, and emails already shipped in steps 01–02. Ladle `AdminTabNav` Bookings story already shipped in step 02 — verify, do not recreate.
- **Planning mirror:** `openspec/specs/{admin-event-bookings,booking,waitlist,credits-subscription}` via this change’s deltas (not product SoT).
- **Parent close-out:** `.dev-plan/current-iteration/admin-event-bookings-parent-guide.md` mark `admin-event-bookings-03-hardening` done; walk Release Criteria.
- **Source brief:** `.dev-plan/current-iteration/admin-event-bookings-03-hardening.md`
- **Parent:** `.dev-plan/current-iteration/admin-event-bookings-parent-guide.md`
- **Depends on:** `admin-event-bookings-02-admin-surfaces` (done / archived)
- **Consumed by:** closes the admin-event-bookings parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; `bun run test:e2e -- e2e/specs/admin-event-bookings.spec.ts e2e/specs/booking.spec.ts`; grep every `Scenario:` in `admin-event-bookings.feature` has a matching `test("Scenario: …")` title
