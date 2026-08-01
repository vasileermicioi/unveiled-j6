## Context

Parent feature: Berlin Zip Code (`.dev-plan/current-iteration/berlin-zip-code-parent-guide.md`). Steps 01–02 are done: schema/domain validate `(DE, berlin)` postal codes; admin/public event UI shows zip under fixed Germany/Berlin.

Current member surfaces (step 01 compile shims):

- `LocationStepForm` / `PreferencesForm`: native `zip_code` input + hidden `country`/`city`, but labels still use `districtLabel` / hangout copy; country/city not visible.
- Parsers already map FormData → `{ zipCode, country?, city? }` (`parseLocationPayload`, `parsePreferencesPayload`).
- `AdminUserDetailPage`: hybrid intel row labeled “Bezirke” / “Districts” — shows `country · city · zip` when zip present, else falls back to `profile.districts`.
- `DISTRICTS` / `getDistrictLabel` still exported and tested; Bezirk multi-select is already gone from these forms.

Constraints: native-first controls (AGENTS §14); HeroUI labels/layout; SSR form POST; theme-only colors; no city/country picker; no `max_distance` until `onboarding-travel-distance`; mirror step 02 admin location chrome pattern where it fits member forms.

## Goals / Non-Goals

**Goals:**

- Visible, non-editable Germany / Berlin on onboarding step 3 and Vibes location section.
- Native zip/PLZ input with proper DE/EN labels + short “serves Berlin” hint (not “districts”).
- Hidden named `country=DE` / `city=berlin` always submitted (disabled display fields alone must not drop POST values).
- Invalid/non-Berlin zip rejected via existing domain validation with user-visible error on those forms.
- Admin member detail shows zip location intel (not districts list / districts label).
- Travel radius control remains absent.
- Lint + typecheck green; manual smoke per step brief.

**Non-Goals:**

- Event admin/public UI (02 done).
- Gherkin, schema-overview, i18n inventory, Playwright matrix updates (04).
- Deleting `DISTRICTS` / `getDistrictLabel` package constants if still referenced by tests/docs (04 cleanup OK to finish).
- City/country picker or additional registry cities.
- Travel distance / `max_distance` collection.
- Reimplementing `validatePostalCode` or preference persistence APIs.

## Decisions

1. **Mirror step 02 country/city chrome on member forms**
   - **Choice:** Visible readonly native inputs (no `name`) for locale display labels Deutschland/Germany and Berlin, plus hidden `name="country"` / `name="city"` with values `DE` / `berlin`. Zip remains native `input type="text" name="zip_code" inputMode="numeric" maxLength={5} required`.
   - **Rationale:** Parent Location Model — model must be obvious; browsers omit disabled named fields; same pattern already proven in `EventAdminBaseFields`.
   - **Alternatives:** Hidden-only (status quo, rejected); editable selects (rejected — no picker).

2. **Shared copy keys in `onboarding-content` (reuse on Vibes)**
   - **Choice:** Replace `districtLabel` / `districtSubtitle` with location keys: `countryLabel`, `countryDisplay`, `cityLabel`, `cityDisplay`, `zipCodeLabel`, `zipCodeHint` (and optional section heading if still useful). PreferencesForm continues to pull onboarding copy for location so DE/EN stay single-sourced. Hint copy: DE/EN stating Unveiled currently serves Berlin — must not claim the model can never expand.
   - **Rationale:** Step plan copy list; PreferencesForm already imports onboarding copy for preference labels.
   - **Alternatives:** Duplicate strings in `profile-content` (rejected — drift risk).

3. **Keep parsers / domain as SoT; only fix error surfacing gaps**
   - **Choice:** Do not invent client-side PLZ validation beyond `required` / length. Confirm onboarding + preferences POST paths map `PostalValidationError` (or equivalent) to an on-page field/form error. Adjust only if missing.
   - **Rationale:** Step 01 owns validation; UI step wires chrome + errors.
   - **Alternatives:** Client regex gate (rejected — duplicates registry).

4. **Admin intel row: zip-first, drop districts fallback UI**
   - **Choice:** Show formatted location as display labels for country/city + zip (e.g. `Deutschland · Berlin · 10115` or locale-aware country/city display + zip). Rename `usersPrefDistricts` → location/zip label (`PLZ` / `Zip code` or `Standort` / `Location`). Do not render `profile.districts` list for active intel when zip model is shipped — empty/missing zip uses the same sparse empty pattern as other prefs.
   - **Rationale:** Step plan; legacy districts should already be cleared on write (01).
   - **Alternatives:** Keep districts fallback forever (rejected — confuses HQ).

5. **District constants cleanup deferred**
   - **Choice:** Stop using `DISTRICTS` / `getDistrictLabel` in member UI forms and admin intel. Leave unused exports/tests only if still required elsewhere; full removal + doc/e2e updates in step 04.
   - **Rationale:** Step plan “leave unused … else remove in step 04.”
   - **Alternatives:** Delete constants in this PR (OK if zero refs after UI change; prefer not blocking on docs tests).

6. **Stories / fixtures**
   - **Choice:** Update `LocationStepForm` stories and any PreferencesForm / AdminUserDetail fixtures that still show Bezirk multi-select or `districts` arrays as the location story.
   - **Rationale:** Visual smoke for Ladle; matches step 02 story updates.

7. **Native checkbox scenario wording (spec only)**
   - **Choice:** Location step is no longer a multi-value checkbox field; interests/moods/timing/days remain native checkboxes. Spec delta updates the native-controls requirement accordingly; product Gherkin file updates wait for 04.
   - **Rationale:** Avoid lying in capability specs while deferring docs/e2e matrix.

## Risks / Trade-offs

- **[Risk] Disabled named country/city drop from POST** → Mitigation: Decision 1 — hidden named fields.
- **[Risk] Copy still says “hang out” / “Bezirke” in tests** → Mitigation: update `onboarding-content.test.ts` with this step; leave product Gherkin for 04.
- **[Risk] PostalValidationError not surfaced on onboarding/profile** → Mitigation: inventory error mapping in apply; reuse admin pattern if missing.
- **[Risk] Story fixtures still have `districts`** → Mitigation: update member/admin fixtures touched by this step.
- **[Trade-off] Distinguishing UNSUPPORTED_LOCATION vs invalid zip** → Same user-facing zip error OK while country/city are fixed.
- **[Trade-off] Leaving `DISTRICTS` exports** → Acceptable until 04 cleanup if something still imports them.

## Migration Plan

1. Update onboarding/profile copy keys + LocationStepForm / PreferencesForm chrome (match EventAdminBaseFields pattern).
2. Confirm POST parsers + validation error mapping; fix gaps only.
3. Update AdminUserDetailPage intel row + admin-content labels; fix stories/fixtures.
4. Grep member UI for leftover Bezirk multi-select; leave package-level district constants if still referenced.
5. `bun run lint` + `bun run typecheck`; manual smoke (valid/invalid PLZ; Vibes edit; no travel radius).
6. Mark step done in parent guide; hand off docs/e2e to 04; do not mark travel-distance done.
7. Rollback: revert UI PR; domain/schema from 01 remain valid with shim zip inputs.

## Open Questions

- None blocking. Exact admin intel label (“PLZ” vs “Location”) can follow `zipCodeLabel` / a short Standort label — pick one pair in DE+EN during apply.
