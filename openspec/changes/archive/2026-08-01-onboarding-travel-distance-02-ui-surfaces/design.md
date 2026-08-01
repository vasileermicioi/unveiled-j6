## Context

Parent feature: Onboarding Travel Distance (`.dev-plan/current-iteration/onboarding-travel-distance-parent-guide.md`). Step 01 is done (archived): domain requires and persists `max_distance` as integer km in `MAX_DISTANCE_MIN`–`MAX_DISTANCE_MAX` (1–50); web parsers already read `max_distance` / `maxDistance` and fail closed when missing.

Current UI (after `berlin-zip-code`):

- `LocationStepForm` / `PreferencesForm`: Germany/Berlin chrome + native `zip_code`; **no** travel-distance field → location/Vibes POSTs fail domain validation without a posted distance.
- Copy: i18n inventory marks `radiusLabel` / `km` unused; `onboarding-content` has zip keys only.
- `AdminUserDetailPage`: already shows `{ label: usersPrefRadius, value: "${max_distance} km" }` when non-null; comment still says “Travel radius is not collected.”
- Parsers/routes: `parseLocationPayload` / preferences payload already pass `maxDistance`; need form chrome + error mapping for `invalid_max_distance`.

Constraints: native-first controls (AGENTS §14); HeroUI labels/layout; theme via globals; SSR form POST only; no feed ranking/geo filter UI; no Bezirk multi-select; docs/e2e matrix deferred to step 03.

## Goals / Non-Goals

**Goals:**

- Required native travel-distance control beside zip on onboarding step 3 and Vibes.
- DE/EN labels + km unit; POST field name matches parsers (`max_distance`).
- Map validation errors (`invalid_max_distance`, etc.) to on-page form errors.
- Admin intel shows stored km when set; omit/unset when null — no invented value.
- Lint + typecheck green; manual smoke per step brief.
- Record UX decision (number input; required) for step 03 gaps log.

**Non-Goals:**

- Product Gherkin, i18n inventory, schema-overview, coverage-matrix, Playwright updates (03).
- Using `max_distance` in `/events` discovery queries or ranking.
- Map radius visualization or browser geolocation.
- Changing zip/country/city validation or bounds constants (unless UI must import them for `min`/`max`).
- Forced re-onboarding for users with `max_distance: null`.

## Decisions

1. **Control: native `input type="number"` (not preset `<select>`)**
   - **Choice:** `input type="number" name="max_distance" min={MAX_DISTANCE_MIN} max={MAX_DISTANCE_MAX} step={1} required` with HeroUI `Label` + km unit text (`Description` or adjacent copy). Import min/max from `@unveiled/auth` constants so UI stays aligned with domain.
   - **Rationale:** Parent guide default; free integer in 1–50 matches domain validation; AGENTS §14 prefers native number over HeroUI `NumberField`.
   - **Alternatives:** Preset `<select>` buckets (rejected for this step — fewer choices, still need integers in range; can revisit later). HeroUI NumberField (rejected — native-first).

2. **Required on onboarding step 3 and Vibes location save**
   - **Choice:** HTML `required` on the distance input; domain already rejects missing/`NaN`. No skippable distance in this feature.
   - **Rationale:** Parent default + step 01 domain already requires `maxDistance` on location-touching saves.
   - **Alternatives:** Optional with preserve-previous (rejected — contradicts step 01 decision).

3. **Copy keys in `onboarding-content` (reuse on Vibes)**
   - **Choice:** Restore/add keys such as `radiusLabel` (EN “How far will you travel?”, DE “Wie weit bist du bereit zu fahren?”) and `km` (or `radiusUnit`: `km`). PreferencesForm continues to pull onboarding copy for location/distance so DE/EN stay single-sourced. Optionally tighten admin `usersPrefRadius` wording if “Radius” is too terse — prefer consistent “travel distance” / “Reiseweite” or keep Radius if already clear in HQ context.
   - **Rationale:** Step plan + i18n inventory notes; PreferencesForm already shares onboarding location labels.
   - **Alternatives:** Duplicate strings in profile-content (rejected — drift).

