## Context

Parent feature: Berlin Zip Code (`.dev-plan/current-iteration/berlin-zip-code-parent-guide.md`). Step 01 is schema + domain validation only.

Today:

- `events.neighborhood` (text NOT NULL) — Bezirk/Kiez string (e.g. `"Mitte"`)
- `UserProfile.districts?: string[]` — multi-select from `@unveiled/auth` `DISTRICTS` (12 Bezirke)
- Onboarding location step + profile Vibes persist `districts` via `validateOnboardingStepPayload("location", …)` / `updateMemberPreferences`
- Catalog `CreateEventInput` / `UpdateEventInput` require `neighborhood`
- No country/city/postal model; no city-scoped postal registry

Product direction: extensible location trio `country` + `city` + `zip_code`. This release only registers `(DE, berlin)`; UI steps 02–03 collect zip under prefilled Germany/Berlin.

Constraints: Drizzle `public` only; business logic in `packages/*`; `@unveiled/db` must not depend on `@unveiled/auth` (auth already depends on db); keep registry-shaped API even with one city; Europe/Berlin timezone unchanged; do not hard-code a bare `isBerlinPlz(zip)` without country/city parameters.

## Goals / Non-Goals

**Goals:**

- Migrate events: drop `neighborhood`; add `country` / `city` / `zip_code` with defaults `DE` / `berlin`.
- Replace profile location preference storage: `country` / `city` / `zip_code`; clear `districts` on write.
- Shared `validatePostalCode({ country, city, zipCode })` with city registry; only `(DE, berlin)` registered.
- Wire catalog create/update/series and preference/onboarding location persistence through the validator + defaults.
- Update package tests, fixtures, and seed helpers for the new fields.
- Lint, typecheck, and targeted unit tests green.

**Non-Goals:**

- Admin/public event UI chrome and copy (02).
- Onboarding step 3 / profile Vibes zip UX polish and i18n (03).
- Docs/Gherkin/e2e/schema-overview polish (04).
- Travel distance / `max_distance` restoration (`onboarding-travel-distance`).
- City/country pickers or additional registry entries.
- Geocoding zip → lat/lng.
- Dropping the `DISTRICTS` constant export entirely (may remain unused until step 04 cleanup) if other code still imports it for compile; prefer stop using it for active location validation.

## Decisions

1. **Validator home: `@unveiled/db`**
   - **Choice:** Implement `validatePostalCode` (+ registry types/errors) in `packages/db` (e.g. `src/location/postal.ts`), export from package index. `@unveiled/auth` location/onboarding/preference paths import and call it. Catalog create/update call it in the same package.
   - **Rationale:** Catalog must validate without depending on auth; auth already depends on db.
   - **Alternatives:** Put in `@unveiled/auth` (blocks catalog); new `@unveiled/location` package (overkill for one helper); `@unveiled/config` (not a runtime package today).

2. **Registry shape (fail closed)**
   - **Choice:**
     ```ts
     type PostalRegistryKey = `${string}:${string}`; // e.g. "DE:berlin"
     validatePostalCode({ country, city, zipCode }): asserts or returns normalized { country, city, zipCode }
     ```
     Lookup by normalized `(country.toUpperCase(), city.toLowerCase())`. Missing registry entry → typed validation error (`UNSUPPORTED_LOCATION` or similar). Malformed / non-member zip under a registered city → typed error (`INVALID_POSTAL_CODE`).
   - **Rationale:** Parent extensibility contract; one entry today without Berlin-only function signature.
   - **Alternatives:** Bare `isBerlinPlz` (rejected by step plan).

3. **Berlin membership: documented PLZ ranges under `(DE, berlin)`**
   - **Choice:** For registered city `berlin` / country `DE`: require `^\d{5}$` after trim, then membership via documented inclusive integer ranges covering Berlin’s PLZ band (**10115–14199**). Store ranges on the registry entry (not a global German check). Comment source/rationale in code; step 04 records the decision in `gaps-and-decisions.md`.
   - **Rationale:** Parent allows “maintained allowlist **or** documented Berlin PLZ ranges”; a ~190-code discrete set is maintenance-heavy without an upstream feed; unused numbers inside the band are acceptable false positives for MVP membership.
   - **Alternatives:** Full discrete Set (~190 codes) — implementer MAY switch to a Set later without changing the public `validatePostalCode` API; format-only `^\d{5}$` (rejected).

4. **Canonical keys and defaults**
   - **Choice:** Persist `country = "DE"`, `city = "berlin"` (lowercase slug). Domain defaults omitted country/city to those values before validation. Explicit unsupported pairs rejected (no silent rewrite of `US`/`munich` to Berlin).
   - **Rationale:** Parent Location Model table; display labels (“Germany”/“Deutschland”, “Berlin”) belong to UI steps.
   - **Alternatives:** Title-case city key `Berlin` (rejected — prefer stable slug).

