## Context

Onboarding step 4 (`TimingStepForm`) and profile preferences (`PreferencesForm`) render Languages as a titled section (`Label.onboarding-form__section-label` + options `Surface` of `NativePreferenceOption` chips). Accessibility is a lone `NativePreferenceOption` whose chip label is the full question (`ACCESSIBILITY REQUIRED?` / `BARRIEREFREIHEIT ERFORDERLICH?`) from `onboarding.accessibilityLabel`. Manual evidence: `.dev-plan/manual-test-register-accessibility.png`. Source brief: `.dev-plan/current-iteration/manual-test-ux-02-accessibility-section-title.md`. Step 01 (hangout i18n) is done; same forms are touched again here.

## Goals / Non-Goals

**Goals:**

- Accessibility on step 4 and profile preferences uses the same section-label + options layout as Languages.
- Copy splits into a section title (EN `ACCESSIBILITY?`, DE `BARRIEREFREIHEIT?`) and a short option label (EN `Required`, DE `Erforderlich`).
- Boolean field `accessibility` and SSR POST shape stay unchanged.
- i18n inventory, onboarding e2e name matcher, and content unit tests stay aligned with the new strings.

**Non-Goals:**

- Changing accessibility from boolean to multi-select.
- Hangout district maps (step 01); membership card / profile header / account tabs (steps 03–05).
- New client islands or mutation UX beyond existing native preference exception.
- Broader onboarding redesign or allowlist changes.

## Decisions

1. **Split copy keys; keep one boolean control**
   - **Choice:** Replace single `accessibilityLabel` with `accessibilitySectionLabel` (section title) + `accessibilityOptionLabel` (chip text) on `OnboardingCopy` in `onboarding-content.ts`. Chip remains one checkbox posting `accessibility=true` when checked.
   - **Rationale:** Matches Languages chrome without changing persistence; parent guide already nominates Required / Erforderlich.
   - **Alternatives:** Keep full question as chip under a redundant title (rejected — double question); invent multi-option accessibility chips (rejected — out of scope).

2. **Mirror Languages markup exactly**
   - **Choice:** Wrap accessibility in `<Surface className="flex flex-col gap-4">` → section `Label` → options `Surface` (reuse `onboarding-form__options`; single chip may omit `grid-three` or keep a simple options surface) → `NativePreferenceOption`.
   - **Rationale:** Visual parity with Languages; HeroUI-only pattern already established; no new primitives.
   - **Alternatives:** Custom CSS-only “title” via chip styling (rejected — breaks section-label convention).

3. **Shared copy for onboarding + profile**
   - **Choice:** Both forms read the new keys from `getOnboardingCopy(locale)` (or existing `onboarding` prop); no duplicate profile-only strings.
   - **Rationale:** One SoT for DE/EN; inventory stays single-source.
   - **Alternatives:** Profile-specific labels (rejected — drift).

4. **Update e2e to short option accessible name**
   - **Choice:** Change `onboarding.spec.ts` matcher from `/barrierefreiheit erforderlich|accessibility required/i` to match the new option label (e.g. `/^erforderlich$|^required$/i` or locale-aware name) and optionally assert the section title text is visible.
   - **Rationale:** Accessible name becomes the short chip label; old regex would fail.
   - **Alternatives:** Keep long string as aria-label while showing short chip text (rejected — unnecessary complexity).

## Risks / Trade-offs

- **[Risk] Inventory or other docs still list `accessibilityLabel`** → Mitigation: update `content-i18n-inventory.md`; grep for old key/string.
- **[Risk] Profile e2e also asserts old accessibility name** → Mitigation: grep `e2e/` during apply; fix matchers that fail.
- **[Trade-off] Single option under a section title looks sparse vs Languages’ three chips** → Acceptable; structure parity matters more than filling a grid.
- **[Trade-off] openspec/specs are historical** → Deltas written here; product SoT update is inventory (+ feature file only if a scenario hardcodes the old question string).

## Migration Plan

1. Add section + option copy keys in `onboarding-content.ts`; remove or stop using `accessibilityLabel`.
2. Restructure accessibility block in `TimingStepForm` and `PreferencesForm`.
3. Update inventory rows; update onboarding e2e matcher; extend unit tests if present.
4. Run lint, typecheck, and `onboarding-content.test.ts`; manual step-4 visual check vs Languages.
5. Mark step 02 done in parent guide on merge. No DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. Option wording (`Required` / `Erforderlich`) is decided in the parent guide and this design.
