## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-form-and-detail-01-admin-form-controls.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm prerequisites exist: `LanguageMultiSelect.tsx`, `AdminFormSelect.tsx`, `EventAdminBaseFields.tsx`, `EventSeriesForm.tsx`, `EventGeoPicker.tsx`, `event-admin-types.ts`, `toPartnerOptions`, partners.address
- [x] 1.3 Skim `docs/product/ui/design-system.md` Form controls and AGENTS.md §14 native-control rules

## 2. Shared checkbox multi-select

- [x] 2.1 Extract/generalize `LanguageMultiSelect` into a shared `CheckboxMultiSelect` island with optional search (`enableSearch` / omit filter UI) and `{ value, label }` options
- [x] 2.2 Keep a thin `LanguageMultiSelect` wrapper (or update onboarding + profile call sites) so preferred-languages POST + filter behavior stay intact
- [x] 2.3 Theme the shared control under existing onboarding/admin native control tokens in `globals.css` (layout + shared classes; no per-route colors)

## 3. Admin event / series wiring

- [x] 3.1 Replace `languages` (search on) and `target_age_groups` (search off) `AdminFormSelect` multiple usages in `EventAdminBaseFields` with the shared control
- [x] 3.2 Replace series `builder_weekdays` multi `<select>` in `EventSeriesForm` with non-search checkbox multi-select
- [x] 3.3 Keep single-value fields on native `AdminFormSelect`; update or defer `AdminFormSelect` multiple stories with a step-03 cleanup note if left

## 4. Partner address + map prefill

- [x] 4.1 Extend `PartnerOption` with `address` in `event-admin-types.ts` and `admin-event-route-helpers.ts`; pass through `toPartnerOptions`
- [x] 4.2 Make address field updatable on partner change (controlled value or remount key) for create/series only (`isEdit !== true`)
- [x] 4.3 Add Berlin-biased Nominatim geocode helper under `apps/web/app/lib/` (or beside geo island); soft-fail on error/timeout
- [x] 4.4 Extend `EventGeoPicker` (or parent) to accept external lat/lng updates when partner changes; skip geocode/overwrite entirely when `isEdit`

## 5. Verification and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0 for touched packages)
- [x] 5.2 Manual smoke: create → pick partner → address fills and map moves when geocode succeeds; edit → change partner → address/map unchanged; languages filter works; age groups toggle without search
- [x] 5.3 Regression smoke: onboarding timing languages still POST correctly
- [x] 5.4 Mark step 01 done in `event-form-and-detail-parent-guide.md`; note Nominatim outcome for step 03 Risks; defer product-spec/BDD sync to step 03
