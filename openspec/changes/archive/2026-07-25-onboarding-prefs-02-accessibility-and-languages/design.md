## Context

Parent feature: Onboarding preference options (`.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`). This is child step 02; depends on merged `onboarding-prefs-01-districts-and-travel`.

Today onboarding step 4 (`TimingStepForm`) and profile Vibes (`PreferencesForm`) show:

- Accessibility as section `ACCESSIBILITY?` / `BARRIEREFREIHEIT?` with option chip `Required` / `Erforderlich` (boolean `accessibility`).
- Languages as three native checkboxes from `PREFERRED_LANGUAGES = ["DE", "EN", "Non-Verbal"]`.

Admin event language options reuse the same constant via `getEventLanguageOptions` → `PREFERRED_LANGUAGES.map(...)`.

Constraints: SSR form POST only; HeroUI for labels/layout; native controls for choice fields (AGENTS.md §14 — no HeroUI `Select`); client islands only where filter state requires it; business logic/allowlists in `@unveiled/auth`; theme via existing onboarding form classes / `globals.css`; no server search API; Gherkin/e2e deferred to step 04.

## Goals / Non-Goals

**Goals:**

- Accessibility question copy: EN `Accessibility needed?` / DE `Barrierefreiheit benötigt?`; option EN `Yes` / DE `Ja`.
- Expand member `PREFERRED_LANGUAGES`; remove `Non-Verbal`; reject it and unknown codes in validation.
- Searchable multi-select language UI (FE filter only) on timing + profile; DE/EN pinned first when filter empty; remaining options A–Z by locale label.
- Split admin event languages into `EVENT_LANGUAGES` so admin is not forced to list the full member catalog.
- Unit tests + content tests + fixtures updated.

**Non-Goals:**

- Interests Other (step 03); product Gherkin / Playwright / i18n inventory / schema-overview polish (step 04).
- Server-side language search or autocomplete API.
- Feed ranking from language preferences.
- Batch migration of profiles that stored `Non-Verbal`.
- Changing timing / weekday / age / mood / interest option sets.

## Decisions

1. **Accessibility is copy-only; persistence unchanged**
   - **Choice:** Update `accessibilitySectionLabel` and `accessibilityOptionLabel` in `getOnboardingCopy`. Keep native checkbox posting `accessibility=true` when checked; parsers/`parseBooleanField` and `accessibility: boolean` validation stay as today.
   - **Rationale:** Brief only changes chrome and option wording, not the boolean model.
   - **Alternatives:** Rename field or use radio Yes/No — unnecessary churn.

2. **`PREFERRED_LANGUAGES` curated static codes; DE/EN first in the constant**
   - **Choice:** Replace the three-item array with at least:
     `DE`, `EN`, then `AR`, `BG`, `CS`, `DA`, `EL`, `ES`, `FA`, `FI`, `FR`, `HE`, `HI`, `HR`, `HU`, `IT`, `JA`, `KO`, `NL`, `NO`, `PL`, `PT`, `RO`, `RU`, `SV`, `TR`, `UK`, `VI`, `ZH` (implementer may extend). Constant order keeps DE/EN first; UI sorts the remainder by locale label when rendering.
   - **Rationale:** Parent guide + step brief; no external catalog dependency.
   - **Alternatives:** `Intl.DisplayNames` without a fixed allowlist — weaker validation; full ISO dump — noisy UX.

3. **Split `EVENT_LANGUAGES` for admin event metadata**
   - **Choice:** Add `EVENT_LANGUAGES = ["DE", "EN"] as const` (spoken event languages admin already effectively offered minus `Non-Verbal`). Point `getEventLanguageOptions` at `EVENT_LANGUAGES`. Member prefs / validation keep using `PREFERRED_LANGUAGES`. Export both from `@unveiled/auth`.
   - **Rationale:** Admin currently maps `PREFERRED_LANGUAGES`; expanding that constant would dump ~30 languages into event forms. Brief prefers split.
   - **Alternatives:** Share full member list in admin — rejected by brief; keep `Non-Verbal` only on events — possible later, but step brief removes Non-Verbal from member prefs and does not require keeping it for events; defer reintroduction to a product ask.

4. **Searchable language island: filter + native checkboxes inside the form**
   - **Choice:** New island (e.g. `LanguageMultiSelect.tsx` under `apps/web/app/islands/`) that receives `locale`, option list `{ code, label }[]` (already sorted: DE, EN, then A–Z by label), `name="preferred_languages"`, and selected codes. Client state = filter string only. Visible options = case-insensitive substring match on label (and optionally code). Each visible option is a native checkbox with `name`/`value` so SSR POST works without hidden-input sync. Unfiltered selected options that no longer match the filter MUST still post — either keep selected checkboxes mounted but visually in a “selected” strip above the filter, or keep all selected inputs in the DOM (hidden via CSS/`hidden` attribute) while the filtered list shows matches. Prefer: **selected values always rendered as posted checkboxes** (visible selected chips/rows + filtered unselected list, or always-mounted selected inputs).
   - **Rationale:** Filter needs client state; POST must remain classic form encoding; AGENTS.md §14 forbids HeroUI Select for this field.
   - **Alternatives:** HeroUI Select multi — violates native-first; hidden inputs synced from React state only — more fragile than native checkboxes; server search — out of scope.

