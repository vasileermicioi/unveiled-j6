## Why

Onboarding step 4 and profile Vibes still present accessibility as “ACCESSIBILITY?” / “Required” and languages as three checkboxes including Non-Verbal. Members need a clear **“Accessibility needed?”** yes-checkbox and a **searchable multi-select language list** (German and English first; no Non-Verbal) so preference capture matches the product brief.

## What Changes

- Reword accessibility section/question to EN `Accessibility needed?` / DE `Barrierefreiheit benötigt?`; option label EN `Yes` / DE `Ja` (checked → `accessibility: true`).
- **BREAKING** (preference allowlist): remove `Non-Verbal` from `PREFERRED_LANGUAGES`; unknown codes (including `Non-Verbal`) rejected on next timing/preferences save.
- Expand `PREFERRED_LANGUAGES` to a curated static language-code list with **`DE` and `EN` first**, remaining codes sorted by locale display label at render time.
- Replace language checkboxes on onboarding timing + profile Vibes with a **client island**: FE-only text filter + multi-select that posts `preferred_languages` on SSR form submit (native checkboxes / hidden inputs; no HeroUI `Select`; no server search API).
- Add DE/EN labels for the expanded set in `onboarding-content.ts`.
- Split admin event language options from member prefs if admin currently shares `PREFERRED_LANGUAGES` — introduce a smaller `EVENT_LANGUAGES` (keep admin event metadata compact) rather than listing every spoken language in admin.
- Update unit tests, stories, and fixtures that still use `Non-Verbal` or the old three-option set.
- Defer Gherkin/e2e/product-SoT rewrites to step 04 (except this change’s OpenSpec deltas).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-onboarding`: Timing step accessibility chrome uses the new question + Yes/Ja checkbox; preferred languages are a searchable multi-select over an expanded allowlist (DE/EN pinned first; Non-Verbal not offered).
- `member-profile`: Vibes/preferences editor mirrors the same accessibility copy and searchable language multi-select; validation uses the same `PREFERRED_LANGUAGES` allowlist.

## Impact

- **Constants / validation:** `packages/auth/src/constants.ts` (`PREFERRED_LANGUAGES`, new `EVENT_LANGUAGES` if split), `onboarding.ts` / `profile.ts` allowlist checks, exports in `index.ts`; unit tests `onboarding.test.ts`, `profile.test.ts`.
- **UI:** `TimingStepForm.tsx`, `PreferencesForm.tsx` — wire searchable language island; accessibility labels from updated copy.
- **Island:** new client component under `apps/web/app/islands/` for filter + multi-select (client state only; form POST unchanged).
- **Copy / labels:** `apps/web/app/lib/onboarding-content.ts` (+ tests) — accessibility keys + expanded `languageLabels`.
- **Admin:** `getEventLanguageOptions` in `admin-content.ts` — switch to `EVENT_LANGUAGES` so event metadata stays a smaller set.
- **Unchanged this step:** interests Other; districts/travel (step 01); feed ranking; server-side language search; full Gherkin/Playwright/i18n inventory (step 04).
- **Source brief:** `.dev-plan/current-iteration/onboarding-prefs-02-accessibility-and-languages.md`
- **Parent:** `.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`
- **Depends on:** `onboarding-prefs-01-districts-and-travel` (merged)
- **Consumed by:** `onboarding-prefs-03-interests-other`
- **Verification:** `bun run lint`, `bun run typecheck`, auth/content unit tests for language allowlist + accessibility boolean
