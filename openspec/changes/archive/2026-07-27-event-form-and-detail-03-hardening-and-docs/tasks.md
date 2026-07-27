## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-form-and-detail-03-hardening-and-docs.md`, parent guide Release Criteria / Risks, and this change’s proposal/design/specs
- [x] 1.2 Confirm steps 01–02 are merged/archived and runtime artifacts exist (checkbox multi-select, partner prefill, `EventDetailPage` two-row + partner attribution)
- [x] 1.3 Confirm `AdminFormSelect` `selectionMode="multiple"` has no production call sites (only stories/deferral note)

## 2. Gherkin and product docs

- [x] 2.1 Update `docs/product/features/admin-events.feature` for checkbox multi-select languages/age groups/series weekdays and add-only partner address/map prefill (edit non-overwrite)
- [x] 2.2 Update `docs/product/features/event-discovery.feature` for lg+ two-row detail layout and partner logo/name attribution (not a floating hero badge)
- [x] 2.3 Sync Event detail entry in `docs/product/ui/ui-component-map.md` to two-row layout + partner attribution; keep booking-eligibility / qty / gating notes
- [x] 2.4 Sync `docs/product/ui/design-system.md` Form controls: single-value native `<select>`; multi-value allowlists → checkbox multi-select (optional search); deprecate `<select multiple>` as preferred multi-value pattern for new admin work
- [x] 2.5 Add a short decision row to `docs/product/extras/gaps-and-decisions.md` (multi-select pattern + add-only partner prefill + detail layout)
- [x] 2.6 Update `docs/product/extras/content-i18n-inventory.md` only if new user-visible strings from 01–02 are missing

## 3. Playwright and coverage matrix

- [x] 3.1 Extend `e2e/specs/admin-events.spec.ts` with scenarios/titles aligned to Gherkin: languages/age groups checkbox UX; add/series address prefill; edit partner non-overwrite (proximity selectors only; do not require live Nominatim success)
- [x] 3.2 Extend `e2e/specs/event-discovery.spec.ts` for partner attribution (name + logo when fixture allows) and detail layout smoke (identity / checkout / hero / description); proximity selectors only
- [x] 3.3 Update `docs/product/testing/coverage-matrix.md` rows for all new scenarios (pass or explicit deferral with owner/phase — address prefill must not be silently skipped)

## 4. Cleanup, ops notes, and parent close-out

- [x] 4.1 Remove unused `AdminFormSelect` `selectionMode="multiple"` API and update/delete the Multiple story (point at checkbox multi-select)
- [x] 4.2 Document Nominatim/geocode soft-fail + address-only fallback in `apps/web/DEPLOYMENT.md` and/or parent Risks (no new secrets)
- [x] 4.3 Mark step 03 done in `.dev-plan/current-iteration/event-form-and-detail-parent-guide.md` and walk parent **Release Criteria** (all true or named deferral)

## 5. Verification

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Targeted Playwright for admin prefill + languages/age groups UX and public detail partner attribution / layout smoke — pass, or document environment blockers with assertions committed
- [x] 5.3 Confirm no temporary layout/copy TODOs remain without a named deferral; prepare PR/handoff linking this change and the parent guide
