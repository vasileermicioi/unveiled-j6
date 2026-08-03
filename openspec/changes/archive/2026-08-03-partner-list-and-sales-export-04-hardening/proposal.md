## Why

Steps 01–03 shipped partner-list Name filter, sort/active-events UI, and the ADMIN sales-export page + CSV, but product Gherkin, Playwright, the coverage matrix, sitemap, auth matrix, and decision log still omit that behavior. Without SoT and regression coverage, agents and CI cannot verify the feature and the parent guide cannot close.

## What Changes

- Extend `docs/product/features/admin-partners.feature` with scenarios for the **Name** filter label, three sort modes (asc/desc), the **Active events** column, and the list **Export** action.
- Add sales-export scenarios (in `admin-partners.feature` or a dedicated `docs/product/features/admin-sales-export.feature`) for period selection, per-event tickets-sold table, CSV download, and ADMIN-only guard.
- Add/update Playwright coverage in `e2e/specs/admin-partners.spec.ts` and/or `e2e/specs/admin-sales-export.spec.ts` using proximity/layout selectors; record any env-gated deferral with owner.
- Update `coverage-matrix.md`, `sitemap.md` (export route + list sort/active notes), `authorization-matrix.md` (export route), `ui-component-map.md` as needed, and `gaps-and-decisions.md` (**Active event** + tickets-sold definitions).
- Confirm canonical `openspec/specs/partner-catalog` and `openspec/specs/booking` already hold steps 01–03 behavior; add BDD/e2e coverage requirements via this change’s deltas (fold into main specs on archive).
- Mark step 04 done and walk parent **Release Criteria**.
- Out of scope: new product behavior beyond 01–03; events-list page changes; partner portal / check-in (post-MVP).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `partner-catalog`: Product Gherkin, Playwright (or named deferral), coverage matrix, sitemap, and related docs SHALL cover the partner-list **Name** filter, sort modes + directions, **Active events** column, and **Export** action.
- `booking`: Product Gherkin, Playwright (or named deferral), coverage matrix, and related docs SHALL cover the sales-export page (period, tickets-sold table, CSV, ADMIN-only guard).

## Impact

- **Product SoT:** `docs/product/features/admin-partners.feature` (+ optional `admin-sales-export.feature`), `sitemap/sitemap.md`, `ui/ui-component-map.md`, `testing/coverage-matrix.md`, `testing/bdd-and-e2e.md` (if gaps list needs a pointer), `extras/authorization-matrix.md`, `extras/gaps-and-decisions.md`.
- **E2E:** `e2e/specs/admin-partners.spec.ts` and/or new `admin-sales-export.spec.ts`; demo seed (`bun run seed:demo`) for partners/events/bookings fixtures.
- **Canonical openspec:** delta → fold into `openspec/specs/partner-catalog/spec.md` and `openspec/specs/booking/spec.md` on archive (domain requirements from 01–03 already present).
- **Unchanged:** partner-list domain/UI, sales-export domain/route implementation, events list, post-MVP partner portal.
- **Source brief:** `.dev-plan/current-iteration/partner-list-and-sales-export-04-hardening.md`
- **Parent:** `.dev-plan/current-iteration/partner-list-and-sales-export-parent-guide.md` (closes the feature when done)
- **Depends on:** `partner-list-and-sales-export-03-sales-export` (archived)
- **Consumed by:** closes the partner-list-and-sales-export parent feature
- **Verification:** `bun run typecheck`; `bun run lint`; `bun run seed:demo`; `bun run test:e2e` for partner-list + sales-export scenarios (pass or named skip); Gherkin ↔ coverage-matrix cross-check
