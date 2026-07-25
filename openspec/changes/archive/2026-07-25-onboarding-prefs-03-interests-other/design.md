## Context

Parent feature: Onboarding preference options (`.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`). This is child step 03; depends on merged `onboarding-prefs-02-accessibility-and-languages`.

Today onboarding step 2 (`InterestsStepForm`) and profile Vibes (`PreferencesForm`) multi-select from:

```ts
INTERESTS = [
  "Theater", "Kino", "Museum", "Ausstellung",
  "Konzert", "Talk/Lesung", "Comedy", "Tanz/Performance",
]
```

`InterestsStepPayload` is `{ interests: string[]; moods: string[] }`. `validateOnboardingStepPayload("interests", …)` allowlists both arrays and returns `{ interests, moods }` with no free-text key. `UserProfile` has no `interests_other`. Admin detail formats `profile.interests` as a list only.

Constraints: SSR form POST; native-first controls (AGENTS.md §14); HeroUI for labels/layout; business logic in `@unveiled/auth`; JSONB profile update (no SQL migration); Gherkin/e2e/product SoT deferred to step 04.

## Goals / Non-Goals

**Goals:**

- Append `"Other"` to `INTERESTS`; labels EN `Other` / DE `Sonstiges`.
- Persist optional `profile.interests_other` with clear validation rules.
- Wire free-text UX on interests step + profile Vibes.
- Show `interests_other` on admin member detail when present.
- Unit tests covering reject / accept / clear cases.

**Non-Goals:**

- Changing the other eight interests or any moods.
- Algorithmic feed ranking from interests.
- Full Gherkin / Playwright / i18n inventory / schema-overview polish (step 04).
- SQL migration or backfill.

## Decisions

1. **Allowlist key is the English word `Other`**
   - **Choice:** Append `"Other"` to `INTERESTS` after the eight existing keys. Stored key is locale-invariant; DE UI label is `Sonstiges` via `getInterestLabel` / `interestLabels`.
   - **Rationale:** Matches step brief and parent guide; consistent with other German-key interests that already use DE strings as keys for the eight — `Other` is the intentional EN key with a DE display label (same pattern as accessibility option labels).
   - **Alternatives:** Key `Sonstiges` — worse for EN-facing admin lists; key `other` lowercase — breaks Pascal/title style of existing interest keys.

2. **`interests_other` on `UserProfile` JSONB; no migration**
   - **Choice:** Add `interests_other?: string | null` to `UserProfile` in `packages/db/src/schema/users.ts`. Writes go through existing profile merge on onboarding/profile save.
   - **Rationale:** Brief; JSONB optional keys need no DDL.
   - **Alternatives:** Separate column — overkill for one free-text preference.

3. **Validation rules live in interests step validation**
   - **Choice:** Extend `InterestsStepPayload` with `interests_other?: string | null`. In `validateOnboardingStepPayload("interests", …)` after allowlist checks:
     - If `interests` includes `"Other"`: trim `interests_other`; if empty → `OnboardingValidationError` (e.g. `interests_other_required`); if length > `INTERESTS_OTHER_MAX_LENGTH` (const **100**) → `interests_other_too_long`; return `{ interests, moods, interests_other: trimmed }`.
     - Else: return `{ interests, moods, interests_other: null }` (ignore posted text).
   - Profile cultural-preferences path already calls the same interests validator — inherits rules.
   - **Rationale:** Single source of truth; matches parent decision table.
   - **Alternatives:** Soft-accept empty Other by stripping the key — weaker product rule; validate only in web parsers — duplicates logic.

4. **Max length = 100**
   - **Choice:** Export `INTERESTS_OTHER_MAX_LENGTH = 100` from `@unveiled/auth/constants` (or next to validation). Brief suggests 80–120; pick 100.
   - **Rationale:** Short free-text interest label, not a bio.
   - **Alternatives:** 80 or 120 — either fine; 100 is the midpoint.

