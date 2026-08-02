## 1. Schema & domain

- [x] 1.1 Add Drizzle columns on `events` and `partners`: required `street`, `house_number`; optional `address_line2`; partners also get `country` / `city` / `zip_code` with DE/berlin defaults
- [x] 1.2 Write migration + best-effort backfill from free-text `address` (parse street/house/PLZ; fallbacks per design); set NOT NULL; re-compose display `address`
- [x] 1.3 Implement `composeDisplayAddress` helper with unit tests for with/without line2
- [x] 1.4 Update catalog create/update/clone/seed (+ partner APIs) to require structured fields, validate Berlin zip, compose `address` on write
- [x] 1.5 Update catalog/partner unit and integration fixtures that still pass free-text-only `address`

## 2. Structured geocode

- [x] 2.1 Replace/extend `geocodeBerlinAddress` to accept structured parts and call Nominatim structured search (exclude `address_line2`; keep soft-fail, timeout, Berlin bias, no invented coords)
- [x] 2.2 Update `geocode-berlin.test.ts` with mocked fetch covering success, empty, timeout/network, and line2 exclusion (no live Nominatim)

## 3. Admin UI

- [x] 3.1 Update event admin forms/parsers/`EventAdminBaseFields`: native street, house number, optional line2 (+ existing zip); remove free-text address authoring as source of truth
- [x] 3.2 Wire structured geocode into map preview; keep non-draggable `EventGeoPicker`; never persist default-center coords on soft-fail
- [x] 3.3 Add-only partner prefill copies structured fields field-by-field; edit partner change does not overwrite location
- [x] 3.4 Update partner admin create/edit forms/parsers for structured location + zip parity
- [x] 3.5 Update Ladle stories / admin fixtures for structured location fields

## 4. Public display & docs / e2e

- [x] 4.1 Confirm public/member LOCATION (and any address surfaces) show composed `address`; map still gated on lat/lng
- [x] 4.2 Update `docs/product/` — schema overview, `admin-events.feature`, `admin-partners.feature`, `event-discovery.feature`, gaps-and-decisions, coverage-matrix
- [x] 4.3 Update `apps/web/DEPLOYMENT.md` map/prefill notes for structured Nominatim (no API key; live pin optional in CI)
- [x] 4.4 Update Playwright admin-events (and partners if needed) for street/house/zip prefill/save; proximity selectors only; live Nominatim optional
- [x] 4.5 Mark `ux-polish-02-structured-address` done in `.dev-plan/current-iteration/ux-polish-parent-guide.md`

## 5. Verification

- [x] 5.1 Run `bun run lint` — exits 0
- [x] 5.2 Run `bun run typecheck` — exits 0
- [x] 5.3 Run geocode + catalog/compose unit tests — pass
- [x] 5.4 Run touched admin-events location e2e — pass (live Nominatim pin success optional)
  <!-- This environment: Playwright listed structured-location scenarios; skipped `R2 vars not configured`. Specs + unit soft-fail coverage are in place. -->
