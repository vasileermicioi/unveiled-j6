## Context

Parent feature: Berlin Zip Code (`.dev-plan/current-iteration/berlin-zip-code-parent-guide.md`). Step 01 shipped schema, `validatePostalCode`, catalog/preference domain, and **minimal web compile shims** (HeroUI zip `TextField` + hidden `country`/`city`).

Current admin UI (`EventAdminBaseFields`):

- Address + MapLibre geocode preview (unchanged; address-first from event-form-polish).
- Zip via HeroUI `TextField` / `Input` named `zip_code`.
- Country/city only as `<input type="hidden">` defaulting to `DE` / `berlin`.
- No visible Germany/Berlin chrome; no Berlin-PLZ helper copy.

Public surfaces:

- `EventCard` already renders `event.zipCode` with MapPin.
- `EventDetailPage` DETAILS shows a zip `MetaCell` when present; LOCATION still address + optional map.
- Product docs / some seed paths still mention neighborhood (docs → step 04; seed cleanup in this step).

Constraints: HeroUI chrome + native controls per AGENTS §14; theme-only colors; SSR form POST; no city/country picker; series shares base fields; do not reopen domain validator (01).

## Goals / Non-Goals

**Goals:**

- Visible, non-editable Germany / Berlin location context on admin create/edit/series.
- Native zip/PLZ input with Berlin-PLZ helper copy; POST round-trips with defaults or explicit `DE`/`berlin`.
- Admin-visible error on invalid/non-Berlin zip (`PostalValidationError` → `fieldErrors.zipCode`).
- Public cards + detail show zip, not neighborhood/Kiez.
- Seeds/stories use Berlin zips under `DE`/`berlin`; remove dead neighborhood option helpers.
- Lint + typecheck green; manual smoke per step brief.

**Non-Goals:**

- Onboarding / profile Vibes zip UX (03).
- Gherkin, schema-overview, i18n inventory, Playwright matrix (04).
- City/country picker or additional registry cities.
- Travel distance / feed ranking by zip.
- Changing address geocode / EventGeoPicker behavior.
- Replacing or reimplementing `validatePostalCode`.

## Decisions

1. **Visible fixed country/city + hidden submit values**
   - **Choice:** Show locale labels “Deutschland”/“Germany” and “Berlin” as disabled/readonly native inputs (or HeroUI `TextField`/`Label` + readonly native `input`) **and** keep hidden (or same-named disabled+hidden pair) posts of `country=DE` and `city=berlin`. Prefer: visible readonly display fields without `name`, plus hidden `name="country"` / `name="city"` so disabled controls cannot drop values from FormData.
   - **Rationale:** Parent Location Model — model must be obvious; browsers omit disabled named fields from POST.
   - **Alternatives:** Hidden-only (status quo, rejected — not visible); editable selects (rejected — no picker this release).

2. **Native zip input (not HeroUI text field)**
   - **Choice:** Replace the zip `TextField`/`Input` with a native `<input type="text" name="zip_code" inputMode="numeric" maxLength={5} required>` wrapped in HeroUI `Label` / `Surface` / `Description` chrome; class via existing admin native patterns (e.g. `admin-native-select`-adjacent text class if one exists, else minimal layout classes only). Helper `Description`: DE “Muss eine Berliner PLZ sein.” / EN “Must be a Berlin zip code.”
   - **Rationale:** Step plan + AGENTS §14 native-first for constrained fields; HeroUI stays for labels/buttons.
   - **Alternatives:** Keep HeroUI `TextField` (works but contradicts step brief).

3. **Defaults and POST contract**
   - **Choice:** Always post `country=DE` and `city=berlin` from the form (hidden). Parser already maps `zip_code` → `zipCode` and optional country/city (`admin-event-form.ts`). Server still defaults omitted pairs (01). Do not invent client-side PLZ validation beyond `required` / length — domain is SoT.
   - **Rationale:** Round-trip both “explicit” and “server default” paths; single validation source.
   - **Alternatives:** Client-only regex gate (rejected — duplicates registry).

