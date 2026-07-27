## Why

Steps 01–02 already ship admin checkbox multi-selects, add-only partner location prefill, and the public event detail two-row layout with partner attribution — but product Gherkin, Playwright, UI docs, and design-system form-control rules still describe the older patterns. Until those are aligned and dead `AdminFormSelect` multiple API is cleaned, agents and e2e will verify the wrong UX. This final Event form & detail slice closes the release loop.

## What Changes

- Update `docs/product/features/admin-events.feature` for checkbox multi-select languages/age groups (and series weekdays) plus add-only partner address/map prefill (edit does not overwrite).
- Update `docs/product/features/event-discovery.feature` for lg+ two-row detail layout and partner logo/name attribution (not a floating hero badge).
- Align Playwright specs/titles with Gherkin (`Scenario: …`); cover address prefill on add, edit non-overwrite, and public detail partner attribution where fixtures allow logos; proximity selectors only.
- Sync `ui-component-map.md` Event detail entry to the two-row layout + partner attribution.
- Sync `design-system.md` Form controls: single-value → native `<select>`; multi-value preference/admin lists → native checkbox multi-select (optional search); deprecate native `<select multiple>` as the preferred multi-value pattern for new admin work.
- Add a short decision row to `gaps-and-decisions.md` (multi-select pattern + add-only partner prefill + detail layout); update content-i18n inventory only if new user-visible strings need indexing.
- Remove or update dead `AdminFormSelect` `selectionMode="multiple"` path/stories if nothing remains.
- Document Nominatim/geocode outcome for operators (`DEPLOYMENT.md` and/or parent Risks): address-only soft-fail; no new secrets; live Nominatim not required in CI.
- Update coverage-matrix rows for new scenarios (pass or named deferral with owner/phase); mark step 03 + parent release criteria done.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `admin-events`: Product Gherkin + Playwright (or named coverage-matrix deferral) MUST cover checkbox multi-select languages/age groups/series weekdays and add-only partner address/map prefill (edit non-overwrite).
- `event-discovery`: Product Gherkin + Playwright (or named deferral) MUST cover the two-row public detail layout and partner logo/name attribution in the identity area.
- `design-system`: Form-control guidance MUST prefer native checkbox multi-selects for multi-value allowlists; native `<select multiple>` is no longer the preferred pattern for new multi-value admin fields; single-value choice fields stay on native `<select>`.

## Impact

- **Product SoT:** `docs/product/features/admin-events.feature`, `docs/product/features/event-discovery.feature`, `docs/product/ui/ui-component-map.md`, `docs/product/ui/design-system.md`, `docs/product/extras/gaps-and-decisions.md`, optionally `docs/product/extras/content-i18n-inventory.md`, `docs/product/testing/coverage-matrix.md`.
- **E2E:** `e2e/specs/admin-events.spec.ts`, `e2e/specs/event-discovery.spec.ts` (proximity/layout selectors only per `bdd-and-e2e.md`).
- **Code cleanup:** `AdminFormSelect` multiple mode + `AdminFormSelect.stories.tsx` if unused after 01.
- **Deploy / ops:** `apps/web/DEPLOYMENT.md` and/or parent Risks note for Nominatim soft-fail / address-only fallback (no new env secrets).
- **Parent close-out:** `.dev-plan/current-iteration/event-form-and-detail-parent-guide.md`.
- **Planning mirrors:** `openspec/specs/admin-events`, `event-discovery`, `design-system` via this change’s deltas (not product SoT).
- **Unchanged this step:** new feature work beyond polish/fixes found while hardening; partner `lat`/`lng` schema; partner portal; Phase 6+ booking/waitlist changes; HeroUI `Select`/`Checkbox` for these fields.
- **Source brief:** `.dev-plan/current-iteration/event-form-and-detail-03-hardening-and-docs.md`
- **Parent:** `.dev-plan/current-iteration/event-form-and-detail-parent-guide.md`
- **Depends on:** `event-form-and-detail-01-admin-form-controls`, `event-form-and-detail-02-event-detail-layout` — done/archived
- **Consumed by:** closes the Event form & detail parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; targeted Playwright for admin prefill + languages/age groups UX and public detail partner attribution / layout smoke (or document environment blockers); parent Release Criteria walkthrough
