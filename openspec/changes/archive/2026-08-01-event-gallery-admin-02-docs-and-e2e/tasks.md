## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-gallery-admin-02-docs-and-e2e.md`, parent guide Release Criteria, and this change’s proposal/design/specs
- [x] 1.2 Confirm step 01 UI entry points exist: Events list gallery action + event edit gallery link; Featured convenience may remain; create-event has no gallery manage
- [x] 1.3 Skim stale surfaces: Featured-only Gherkin scenario, UI map “Featured list only”, image-uploads §8a Featured entry, DEPLOYMENT demo step 3, coverage-matrix + Playwright `Gallery manage is available from the featured list`

## 2. Gherkin and product docs

- [x] 2.1 Update `docs/product/features/admin-events.feature`: replace Featured-exclusive gallery manage scenario with Events list/edit entry (e.g. `Gallery manage is available from the Events catalog`); Featured MAY be optional convenience, not exclusive
- [x] 2.2 Update `docs/product/ui/ui-component-map.md` Events row: gallery manage entry from Events list and/or event edit (not Featured-only)
- [x] 2.3 Update `docs/product/extras/image-uploads.md` §8a: entry from Events list/edit; Featured shortcut optional
- [x] 2.4 Record/update decision in `docs/product/extras/gaps-and-decisions.md`: admin gallery manage is per-event from Events/edit; Featured is not required
- [x] 2.5 Update `apps/web/DEPLOYMENT.md` Event Gallery demo script: admin path via Events list/edit; public guest step may still use seeded featured theater demo
- [x] 2.6 Leave public `Featured demo event includes gallery` / seed host as-is unless seed host changes

## 3. Playwright and coverage matrix

- [x] 3.1 Rewrite gallery-entry Playwright test in `e2e/specs/admin-events.spec.ts`: assert manage from Events list or edit for a non-featured (or any) catalog event; remove Events `toHaveCount(0)` gallery-link assert; title matches new Gherkin `Scenario:` verbatim; proximity/layout selectors only
- [x] 3.2 Update `docs/product/testing/coverage-matrix.md`: rename/refocus gallery manage entry row to the new Scenario title (`pass` or R2 named env `skip`)
- [x] 3.3 Confirm remaining gallery Playwright scenarios (multi-upload, remove, reorder, capacity) still align with feature titles; no Featured-exclusive manage claim remains

## 4. Cleanup and parent close-out

- [x] 4.1 Grep for stale Featured-only gallery manage wording (`Featured list only`, `not on the Events list`, `Gallery manage is available from the featured list`, demo script exclusivity); clear docs/tests that assert Featured as sole entry
- [x] 4.2 Mark step 02 done in `.dev-plan/current-iteration/event-gallery-admin-parent-guide.md` and walk parent **Release Criteria**
- [x] 4.3 Confirm canonical product specs reflect per-event gallery admin entry (no remaining Featured-exclusive manage SoT)

## 5. Verification

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run `bun run test:e2e -- e2e/specs/admin-events.spec.ts` — gallery manage scenario(s) pass, or env-skip with documented reason
- [x] 5.3 Prepare PR/handoff linking this change ID and the parent guide
