## Why

Steps 01–02 already shipped the shared `localStorage` draft helper on the event wizard, partner create/edit, event clone, and gallery add — but `AGENTS.md`, design-system Form controls, product Gherkin, Playwright, and the coverage matrix still do not state the add/edit draft rule. Until SoT and e2e match the shipped restore/discard/clear behavior, future forms will omit the helper and CI will not catch a wizard refresh regression. This final step closes the parent feature.

## What Changes

- Add an **AGENTS.md** hard rule: every SSR add/edit form MUST persist unsaved values in `localStorage` via the shared helper (`apps/web/app/lib/form-draft.ts`), restore on load/refresh, skip `File` inputs, clear on successful persist, and offer Discard.
- Document the same rule under design-system Form controls and the ui-component-map Events / Partners rows (event wizard + partner / clone / gallery add). Fix sitemap notes for create `/new/dates` and `/new/image`: GET SHALL render those steps (no redirect to step 1).
- Add Gherkin in `admin-events.feature` with locked titles `Refresh keeps unsaved event edits`, `Edit steps keep unsaved edits`, and `Successful event save clears draft`. Fold create GET `/:locale/admin/events/new/dates` (no redirect to step 1) into those scenarios — do not invent a fourth Playwright title.
- Add matching Playwright tests in `e2e/specs/admin-events.spec.ts` (verbatim titles; proximity/layout selectors; observable = event title). Unit serialize coverage already exists.
- Record a one-liner in `gaps-and-decisions.md`: drafts are `localStorage`, not cookies, not a DB table.
- Add coverage-matrix rows for the three new scenarios.
- Out of scope: new helper features; member onboarding/profile/booking drafts; cookie-consent changes; partner-feature Gherkin/e2e (event wizard is enough).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Product Gherkin (`admin-events.feature`), UI map Events/Partners rows, coverage matrix, and Playwright SHALL document and prove event-wizard draft restore, step-URL retention, Discard, successful-save clear, and create `/new/dates` GET without redirect to step 1. Playwright titles SHALL match Gherkin `Scenario:` lines verbatim. Drafts SHALL live in `localStorage`, not cookies.
- `design-system`: Product design-system Form controls and `AGENTS.md` SHALL state that SSR add/edit forms opt into the shared `localStorage` draft helper (`form-draft.ts`): restore after refresh, skip raw file inputs, clear on successful persist POST, and offer Discard. Search, delete-confirm, and auth forms are exempt.

## Impact

- **Product SoT:** `AGENTS.md` hard rules; `docs/product/features/admin-events.feature`; `docs/product/ui/design-system.md` Form controls; `docs/product/ui/ui-component-map.md` Events / Partners; `docs/product/sitemap/sitemap.md` create wizard GET notes; `docs/product/extras/gaps-and-decisions.md`; `docs/product/testing/coverage-matrix.md`.
- **E2E:** `e2e/specs/admin-events.spec.ts` — three new tests; reuse `adminLabels.title`, `goToEventFormStep` / `page.goto` for step URLs, Discard copy `Entwurf verwerfen` / `Discard draft`. No `data-testid`.
- **Runtime helper / islands:** no intended behavior change. Steps 01–02 already ship `form-draft.ts`, `FormDraftPersistence`, and mounts. Do not add helper features.
- **Parent close-out:** mark `02-form-draft-persistence-03-hardening` done in `.dev-plan/current-iteration/02-form-draft-persistence-parent-guide.md`; walk Release Criteria.
- **Planning mirrors:** `openspec/specs/{admin-events,design-system}` via this change’s deltas (not product SoT). Runtime draft rules already live in `openspec/specs/event-catalog` from steps 01–02.
- **Source brief:** `.dev-plan/current-iteration/02-form-draft-persistence-03-hardening.md`
- **Parent:** `.dev-plan/current-iteration/02-form-draft-persistence-parent-guide.md`
- **Depends on:** `02-form-draft-persistence-02-remaining-admin-forms` (done / archived)
- **Consumed by:** closes the form-draft-persistence parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; Playwright `e2e/specs/admin-events.spec.ts` tests titled exactly as the new Gherkin scenarios — pass when `DATABASE_URL` / `E2E_ADMIN_*` are set (R2 skip only where a full save needs an image)
