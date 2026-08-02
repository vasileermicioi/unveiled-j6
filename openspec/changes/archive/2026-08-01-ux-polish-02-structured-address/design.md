## Context

Parent feature: UX polish (`.dev-plan/current-iteration/ux-polish-parent-guide.md`), step 02 — largest slice (schema + admin + geocode + public).

Current state:

- **Schema:** `events` and `partners` store free-text `address` (required). Events already have `country` / `city` / `zip_code` + nullable `lat`/`lng`. Partners have `address` only (no zip/country/city).
- **Geocode:** `geocodeBerlinAddress(address: string)` hits Nominatim free-text `q=` with Berlin viewbox; soft-fail returns null; used from `EventAdminBaseFields` on partner prefill / address re-geocode.
- **Admin UI:** Single address text field + zip on events; partner form free-text address; map preview non-draggable (`EventGeoPicker`); add-only partner prefill copies partner address string.
- **Public:** Detail LOCATION shows `address` whenever present; map gated on coords.

Constraints: domain in `@unveiled/db`; HeroUI + native-first forms; SSR POST; soft-fail geocode must not invent default-center coords; proximity-only e2e; live Nominatim optional in CI; independently mergeable vs other ux-polish steps.

## Goals / Non-Goals

**Goals:**

- Persist required `street` + `house_number`, optional `address_line2` on events and partners; partners gain zip parity (`country` / `city` / `zip_code`).
- Compose display `address` on every catalog write from structured fields (line2 included in display when present).
- Structured Nominatim search (street/housenumber/postalcode/city/country); exclude line2 from geocode query; soft-fail; unit tests without live Nominatim.
- Admin event/partner forms collect structured native inputs; add-only partner prefill field-by-field; edit partner change does not overwrite event location.
- Public/member LOCATION continues to show composed `address`; map still requires lat/lng.
- Migration backfills structured columns from existing free-text addresses best-effort; docs/e2e/coverage/DEPLOYMENT aligned.

**Non-Goals:**

- Commercial geocoders; Bezirk/neighborhood fields; member onboarding address structure.
- Making lat/lng required; inventing Berlin-center coords on soft-fail.
- `ux-polish-03`–`05`; partner portal; Phase 6+ booking changes.
- Perfect parsing of every historical free-text address (backfill is best-effort with safe fallbacks).

## Decisions

1. **Keep `address` as composed display column (write-time composition)**
   - **Choice:** Retain non-null `address` text; domain helper `composeDisplayAddress({ street, houseNumber, addressLine2?, zipCode, city })` runs on create/update/clone/seed. Readers (public LOCATION, cards that show address) keep using `address`.
   - **Rationale:** Avoids rewriting every display call site; matches step plan “compose-on-write display address.”
   - **Alternatives:** Compose only at read time (rejected — more call sites, risk of drift); drop `address` column (rejected — larger migration / display churn).

2. **Partner zip parity mirrors events**
   - **Choice:** Add `country` / `city` / `zip_code` to `partners` with same defaults and `validatePostalCode` rules as events. Prefill copies street/house/line2/zip (and fixed DE/berlin).
   - **Rationale:** Clean event prefill and structured geocode need partner postal code; step plan requires zip parity.
   - **Alternatives:** Partner street-only without zip (rejected — weaker geocode and incomplete prefill).

3. **Nominatim structured search; line2 excluded**
   - **Choice:** Replace/extend `geocodeBerlinAddress` to accept structured parts and call Nominatim with structured params (`street` = `"${houseNumber} ${street}"` or Nominatim’s street+housenumber convention, plus `city`, `postalcode`, `country`/`countrycodes=de`). Do not send `address_line2` (courtyard/floor/c/o) into the geocoder. Keep timeout, soft-fail, Berlin viewbox bias, no API key.
   - **Rationale:** Free-text `q=` fails on Bezirk-heavy strings; structured search is Nominatim’s recommended path for this; line2 pollutes geocoding.
   - **Alternatives:** Client-side stripping of Bezirk tokens from free text (rejected — brittle); commercial geocoder (out of scope).

4. **Soft-fail must not invent coordinates**
   - **Choice:** Preserve existing contract: null lat/lng on fail; hidden fields empty; map may stay at default view without persisting that center.
   - **Rationale:** Already locked in address-only location polish; step plan restates it.

