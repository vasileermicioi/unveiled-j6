## Why

Steps 01–02 already shipped `cloneEvent` and the ADMIN SSR clone UI, and removed series create from the app — but product Gherkin, sitemap, UI map, design-system form-control notes, coverage matrix, Playwright, and DEPLOYMENT still describe `/admin/events/series/new` and series builders as current MVP behavior. Until SoT and e2e match the shipped clone-only workflow, agents and CI keep verifying the wrong admin contract and the parent feature cannot close.

## What Changes

- Replace series routes/scenarios with clone in product SoT: `admin-events.feature`, sitemap, UI component map, design-system series-weekday mentions, gaps-and-decisions, DEPLOYMENT.
- Remove Playwright series tests (manual-slot + date-range); add clone happy-path coverage (+ voucher inventory reject when practical); update coverage matrix (removed — not “UI not built”).
- Grep docs/code comments for stale `series/new` / `createEventSeries` product claims; clear them.
- Update `packages/db/README.md` exports list if it still lists series APIs.
- Record decision: series removed, clone added, voucher inventory not copied on clone; note known image-delete reference-count gap from parent Risks.
- Out of scope: new recurrence/RRULE builders; partner-portal clone; domain/UI behavior already shipped in 01–02.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Product docs (`admin-events.feature`, sitemap, UI component map) SHALL document `/admin/events/:id/clone` and SHALL NOT document `/admin/events/series/new` or series builders as current MVP behavior; include clone acceptance scenarios.
- `bdd-and-e2e`: Playwright SHALL cover clone-event happy path (and voucher inventory requirement when practical) with proximity/layout selectors; series manual-slot and date-range scenarios SHALL be removed from the suite and coverage matrix (or marked removed — not skipped as “UI not built”).
- `design-system`: Form-control notes SHALL drop series-builder weekdays as an example of checkbox multi-select; keep languages/age-groups examples.
- `event-catalog`: Automated browser-coverage and related admin-catalog requirements SHALL describe clone (not series create); sitemap/docs alignment SHALL no longer treat series create as a current MVP route.

## Impact

- **Product SoT:** `docs/product/features/admin-events.feature`, `docs/product/sitemap/sitemap.md`, `docs/product/ui/{ui-component-map,design-system}.md`, `docs/product/extras/{gaps-and-decisions,content-i18n-inventory}.md` (if series strings remain), `docs/product/testing/coverage-matrix.md`, `apps/web/DEPLOYMENT.md`.
- **E2E:** `e2e/specs/admin-events.spec.ts` (+ fixtures/README notes); remove series scenarios; add clone scenario(s) with verbatim Gherkin titles; proximity/layout selectors only.
- **Package docs:** `packages/db/README.md` exports if still listing `createEventSeries` / series helpers.
- **Parent close-out:** mark `clone-event-03` + parent guide done; walk Release Criteria.
- **Planning mirrors:** `openspec/specs/{admin-events,bdd-and-e2e,design-system,event-catalog}` via this change’s deltas (not product SoT).
- **Unchanged:** `cloneEvent` domain rules and clone SSR UI from 01–02; public discovery/booking; partner portal.
- **Source brief:** `.dev-plan/current-iteration/clone-event-03-docs-and-e2e.md`
- **Parent:** `.dev-plan/current-iteration/clone-event-parent-guide.md`
- **Depends on:** `clone-event-02-admin-ui` (done)
- **Consumed by:** closes the clone-event parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; admin-events e2e (clone scenario; no series scenarios) — pass or documented skip
