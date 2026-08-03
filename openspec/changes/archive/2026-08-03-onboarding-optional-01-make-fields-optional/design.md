## Context

Parent feature: optional onboarding fields (`.dev-plan/current-iteration/04-onboarding-optional-parent-guide.md`), single child step.

Current blockers:

- **UI:** `LocationStepForm` sets `required` on zip; `InterestsStepForm` sets `required` on Other free text when Other is checked — native submit never reaches the server.
- **Domain:** `validateOnboardingStepPayload` location always calls `validatePostalCode`, which throws `MISSING_POSTAL_CODE` on blank zip. Interests throws `interests_other_required` when Other is selected without text.
- **Routing risk:** `isLocationStepDone` requires non-empty `zip_code`. Even if an empty save somehow succeeded without advancing `behavior.onboarding_step`, inference would trap the user on location. `saveOnboardingStep` already sets `onboarding_step` to the next key on success — empty location must succeed so that path runs.
- **Copy:** `zipCodeHint` (DE/EN) reads like a hard “enter a Berlin zip” requirement.

Constraints: SSR form POSTs; validation in `@unveiled/auth`; do not weaken `validatePostalCode` for admin/event/partner address writes (those still require zip); HeroUI + native controls; age skip already works.

## Goals / Non-Goals

**Goals:**

- Remove HTML `required` blockers on onboarding preference controls.
- Empty zip → accept step; store `zip_code: null`; keep `country`/`city` from hidden DE/berlin fields; clear `districts`; do not call `validatePostalCode` when zip is blank/whitespace.
- Non-empty zip → still `validatePostalCode` (Berlin PLZ rules).
- Empty interests/moods → allow (empty arrays); Other+empty text → drop Other, `interests_other: null`; Other+text → keep current save path; over-max-length text still rejected.
- Ensure empty location POST advances to timing via `behavior.onboarding_step` and `isLocationStepDone` / inference no longer requires zip.
- Soften zip hint copy to optional; update product feature, e2e, unit tests, coverage matrix; mark parent guide done.

**Non-Goals:**

- Removing or merging wizard steps; feed ranking from preferences.
- Changing Germany/Berlin prefills / non-editable country-city display.
- Changing registration / auth signup.
- Making profile edit require zip (note only if it reintroduces a hard require for first-time empty profiles).
- Changing shared `@unveiled/db` `validatePostalCode` contract for catalog addresses (events/partners still require zip).

## Decisions

1. **Skip postal validation only in onboarding when zip is blank**
   - **Choice:** In `validateOnboardingStepPayload` (`location`), if `zipCode` trim is empty, return `{ country, city, zip_code: null, districts: null }` using payload/defaults (`DE` / `berlin` from hidden fields / normalize helpers), without calling `validatePostalCode`. If non-empty, keep current `validatePostalCode` + error mapping.
   - **Rationale:** Catalog/partner address validation must stay strict; optional zip is an onboarding product rule, not a postal-registry rule.
   - **Alternatives:** Soften `validatePostalCode` to allow empty (rejected — breaks admin/event required addresses); add `optional: true` flag to `validatePostalCode` (possible later; unnecessary if onboarding branches first).

2. **Location “done” without zip**
   - **Choice:** Treat location as done when `behavior.onboarding_step` is past location (already preferred by `getOnboardingStepPath`) **and** update `isLocationStepDone` so inference does not require zip — e.g. done when `country`/`city` are set after a location save, or when `zip_code` is explicitly null after a location submit, or when interests are done and timing fields / `onboarding_step` indicate progress. Prefer: after a successful location save (including empty zip), profile has `country` + `city` set → `isLocationStepDone` returns true if `(country && city)` are present **or** non-empty zip (legacy). Empty zip with country/city from this step satisfies done.
   - **Rationale:** Parent guide risk: inference must not re-trap after empty Next; `saveOnboardingStep` already advances `onboarding_step`.
   - **Alternatives:** Add `behavior.location_submitted` flag (rejected — extra state when country/city write is enough); only rely on `onboarding_step` and leave `isLocationStepDone` zip-only (rejected — fragile if step pointer missing).

3. **Other without text: drop Other, do not block**
   - **Choice:** If `Other` is in interests and trimmed `interests_other` is empty, remove `Other` from the interests array, set `interests_other: null`, allow empty interests/moods otherwise; only validate allowlist membership and max length when text is present. Remove HTML `required` from the Other input.
   - **Rationale:** Parent guide preferred path; keeps allowlist clean (no orphan `Other` without text).
   - **Alternatives:** Keep Other in list with null other (rejected — inconsistent with “Other means free text”); allow empty string other while keeping Other (rejected — useless row).

4. **Interests empty arrays mark step done**
   - **Choice:** Persist `interests: []` and `moods: []` on empty submit so `isInterestsStepDone` (`!= null`) stays true. Ensure route body parsing defaults missing checkbox groups to `[]`.
   - **Rationale:** Existing done predicate already works with empty arrays; only Other-required and HTML blocked empty completion.
   - **Alternatives:** Persist `null` and change done predicates (rejected — more churn; null vs “visited” ambiguity).

5. **Copy: optional zip hint**
   - **Choice:** Update DE/EN `zipCodeHint` to state Berlin service area **and** that PLZ is optional (e.g. enter a Berlin zip if you want / leave blank). Keep section labels.
   - **Rationale:** Step plan; current copy implies a hard enter requirement.
   - **Alternatives:** Leave hint unchanged (rejected — contradicts optional UX).

6. **Specs / tests in this same change**
   - **Choice:** Update `onboarding.feature`, OpenSpec delta (this change), auth unit tests, e2e scenarios, coverage matrix, parent guide checkbox, gaps/decisions note if useful — all in one PR (single child step).
   - **Rationale:** Feature has only one step; release criteria require e2e + feature alignment.

## Risks / Trade-offs

- **[Risk] Inference trap if country/city not written on empty zip** → Mitigation: always write DE/berlin from hidden fields on location POST; assert in unit tests that empty zip still sets country/city and advances step.
- **[Risk] Shared `validatePostalCode` accidentally softened** → Mitigation: change only onboarding branch; keep db postal unit tests requiring zip.
- **[Risk] Existing e2e/unit tests expect Other-required or zip-required** → Mitigation: update assertions in same PR; add blank-path cases.
- **[Trade-off] Orphan Other checkbox UX** → Selecting Other then clearing text silently drops Other on save; acceptable vs blocking Next.
- **[Trade-off] Profile without zip** → Downstream features that assume zip may see null; out of scope beyond noting profile edit should not re-hard-require for empty first profiles.

## Migration Plan

1. No DB schema migration (`zip_code` already optional on `UserProfile` JSONB).
2. Deploy auth + UI + copy + docs/tests together.
3. Rollback: revert commit; existing profiles with zip unchanged; blank profiles remain valid.

## Open Questions

- None blocking. Profile-edit zip hard-require is note-only per step plan cleanup.
