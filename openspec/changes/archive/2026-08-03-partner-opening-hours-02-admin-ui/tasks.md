## 1. Setup / confirm inputs

- [x] 1.1 Confirm step 01 exports (`hasOpeningHours`, `openingHours`, `OPENING_HOURS_DAY_KEYS`, `INVALID_OPENING_HOURS`) and that create/edit routes omit hours today
- [x] 1.2 Skim parent guide non-goals (no public display, list column, overnight spans — those are step 03 / out of scope)

## 2. Form model and parsing

- [x] 2.1 Extend `PartnerFormValues` / `PartnerFormDefaults` with `hasOpeningHours` and per-day closed/open/close (or a week shape)
- [x] 2.2 Add pure POST ↔ domain helpers: parse `has_opening_hours`, `closed_<day>`, `open_<day>`, `close_<day>`; when toggle off return `{ hasOpeningHours: false, openingHours: null }`; when on assemble full week for catalog write
- [x] 2.3 Normalize `type="time"` values to `HH:MM`; treat missing closed checkbox as not closed
- [x] 2.4 Unit-test enable/disable mapping, closed days, open/close pairs, and invalid assemblies (no R2)

## 3. Admin UI (create / edit)

- [x] 3.1 Add native opening-hours toggle + Mon–Sun rows to `PartnerForm` (HeroUI layout; native checkbox + `input type="time"`; disable times when closed)
- [x] 3.2 Reveal weekday block when toggle is checked (island local state); submit remains form POST
- [x] 3.3 Prefill edit from stored partner; round-trip defaults on POST validation error
- [x] 3.4 Add DE/EN labels, weekday names, hints, and `fieldErrors.openingHours` in `admin-content.ts`; map `INVALID_OPENING_HOURS` in `mapCatalogErrorCode`

## 4. Route wiring and verification

- [x] 4.1 Pass parsed hours into `createPartner` / `updatePartner` on new + edit POST handlers
- [x] 4.2 Run `bun run lint`, `bun run typecheck`, and form-mapper unit tests — all exit 0
- [x] 4.3 Mark this step done in `.dev-plan/current-iteration/partner-opening-hours-parent-guide.md` (leave public event detail / product Gherkin for step 03)