5. **Where the island lives vs existing `"use client"` forms**
   - **Choice:** Extract language UI into a dedicated island/component used by `TimingStepForm` and `PreferencesForm` (and thus by `OnboardingTimingForm` / `ProfilePreferencesForm` islands). Do not add a second client boundary if the parent form is already a client component — still keep the searchable control as a reusable module under `islands/` (or a shared component imported by both forms) so the pattern is obvious and loadable as an island if SSR wrappers stay server components later.
   - **Rationale:** Brief says island under `apps/web/app/islands/` where search filter needs client state; both forms already are (or are wrapped by) client islands today.
   - **Alternatives:** Inline filter state in each form — duplicate; make only the language block an island inside a server form — nicer long-term but larger refactor than needed if parents are already client.

6. **Labels for expanded languages**
   - **Choice:** Expand `languageLabels` DE/EN maps in `onboarding-content.ts` for every `PREFERRED_LANGUAGES` code; keep `getPreferredLanguageLabel`. Use conventional short language names (Deutsch/German, Französisch/French, …). Admin event options can reuse `getPreferredLanguageLabel` for codes that exist on both lists (DE/EN).
   - **Rationale:** Existing pattern; type-safe against the allowlist tuple.
   - **Alternatives:** `Intl.DisplayNames` at runtime — less consistent DE marketing names; skip.

7. **Render sort helper**
   - **Choice:** Small pure helper (web lib or next to the island): given locale + codes, return options with DE then EN first, then remaining sorted by `localeCompare` on label (`de` or `en`). Constant array order is DE/EN-first but not fully A–Z for the rest — **UI sort is authoritative for display**.
   - **Rationale:** Brief: “order after DE/EN is A–Z by label”.
   - **Alternatives:** Pre-sort constant by English label only — wrong for `/de`.

8. **Validation / legacy `Non-Verbal`**
   - **Choice:** `assertAllowlist(..., PREFERRED_LANGUAGES)` already rejects unknowns once removed from the array. No batch migration. Profiles with only `Non-Verbal` show none selected until re-pick; save fails if client somehow posts `Non-Verbal`.
   - **Rationale:** Same pattern as step 01 informal districts; parent non-goal for batch jobs.
   - **Alternatives:** Soft-strip `Non-Verbal` on read — nicer UX, extra code; defer unless tests require it.

9. **Filter UX copy**
   - **Choice:** Minimal filter placeholder / aria-label in DE/EN (e.g. “Search languages” / “Sprachen suchen”) via onboarding copy keys. Theme with existing onboarding form / admin-native input classes — no new color tokens.
   - **Rationale:** Needed for usable search; full i18n inventory sync in step 04.
   - **Alternatives:** Unlabeled filter — worse a11y.

10. **Theme / markup**
    - **Choice:** HeroUI `Label` / `Surface` for chrome; native `input type="text"` for filter; native checkboxes for options (reuse `NativePreferenceOption` if it fits inside the island). Tailwind layout only; visuals via theme classes.
    - **Rationale:** Hard rules §8–9, §14.

## Risks / Trade-offs

- **[Risk] Selected languages disappear from POST when filtered out** → Mitigation: keep selected option inputs mounted (selected strip or hidden-but-posted inputs) so submit always includes prior selections.
- **[Risk] Large checkbox list is heavy on mobile** → Mitigation: filter defaults empty but DE/EN at top; list is scrollable within existing form layout; curated ~30 codes not full ISO.
- **[Risk] Admin event language allowlist diverges from member prefs** → Mitigation: intentional; document `EVENT_LANGUAGES` vs `PREFERRED_LANGUAGES` in auth README briefly.
- **[Risk] Existing profiles with `Non-Verbal` look empty / fail save if value still posted** → Mitigation: forms never offer it; unknown keys simply unchecked; validation rejects if posted.
- **[Trade-off] OpenSpec deltas vs product SoT** → Planning contract ships here; `docs/product/features/onboarding.feature` updates intentionally deferred to step 04.
- **[Trade-off] Dropping Non-Verbal from admin events** → Accept unless product asks to restore on `EVENT_LANGUAGES` only.

## Migration Plan

1. Add `EVENT_LANGUAGES`; expand `PREFERRED_LANGUAGES` (drop `Non-Verbal`); export both.
2. Update timing/cultural-prefs validation tests for new allowlist + reject `Non-Verbal`.
3. Expand language labels + accessibility copy; fix content tests.
4. Build searchable language multi-select; wire into `TimingStepForm` + `PreferencesForm`.
5. Point admin `getEventLanguageOptions` at `EVENT_LANGUAGES`.
6. Update fixtures/stories; run lint, typecheck, auth/content tests.
7. No DB migration. Rollback = revert PR (new language codes already saved would fail old allowlist — accept as forward-only allowlist expansion).

## Open Questions

- None blocking. If product later wants Non-Verbal for **events only**, add it to `EVENT_LANGUAGES` without putting it back on member prefs.
