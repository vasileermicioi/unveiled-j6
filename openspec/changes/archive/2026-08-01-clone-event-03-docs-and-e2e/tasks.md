## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/clone-event-03-docs-and-e2e.md`, parent guide Release Criteria, and this change’s proposal/design/specs
- [x] 1.2 Confirm step 02 is merged/archived and runtime has clone at `/:locale/admin/events/:id/clone` with list/edit entry points; series route absent
- [x] 1.3 Skim stale surfaces: series Gherkin scenarios, sitemap `series/new`, UI map “series”, design-system series weekdays, coverage-matrix series rows, Playwright series tests, `e2e/README` series notes

## 2. Gherkin and product docs

- [x] 2.1 Update `docs/product/features/admin-events.feature`: remove series-create scenarios (manual slots, date-range builder); add clone scenarios (`Clone event from catalog list`, entry points; voucher inventory reject when practical); clear “series create” wording in image/Markdown/form scenarios
- [x] 2.2 Update `docs/product/sitemap/sitemap.md`: replace `/admin/events/series/new` with `/admin/events/:id/clone`
- [x] 2.3 Update `docs/product/ui/ui-component-map.md` Events row: SSR CRUD + clone (not series)
- [x] 2.4 Update `docs/product/ui/design-system.md` Form controls: drop series-builder weekdays example; keep languages/age groups
- [x] 2.5 Record decision in `docs/product/extras/gaps-and-decisions.md`: series removed, clone added, voucher inventory not copied; note shared-image delete reference-count gap
- [x] 2.6 Update `apps/web/DEPLOYMENT.md` (and i18n inventory if series strings remain documented) for clone-only admin duplication
- [x] 2.7 Update `packages/db/README.md` exports list if it still lists `createEventSeries` / series helpers

## 3. Playwright and coverage matrix

- [x] 3.1 Remove series Playwright tests from `e2e/specs/admin-events.spec.ts` (manual slots, date-range, series heading navigations)
- [x] 3.2 Add clone happy-path Playwright coverage with verbatim Gherkin titles and proximity/layout selectors (`SECRET_CODE` preferred)
- [x] 3.3 Add voucher inventory reject on clone when practical; otherwise named coverage-matrix deferral (not “UI not built”)
- [x] 3.4 Update `docs/product/testing/coverage-matrix.md`: remove/mark-removed series rows; add clone rows (`pass` or named env `skip`)
- [x] 3.5 Clear stale series guidance in `e2e/README.md` if still present

## 4. Cleanup and parent close-out

- [x] 4.1 Grep for stale `series/new`, `createEventSeries`, “event series” product claims (and series builder weekdays); clear docs/comments that assert series as current MVP
- [x] 4.2 Mark step 03 done in `.dev-plan/current-iteration/clone-event-parent-guide.md` and walk parent **Release Criteria**
- [x] 4.3 Ensure canonical product specs reflect clone-only duplication (no remaining required series-create SoT)

## 5. Verification

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run admin-events e2e covering clone (no series scenarios) — pass, or document environment blockers / named skips with assertions committed
- [x] 5.3 Prepare PR/handoff linking this change ID and the parent guide