5. **Form field name `interests_other`; parsers pass string through**
   - **Choice:** Native `input type="text"` (prefer over textarea — single short phrase) with `name="interests_other"`. `parseInterestsPayload` / profile route parser: `interests_other: asOptionalString(body.interests_other)` (trim at validation, not necessarily at parse). Always include the key in the payload object (string or empty) so validation can clear it.
   - **Rationale:** Classic form encoding; SSR POST unchanged.
   - **Alternatives:** Only post when visible — risk of not clearing on uncheck; use textarea — heavier UI for ≤100 chars.

6. **Show/hide free-text with client state (forms already `"use client"`)**
   - **Choice:** In `InterestsStepForm` and `PreferencesForm`, track whether Other is checked (initial from `profile.interests`); when true, render the text field below the Other option (or under the interests grid). Progressive disclosure without a separate island is fine because both forms are already client components / islands. Server remains authoritative: unchecked Other → `interests_other: null` even if the input was left filled and somehow posted.
   - **Rationale:** Brief allows client island OR progressive disclosure; reuse existing client boundary.
   - **Alternatives:** Always-mounted hidden input cleared by server only — works but poorer UX; dedicated island — unnecessary if parents are already client.

7. **Admin detail: one preference row**
   - **Choice:** Add `usersPrefInterestsOther` copy (EN `Other interest` / DE `Sonstiges Interesse` or similar) and a row in `AdminUserDetailPage` preferences list when `profile.interests_other` is non-empty (or always with empty-state null like other fields — prefer show value when present, null/empty uses existing empty pattern via `formatList`-style helpers).
   - **Rationale:** Brief prefers include here if one field; step 04 still owns broader intel polish.
   - **Alternatives:** Defer entirely to 04 — rejected to keep admin readable after merge.

8. **Copy keys**
   - **Choice:** Extend `interestLabels` for `Other` / `Sonstiges`. Add optional free-text label/placeholder (e.g. EN `Describe your interest` / DE `Beschreibe dein Interesse`) via `getOnboardingCopy` if needed for accessible naming of the text field.
   - **Rationale:** Existing label maps; a11y for the free-text control.
   - **Alternatives:** Unlabeled input next to Other — weaker a11y.

9. **Theme / markup**
   - **Choice:** Reuse `NativePreferenceOption` for the Other checkbox (it appears via mapping `INTERESTS`). Free-text: native `input` + HeroUI `Label`; layout Tailwind only; onboarding form / admin-native input classes from `globals.css`.
   - **Rationale:** Hard rules §8–9, §14.

10. **Fixtures / stories / completion rules**
    - **Choice:** Interests step completion remains “`interests` and `moods` non-null”; `interests_other` is not required for step completion when Other is unchecked. Update mock profiles/stories that enumerate all `INTERESTS` labels. Admin event-type `EVENT_TYPES` already has `"Other"` — unrelated; do not conflate.
    - **Rationale:** Avoid regressing onboarding progress when Other is unused.

## Risks / Trade-offs

- **[Risk] Stray free text left in DOM when Other unchecked still posts** → Mitigation: validation always sets `interests_other: null` when Other absent.
- **[Risk] Clients post `Other` without text** → Mitigation: unit-tested validation error; form should block obvious empty submits via required attribute when Other checked (progressive enhancement) but server remains SoT.
- **[Risk] `EVENT_TYPES` / admin “Other” confusion** → Mitigation: different constants; document nothing; keep interest key clearly under `INTERESTS`.
- **[Trade-off] OpenSpec deltas vs product SoT** → Planning contract ships here; `docs/product/features/onboarding.feature` / profile / schema-overview sync deferred to step 04.
- **[Trade-off] Max length 100 vs brief range** → Fixed constant; adjust in one place if product asks.

## Migration Plan

1. Add `"Other"` to `INTERESTS`; add `INTERESTS_OTHER_MAX_LENGTH`; extend `UserProfile` + `InterestsStepPayload`.
2. Implement interests validation rules; update auth unit tests.
3. Extend parsers; update forms + copy; admin detail row.
4. Update fixtures/stories/content tests.
5. Run lint, typecheck, auth (+ content) unit tests.
6. No DB migration. Rollback = revert PR (orphan `interests_other` keys in JSONB are harmless if unread).

## Open Questions

- None blocking. Step 04 owns Gherkin scenario “Step 2 — interests and moods” list update and schema-overview documentation if not already noted in a short comment here.