4. **Placement: same section as zip, after zip field**
   - **Choice:** Place distance control immediately below (or beside on wide layouts) the zip field within the location section on both forms; keep country/city readonly row above zip.
   - **Rationale:** Step plan “beside zip”; keeps location fields grouped.
   - **Alternatives:** Separate step (rejected — parent wants zip + distance on step 3).

5. **Default value for existing profiles**
   - **Choice:** `defaultValue={profile.max_distance ?? ""}` (empty when null). Do not invent a silent default (e.g. 10) in the form.
   - **Rationale:** Legacy null users must consciously set distance; domain fails closed if they submit empty — `required` + browser validation should catch most cases.
   - **Alternatives:** Prefill 10 (rejected — hides incomplete preference).

6. **Error mapping**
   - **Choice:** Ensure onboarding location + preferences routes map `OnboardingValidationError` / profile validation codes including `invalid_max_distance` to a field or form-level message near the distance control (reuse existing zip/error patterns). Add locale error strings if missing.
   - **Rationale:** Step plan “map validation errors to the form”; domain already throws typed codes.
   - **Alternatives:** Generic form error only (acceptable fallback if field-level wiring is heavy — prefer field-adjacent).

7. **Admin intel: verify, don’t rebuild**
   - **Choice:** Keep conditional radius row when `max_distance != null`; remove/update the “not collected” comment; smoke with a newly saved value. No invented placeholder when null.
   - **Rationale:** Partial support already exists; step plan says ensure it works for new saves.
   - **Alternatives:** Always show “unset” row (optional — only if product prefers visibility; default omit-when-null stays).

8. **Stories / fixtures**
   - **Choice:** Update `LocationStepForm` stories and PreferencesForm / AdminUserDetail fixtures to include a sample `max_distance` (e.g. 10) where useful for visual smoke.
   - **Rationale:** Ladle consistency; admin row only appears when non-null.

9. **Docs/e2e deferred**
   - **Choice:** Do not update `docs/product/features/*`, i18n inventory, coverage-matrix, or Playwright in this change. Record UX decision (number input; required; 1–50) for step 03 gaps log / parent cleanup.
   - **Rationale:** Step plan out of scope; capability specs for UI behavior update here; product Gherkin sync is 03.

## Risks / Trade-offs

- **[Risk] Onboarding/Vibes broken until chrome ships** → Mitigation: this step is the unblocker; land promptly after 01.
- **[Risk] Browser `type="number"` locale quirks** → Mitigation: integer `step={1}`; domain re-validates integer bounds server-side.
- **[Risk] Copy/tests still assert “travel radius NOT collected”** → Mitigation: update app copy + component tests here; leave product Gherkin/e2e for 03 (expect temporary doc/code mismatch until 03).
- **[Risk] Existing users with null max_distance cannot save Vibes without setting distance** → Mitigation: intentional (required); no forced re-onboarding — only when they edit Vibes.
- **[Trade-off] Number input vs presets** → Number is more flexible; presets would need buckets documented — deferred.

## Migration Plan

1. Add copy keys + distance fields to `LocationStepForm` and `PreferencesForm`; wire `name="max_distance"`.
2. Confirm POST parsers already pass through; fix error mapping + locale error strings.
3. Verify admin intel row; update comment/fixtures/stories.
4. Update onboarding-content tests; `bun run lint` + `bun run typecheck`; manual smoke.
5. Mark step done in parent guide; note UX decision for step 03.
6. Rollback: revert UI PR; domain from 01 remains (forms without field still fail closed).

## Open Questions

- None blocking. Exact admin label string (“Radius” vs “Travel distance” / “Reiseweite”) can be tightened during apply if HQ copy feels unclear — member-facing `radiusLabel` strings are fixed by the step plan examples.
