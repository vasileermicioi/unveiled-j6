## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/partner-list-and-sales-export-04-hardening.md`, parent guide Release Criteria, and this change’s proposal/design/specs
- [x] 1.2 Confirm shipped behavior from steps 01–03 (sort values `name`/`created`/`events`, Active = `date_time >= now` ∧ `remaining_capacity > 0`, tickets sold = `CONFIRMED`/`USED` by `created_at`) against live routes and main openspec specs
- [x] 1.3 Skim existing `admin-partners.feature`, `e2e/specs/admin-partners.spec.ts`, `coverage-matrix.md`, `sitemap.md`, `authorization-matrix.md`, `ui-component-map.md`, `gaps-and-decisions.md` for gaps only (do not edit post-MVP partner-and-checkin)

## 2. Gherkin and product docs

- [x] 2.1 Extend `docs/product/features/admin-partners.feature` with Name-filter, sort (all three modes, asc/desc), Active-events column, and Export-action scenarios (match existing Gherkin style)
- [x] 2.2 Add sales-export scenarios to the same feature file: valid-period tickets-sold table, CSV download, ADMIN-only guard
- [x] 2.3 Update `docs/product/sitemap/sitemap.md`: add `/admin/partners/export`; note partner list `q`/`sort`/`dir`/`page` and Active events column
- [x] 2.4 Update `docs/product/extras/authorization-matrix.md` for the sales-export route (ADMIN-only under `/admin/*` / partners area as appropriate)
- [x] 2.5 Update `docs/product/ui/ui-component-map.md` Partners row for Name filter, sort controls, Active events, Export → sales export
- [x] 2.6 Add `docs/product/extras/gaps-and-decisions.md` entries for Active-event and tickets-sold definitions
- [x] 2.7 Confirm `docs/product/features/post-mvp/partner-and-checkin.feature` is untouched

## 3. Playwright, seed, and coverage matrix

- [x] 3.1 Ensure `bun run seed:demo` provides partners/events/bookings usable for list + export assertions (extend seed only if the default period has no qualifying bookings)
- [x] 3.2 Add Playwright tests in `e2e/specs/admin-partners.spec.ts` with verbatim `Scenario:` titles for partner-list Name/sort/Active/Export (proximity/layout selectors only)
- [x] 3.3 Add Playwright tests for sales-export period table, CSV download headers/attachment, and ADMIN-only deny (or record named env/harness deferral with owner)
- [x] 3.4 Update `docs/product/testing/coverage-matrix.md` with a row for every new scenario (`pass` or named skip/deferred + notes)
- [x] 3.5 Cross-check: every new Gherkin Scenario has a matrix row and a matching Playwright `test("Scenario: …")` or documented deferral

## 4. Cleanup and parent close-out

- [x] 4.1 Grep for stale partner-list/export wording (missing export route, “title or partner” as partner-list placeholder in docs); leave events-list copy alone
- [x] 4.2 Mark `partner-list-and-sales-export-04-hardening` done in `.dev-plan/current-iteration/partner-list-and-sales-export-parent-guide.md` and walk parent **Release Criteria**
- [x] 4.3 Confirm canonical product + openspec planning artifacts are ready to archive (BDD coverage deltas fold into main `partner-catalog` / `booking` on archive)

## 5. Verification

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run `bun run seed:demo` (succeeds with partners/events/bookings for coverage)
- [x] 5.3 Run `bun run test:e2e -- e2e/specs/admin-partners.spec.ts` — new scenarios pass or env-skip with documented reason
- [x] 5.4 Prepare PR/handoff linking this change ID and the parent guide
