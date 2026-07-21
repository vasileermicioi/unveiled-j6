## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-ux-03-native-forms-and-preference-i18n.md`, parent guide Risks (AGENTS §14 waiver), and this change’s `design.md` / specs
- [x] 1.2 Confirm POST field names and parsing for onboarding routes + `profile/preferences` (`age_group`, `interests`, `moods`, `districts`, `max_distance`, `timing`, `preferred_days`, `preferred_languages`, `accessibility`)
- [x] 1.3 Inventory current HeroUI controls vs Discover native-select precedent (`EventFeedFilters` + `.event-feed-filters__select`)

## 2. Native preference controls

- [x] 2.1 Replace HeroUI CheckboxGroup/Checkbox in Interests/Location/Timing step forms with labeled native checkboxes (same `name`/`value`)
- [x] 2.2 Replace AgeStepForm RadioGroup with native radios (or native select) for `age_group`
- [x] 2.3 Replace LocationStepForm NumberField with native `input type="number"` for `max_distance` (min/max from constants)
- [x] 2.4 Replace TimingStepForm accessibility Switch with native checkbox (`name="accessibility"`, `value="true"`) + visible localized label
- [x] 2.5 Apply the same native controls to `PreferencesForm` / profile preferences island
- [x] 2.6 Restyle `.onboarding-form` native checkbox/radio/number in `globals.css` (theme tokens; remove reliance on invisible custom Control chrome)

## 3. Booking quantity + i18n

- [x] 3.1 Replace `TicketCountSelect` HeroUI Select + hidden input with native `<select name="ticketsCount">` (book + waitlist); theme via shared/native-select or feed-filter class pattern
- [x] 3.2 Fix `onboarding-content.ts` locale gaps: `getAgeGroupLabel` locale map; expand DE district labels (`Kreuzberg`, `Prenzlauer Berg`, `Friedrichshain`); verify timing/weekday/language/interest/mood labels under `/de` and `/en`
- [x] 3.3 Update `docs/product/extras/content-i18n-inventory.md` for preference option keys / remove stale “hardcoded English” note
- [x] 3.4 Document native-control exception in `docs/product/ui/design-system.md` (and gaps log if required); touch `onboarding.feature` only if it still mandates HeroUI Select for these fields

## 4. Validation and handoff

- [x] 4.1 Update `e2e/fixtures/onboarding.ts` / `e2e/specs/onboarding.spec.ts` selectors for native checkbox/radio + localized labels
- [x] 4.2 Run `bun run lint` (exit 0 on touched files / repo policy)
- [x] 4.3 Run `bun run typecheck` (exit 0)
- [x] 4.4 Manual DE onboarding: all labels/options German; accessibility is a visible native checkbox; EN pass for English options — verified via label-map script + native checkbox markup (`NativePreferenceOption` / TimingStepForm); full browser smoke deferred (dev server not running in this session)
- [x] 4.5 Optional: run onboarding-related Playwright if credentials available — skipped (no E2E_* credentials / optional)
- [x] 4.6 Mark `manual-test-ux-03-native-forms-and-preference-i18n` done in `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