5. **Backfill strategy**
   - **Choice:** SQL/migration script: for each row, best-effort parse `address` into street/house (simple German patterns); if unparseable, put entire prior `address` into `street`, `house_number` = placeholder like `"1"` or `"n/a"` only if NOT NULL requires a value — prefer requiring house_number with a sentinel only when parse fails **and** document that admins should re-save. Safer approach: `house_number` NOT NULL with backfill `"?"` or `"0"` for unparseable rows **rejected**. Prefer: nullable during migration then NOT NULL after fill; unparseable → `street` = full prior address, `house_number` = `"1"` as last-resort with gaps note, OR keep house_number nullable for one release — **locked choice:** `street` + `house_number` NOT NULL after migration; unparseable rows get `street` = trimmed prior `address`, `house_number` = `"1"`, and re-compose `address` so display stays sensible; optional line2 null. Partner zip: if missing, default a known Berlin PLZ only when unavoidable — **prefer** requiring zip with backfill from a parse of trailing 5 digits in address, else `10115` as documented seed-only fallback is risky. **Locked:** extract 5-digit Berlin PLZ from address when present; otherwise set `zip_code` to `10115` and note in DEPLOYMENT/gaps that admins should correct; country/city `DE`/`berlin`.
   - **Rationale:** Must ship non-null columns without blocking deploy; imperfect backfill is acceptable vs blocking.
   - **Alternatives:** Manual-only backfill before migrate (rejected — blocks staging); leave house_number nullable forever (rejected — contradicts required fields).

6. **Admin forms: native structured inputs; no free-text address authoring**
   - **Choice:** Replace single address textarea/input with native text inputs for street, house number, optional line2 (+ existing zip). Hidden or derived composed address may still POST for debugging but domain recomposes server-side (never trust client-composed address as sole source).
   - **Rationale:** Native-first rule; server is source of truth for composition.
   - **Alternatives:** Keep free-text address plus structured “hints” (rejected — dual source of truth).

7. **Add-only partner prefill is field-by-field**
   - **Choice:** On create, partner change copies `street`, `houseNumber`, `addressLine2`, `zipCode` into event form fields then runs structured geocode. Edit never overwrites those fields on partner change.
   - **Rationale:** Step plan; preserves current add-only semantics with structured shape.

8. **Canonical product docs update in the same change**
   - **Choice:** Update `docs/product/` features, schema overview, gaps, coverage matrix, `DEPLOYMENT.md`, and Playwright with code — not deferred.
   - **Rationale:** AGENTS SoT is `docs/product/`; parent release criteria require it.

## Risks / Trade-offs

- **[Risk] Backfill invents weak house numbers / zip for messy historical rows** → Mitigation: document in gaps + DEPLOYMENT; admins re-edit; soft-fail geocode leaves lat/lng null rather than wrong pins from invented centers.
- **[Risk] Nominatim structured API still fails for some venues** → Mitigation: soft-fail unchanged; unit tests mock fetch; CI does not require live pin success.
- **[Risk] Slice exceeds 1–4 work-block sizing** → Mitigation: parent guide — stop and propose a follow-up parent; do not add step 06.
- **[Risk] Partner create/edit surfaces miss zip validation** → Mitigation: reuse `validatePostalCode`; shared form field component if practical.
- **[Trade-off] Composed `address` may differ slightly from historical free-text** → Acceptable; display becomes consistent `{street} {houseNumber}[, {line2}], {zip} Berlin` (exact format locked in compose helper + unit tests).

## Migration Plan

1. Add columns (nullable first if needed) → backfill → set NOT NULL + defaults for country/city on partners → compose `address` for all rows.
2. Update Drizzle schema + catalog domain (compose helper, create/update/clone/seed, partner APIs).
3. Implement structured geocode + unit tests; wire admin event/partner forms + prefill + stories.
4. Confirm public LOCATION still renders composed `address`; update docs/e2e/coverage/DEPLOYMENT.
5. Verify lint, typecheck, geocode/catalog unit tests, touched admin-events location e2e.
6. Mark step done in `ux-polish-parent-guide.md`.
7. Rollback: revert PR + reverse migration (restore prior address-only writes); note structured columns dropped or ignored.

## Open Questions

- None blocking. Exact German compose string format (comma placement, “Berlin” vs city key) is decided in apply by matching existing seed/display conventions and locking with unit tests.
