## Context

Parent feature: Onboarding Travel Distance (`.dev-plan/current-iteration/onboarding-travel-distance-parent-guide.md`). Step 01 is domain + persistence only.

Today (after `berlin-zip-code`):

- Location saves store `country` / `city` / `zip_code` via `validatePostalCode`
- `LocationStepPayload` is `{ zipCode, country?, city? }`
- `validateOnboardingStepPayload("location")` returns `{ country, city, zip_code, districts: null, max_distance: null }`
- `validateCulturalPreferencesPayload` reuses that path — so Vibes saves always null `max_distance`
- `UserProfile.max_distance?: number | null` already typed in `@unveiled/db`
- GDPR anonymize sets `profile: {}` (clears all preference keys including `max_distance`)
- Admin Membership HQ already shows a radius row when `max_distance != null` (UI collection deferred to step 02)

Constraints: logic in `packages/*`; no SQL migration; Europe/Berlin `preferences_updated_at` unchanged; no feed geo-filtering; UI controls out of scope.

## Goals / Non-Goals

**Goals:**

- Validate `max_distance` as integer km in bounds (default 1–50).
- Persist `max_distance` on onboarding location and cultural preference saves when provided (with zip trio).
- Stop blanket nulling of `max_distance` on those writes.
- Keep clearing legacy `districts` on location writes.
- Unit tests for bounds accept/reject and zip + distance merge.
- Lint/typecheck green (minimal web compile fixes if payload types widen).

**Non-Goals:**

- Onboarding / Vibes / admin UI controls and copy (02).
- Docs, Gherkin, e2e, schema-overview polish (03).
- Feed filtering or ranking by distance.
- Presets-only UX decision (document in 02 if product picks `<select>` buckets).
- Changing zip/country/city validation.
- Forced re-onboarding for users with `max_distance: null`.

## Decisions

1. **Bounds: inclusive integer 1–50 km**
   - **Choice:** Export constants e.g. `MAX_DISTANCE_MIN = 1`, `MAX_DISTANCE_MAX = 50` from `@unveiled/auth` (near other preference constants). Reject non-integers, non-finite numbers, and values outside range with a typed validation error (`invalid_max_distance` or similar).
   - **Rationale:** Parent guide recommends 1–50 for native number input; presets-only is a step 02 UX option that can still submit integers in this range.
   - **Alternatives:** Unbounded positive int (rejected — need a ceiling); presets-only validation at domain layer (premature — UI not chosen).

2. **Required on location/preference write paths that touch location**
   - **Choice:** When validating the location step / cultural preferences location slice, `max_distance` is **required** (must be present and valid). Do not silently leave prior `max_distance` when a full location save omits it — reject missing/invalid so step 02 can require the field consistently.
   - **Rationale:** Parent default: required on onboarding step 3 and when Vibes saves location fields. Domain-first enforcement avoids UI shipping a required field that the API still nulls.
   - **Alternatives:** Optional until UI ships (risk: step 02 forgets required); preserve previous value when omitted (harder to test “clear policy removed”; defer optional-skip product choice to step 02 if reopened).

3. **Helper home: `@unveiled/auth`**
   - **Choice:** `validateMaxDistance(value: unknown): number` (or equivalent) in `packages/auth` beside onboarding/profile validators; call from `validateOnboardingStepPayload("location")`. Profile path inherits via existing reuse.
   - **Rationale:** Only preference/onboarding writers need it; catalog/events do not; avoids new package.
   - **Alternatives:** `@unveiled/db` (unnecessary — not a shared DB concern); web-only parsing (violates package boundary).

4. **Payload shape**
   - **Choice:** Extend `LocationStepPayload` with `maxDistance: number` (camelCase in payload, snake `max_distance` on profile — match `zipCode` → `zip_code`). Cultural preferences payload inherits via intersection type.
   - **Rationale:** Consistent with existing location payload conventions.
   - **Alternatives:** Accept `max_distance` snake in payload (inconsistent with `zipCode`).

5. **No SQL migration**
   - **Choice:** JSONB key already exists; only change write/merge behavior and types/tests.
   - **Rationale:** Step plan; schema-overview wording left for step 03.

6. **GDPR**
   - **Choice:** No code change expected — anonymize already replaces `profile` with `{}`. Add/adjust a unit or integration assertion only if cheap; otherwise confirm in tasks as a checklist item.
   - **Rationale:** Full-profile wipe already clears `max_distance`.

7. **Web callers until step 02**
   - **Choice:** If apps/web location/preference POST handlers construct `LocationStepPayload` without `maxDistance`, update them minimally so typecheck passes — either pass a temporary valid default **only if** a compile stub is unavoidable, or widen call sites to supply a value from form fields that do not yet render (prefer: add parsing of optional form field `max_distance` / `maxDistance` that fails validation when missing, matching domain required — pages will error until step 02 UI ships). **Prefer failing closed on missing field** over inventing a silent default in production routes.
   - **Rationale:** Domain step must not leave a nulling policy; incomplete UI is owned by 02. If local/staging onboarding would break, implementers may land 01+02 in a short sequence; do not reintroduce `max_distance: null` writes.
   - **Alternatives:** Keep nulling in web until 02 (rejected — undoes this change); silent default `10` on missing (hides incomplete UX).

## Risks / Trade-offs

- **[Risk] Onboarding/Vibes POST breaks until step 02 UI posts `maxDistance`** → Mitigation: land step 02 promptly; or temporarily keep admin/demo paths supplying a value in tests; document in handoff. Do not restore null policy.
- **[Risk] Existing users with `max_distance: null`** → Mitigation: no forced re-onboarding; they set distance when next editing location/Vibes (parent guide).
- **[Risk] Bounds disagree with future preset buckets** → Mitigation: presets in 02 must map to integers inside 1–50; constants are the single source.

## Migration Plan

1. Add validator + constants; extend location payload validation to require and store `max_distance`.
2. Update auth unit tests; fix any web parse call sites for types.
3. Deploy — no DB migrate. Rollback: revert package commit (JSONB values already written remain harmless).

## Open Questions

- None blocking step 01. Presets vs number input and any “skippable distance” product choice stay in step 02 / parent risks.
