## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/onboarding-prefs-02-accessibility-and-languages.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm prerequisites exist: `TimingStepForm.tsx`, `PreferencesForm.tsx`, `PREFERRED_LANGUAGES` in `@unveiled/auth/constants`, `getOnboardingCopy` / `getPreferredLanguageLabel`, timing validation in `packages/auth/src/onboarding.ts`
- [x] 1.3 Grep for `PREFERRED_LANGUAGES`, `Non-Verbal`, `accessibilitySectionLabel`, `accessibilityOptionLabel`, `getEventLanguageOptions` consumers to list every touchpoint

## 2. Auth allowlist and validation

- [x] 2.1 Expand `PREFERRED_LANGUAGES` (DE/EN first + curated codes from step brief); remove `Non-Verbal`
- [x] 2.2 Add `EVENT_LANGUAGES = ["DE", "EN"]` (or equivalent small admin set); export both from `@unveiled/auth`
- [x] 2.3 Confirm timing + cultural-preferences validation uses `PREFERRED_LANGUAGES` and rejects `Non-Verbal` / unknown codes
- [x] 2.4 Update `packages/auth` unit tests (`onboarding.test.ts`, `profile.test.ts`) for expanded allowlist and rejection of `Non-Verbal`
- [x] 2.5 Brief note in `packages/auth/README.md` that member prefs use `PREFERRED_LANGUAGES` and admin events use `EVENT_LANGUAGES`

## 3. Copy, labels, and admin options

- [x] 3.1 Update accessibility copy keys: EN `Accessibility needed?` / `Yes`, DE `Barrierefreiheit benötigt?` / `Ja`
- [x] 3.2 Expand `languageLabels` / `getPreferredLanguageLabel` for every new language code; remove `Non-Verbal` labels
- [x] 3.3 Add minimal DE/EN filter placeholder (or aria-label) copy for the searchable control
- [x] 3.4 Add helper to order options: DE, EN first, then A–Z by locale label
- [x] 3.5 Point `getEventLanguageOptions` at `EVENT_LANGUAGES`; fix any admin tests that assumed `Non-Verbal` on events
- [x] 3.6 Fix `onboarding-content` unit tests for new accessibility strings and full language label coverage

## 4. Searchable language UI

- [x] 4.1 Build searchable language multi-select under `apps/web/app/islands/` (native filter input + native checkboxes; no HeroUI Select; no server search)
- [x] 4.2 Ensure selected languages still POST when they do not match the active filter (selected strip or always-mounted selected inputs)
- [x] 4.3 Wire the control into `TimingStepForm` and `PreferencesForm` (replace three language checkboxes)
- [x] 4.4 Theme filter + options via existing onboarding form classes / `globals.css` tokens (layout Tailwind only)
- [x] 4.5 Update stories/fixtures that still assume the old three-option language set

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` (exit 0)
- [x] 5.2 Run `bun run typecheck` (exit 0)
- [x] 5.3 Run auth + onboarding-content unit tests covering language allowlist + accessibility boolean
- [x] 5.4 Optional smoke: empty filter shows DE/EN first; filter “ger” / “deu” surfaces German among matches
- [x] 5.5 Confirm interests Other and Gherkin/e2e/product SoT were not changed (deferred to steps 03/04)
- [x] 5.6 Mark step done in `.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`; note Gherkin/e2e/product SoT updates for step 04