4. **Error mapping**
   - **Choice:** Keep `admin-route.ts` mapping `PostalValidationError` → `getAdminCopy(locale).fieldErrors.zipCode`. Ensure create/edit/series error surfaces show that string near the zip field (same pattern as other field errors). Optionally distinguish `UNSUPPORTED_LOCATION` with the same user-facing zip error for this Berlin-only release (admins cannot change country/city).
   - **Rationale:** Typed errors from 01; admins never pick unsupported cities in this UI.
   - **Alternatives:** Separate error strings per code (nice-to-have; not required).

5. **Public display**
   - **Choice:** Cards: zip only (no country/city chrome). Detail DETAILS: keep zip `MetaCell`; optionally add muted country/city on LOCATION or DETAILS only if copy is already cheap — **default: zip + address only** so Berlin-only product is not noisy. Never show neighborhood/Bezirk labels.
   - **Rationale:** Parent “Card chrome” risk note; step plan allows optional country/city on detail.
   - **Alternatives:** Always show “Germany · Berlin · 10115” on cards (rejected — dominates).

6. **Seed / Abundo cleanup**
   - **Choice:** Prefer explicit `zipCode` on fixtures; keep `zipFromFixtureEvent` neighborhood→zip map only as a temporary adapter for Abundo JSON that still ships `neighborhood`, or update `fetch-abundo-seed` / fixture JSON to emit `zipCode` + drop neighborhood writes when low-cost. Ensure seeded rows persist `country=DE`, `city=berlin`. Story fixtures already use zip — verify Ladle stories show the new admin controls.
   - **Rationale:** Step deliverable; avoid breaking Abundo import if JSON still has neighborhood.
   - **Alternatives:** Fail seed if neighborhood present without zip (stricter; OK if Abundo updated in same PR).

7. **Remove dead neighborhood helpers**
   - **Choice:** Delete `getEventNeighborhoodOptions` and unused neighborhood selects/options if still in tree; grep-clean imports. Do not delete product Gherkin neighborhood wording (04).
   - **Rationale:** Step scope; avoid half-dead APIs.
   - **Alternatives:** Leave unused exports (rejected).

8. **Series forms**
   - **Choice:** No parallel location UI — series create uses `EventAdminBaseFields` (or shared subset); verify one code path.
   - **Rationale:** Step validation checklist.

## Risks / Trade-offs

- **[Risk] Disabled named inputs drop country/city from POST** → Mitigation: Decision 1 — hidden named fields always submit `DE`/`berlin`.
- **[Risk] Existing “Address is the only admin location input” OpenSpec wording conflicts with zip** → Mitigation: MODIFY that requirement to mean address (not lat/lng) as street/geocode source; ADDED postal authoring requirement.
- **[Risk] Abundo fixtures still emit neighborhood** → Mitigation: adapter map or update fetcher; seeds still write zip trio.
- **[Risk] Step 01 shim already “good enough” for demos** → Mitigation: this step is the user-visible Germany/Berlin model; do not skip visible fields.
- **[Trade-off] Same zip error for UNSUPPORTED_LOCATION** → Acceptable while country/city are fixed.

## Migration Plan

1. Update admin base fields + copy + stories.
2. Confirm parser/error mapping; adjust only if gaps.
3. Public detail/card pass (verify no neighborhood strings).
4. Seed/fixture cleanup; remove dead helpers.
5. `bun run lint` + `bun run typecheck`; manual smoke.
6. Mark step done in parent guide; hand off docs/e2e to 04.
7. Rollback: revert UI PR; domain/schema from 01 remain valid with hidden-field shim.

## Open Questions

- None blocking. Optional detail country/city display can be skipped if it clutters LOCATION — zip + address is enough for apply.