5. **Events migration / backfill**
   - **Choice:** Single migration:
     1. Add `country text NOT NULL DEFAULT 'DE'`, `city text NOT NULL DEFAULT 'berlin'`, `zip_code text` (nullable briefly).
     2. Backfill `zip_code` from `neighborhood` via a fixed Bezirk→representative-PLZ map (e.g. Mitte→`10115`, Friedrichshain-Kreuzberg→`10969`, …); unknown/null neighborhood → `10115`.
     3. Set `zip_code NOT NULL`; drop `neighborhood`; drop column defaults for country/city if product prefers app-layer defaults only — **keep DB defaults** `DE`/`berlin` for insert safety.
   - **Rationale:** NOT NULL zip requires a value; seed/demo rows and staging data stay bookable; representative PLZ is good enough until admins edit in step 02.
   - **Alternatives:** Wipe and re-seed only (harsh on staging); leave zip nullable (violates product required field).

6. **Profile JSON migration**
   - **Choice:** No SQL rewrite of all profiles required. Type `UserProfile` adds `country?`, `city?`, `zip_code?`; keep `districts?` optional on the type for read compatibility. On location preference / onboarding location **write**: set trio, set `districts: null` (or omit/delete key via merge that clears it). Onboarding progress `isLocationStepDone` → true when `profile.zip_code` is a non-empty string (not when `districts` present).
   - **Rationale:** JSONB evolvable without table migration; clearing on write matches Spec Delta; old sessions with only `districts` re-enter location step until they save zip (acceptable until step 03 UX ships).
   - **Alternatives:** One-shot SQL `jsonb_set` to invent zips from districts (optional nice-to-have; not required if progress detection uses zip).

7. **Catalog / preference domain API**
   - **Choice:**
     - `CreateEventInput`: replace `neighborhood` with `zipCode: string`; optional `country?` / `city?` (defaulted). Persist snake_code columns.
     - `UpdateEventInput`: same optional fields; validate when zip (or country/city) provided; if zip omitted on update, leave existing zip unless country/city change requires re-validation of stored zip.
     - `LocationStepPayload`: `{ zipCode: string; country?: string; city?: string }` (defaults applied).
     - `updateMemberPreferences` location slice same shape; stop accepting `districts` as required.
   - **Rationale:** Aligns TS camelCase inputs with existing catalog style; DB columns snake_case.
   - **Alternatives:** Keep accepting `districts` alongside zip (rejected — stop requiring/persisting districts for active saves).

8. **Error surface for UI mappers**
   - **Choice:** Throw a small typed error class or code enum from db (e.g. `PostalValidationError` with `code: "UNSUPPORTED_LOCATION" | "INVALID_POSTAL_CODE" | "MISSING_POSTAL_CODE"`) so admin/onboarding mappers in later steps can localize without string-matching.
   - **Rationale:** Step verification asks for typed validation errors usable by UI mappers.
   - **Alternatives:** Generic `Error` with message only.

9. **Compile shims for `apps/web`**
   - **Choice:** Update web parsers/types that reference `neighborhood` / `districts` enough for `bun run typecheck` (field renames, pass zip through). Full form chrome/copy is 02/03; temporary bare zip inputs are allowed so SSR POSTs do not 500 if touched in staging.
   - **Rationale:** Same pattern as prior schema-first steps; dependency graph expects 02/03 immediately after.
   - **Alternatives:** Leave web broken at typecheck (rejected).

## Risks / Trade-offs

- **[Risk] Range-based Berlin membership accepts unused PLZs inside 10115–14199** → Mitigation: document as intentional MVP; discrete Set can replace ranges without API change.
- **[Risk] Staging events get wrong representative zip from Bezirk map** → Mitigation: map documented in migration/PR; admins fix in step 02; seed refresh uses real Berlin zips.
- **[Risk] Members with only legacy `districts` look “incomplete” on location step** → Mitigation: expected until 03; progress checks `zip_code`.
- **[Risk] UI still posts districts between 01 merge and 03** → Mitigation: minimal parser shims + sequential merge of 02/03; domain rejects invalid payloads clearly.
- **[Trade-off] DB defaults on country/city** → Slight duplication with app defaults; safer for raw SQL/seed inserts.

## Migration Plan

1. Land postal helper + unit tests (no schema yet).
2. Update Drizzle schema types; `bun run db:generate`; review SQL for backfill + drop `neighborhood`.
3. Apply migrate on dev/staging (`bun run db:migrate` / build path).
4. Update catalog + auth domain call sites, fixtures, seed.
5. Minimal web typecheck fixes.
6. Run lint, typecheck, targeted unit tests.
7. Rollback: reverse migration restoring `neighborhood` only if needed before 02 ships; prefer forward-fix with seed refresh.

## Open Questions

- None blocking apply. Step 04 will record city-key + PLZ membership approach in `gaps-and-decisions.md`.
- Optional: whether to one-shot SQL-clear `profile.districts` for all users in migration (nice-to-have; write-path clear is sufficient).
