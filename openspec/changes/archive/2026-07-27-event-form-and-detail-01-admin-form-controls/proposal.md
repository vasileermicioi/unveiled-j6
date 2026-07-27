## Why

Admin event create/edit still uses native `<select multiple>` for languages and target age groups (and series weekdays), which is awkward for multi-value pick. Onboarding already has a searchable checkbox multi-select; generalizing that pattern and prefilling address/map from the partner on add/series removes friction before public detail polish in later steps.

## What Changes

- Generalize `LanguageMultiSelect` into a shared checkbox multi-select island with optional search (thin language wrapper or `enableSearch`); keep onboarding/profile call sites working.
- Replace admin event `languages` (search on) and `target_age_groups` (search off) multi-selects in `EventAdminBaseFields` with the shared control.
- Replace series builder `builder_weekdays` multi `<select>` with the same non-search checkbox multi-select.
- Keep single-value fields on native `<select>` via `AdminFormSelect` (partner, category, neighborhood, ticket type, etc.).
- Extend `PartnerOption` with `address` (via `toPartnerOptions`); on **add/series only**, partner change prefills address and attempts Nominatim geocode → `EventGeoPicker` update (soft-fail).
- On **edit**, partner change must **not** overwrite address or map.
- Theme under existing onboarding/admin native control tokens in `globals.css` (layout + shared classes only).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `admin-events`: Multi-value event metadata (languages, age groups, series weekdays) uses native-checkbox multi-selects (search only for languages); partner change on create/series prefills address + map, edit does not.

## Impact

- **Islands:** `apps/web/app/islands/LanguageMultiSelect.tsx` → shared `CheckboxMultiSelect` (or equivalent) + thin wrappers / call-site updates in onboarding + profile.
- **Admin UI:** `EventAdminBaseFields.tsx`, `EventSeriesForm.tsx`, `EventGeoPicker.tsx`, `event-admin-types.ts`, `AdminFormSelect` stories (update or leave multiple mode with deferral note for step 03).
- **Helpers:** `apps/web/app/lib/admin-event-route-helpers.ts` (`PartnerOption` / `toPartnerOptions`); geocode helper under `apps/web/app/lib/` or beside the geo island.
- **Theme:** `apps/web/app/styles/globals.css` — shared checkbox multi-select classes for admin reuse.
- **Unchanged this step:** public event detail layout / partner logo (02); Gherkin / Playwright / design-system narrative sync (03); partner `lat`/`lng` schema; SSR mutation contracts; HeroUI `Select` / `Checkbox` for these fields.
- **Source brief:** `.dev-plan/current-iteration/event-form-and-detail-01-admin-form-controls.md`
- **Parent:** `.dev-plan/current-iteration/event-form-and-detail-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `event-form-and-detail-02-event-detail-layout` (indirect), `event-form-and-detail-03-hardening-and-docs`
- **Verification:** `bun run lint`; `bun run typecheck`; manual admin smoke (create partner prefill + edit no-overwrite + languages search + age groups no search); onboarding languages POST regression
