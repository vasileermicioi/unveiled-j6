## Why

Free-text venue `address` strings often include Bezirk/neighborhood phrasing that Nominatim mishandles, so admin map pins soft-fail and public maps stay empty even when the venue is findable. Structured street + house number (optional line2) plus Nominatim structured search makes geocoding reliable without inventing coordinates.

## What Changes

- Add required `street` and `house_number`, optional `address_line2`, and partner zip parity (`country` / `city` / `zip_code`) on events and partners; keep composed display `address` written on create/update.
- Migration + backfill from existing free-text addresses; seed/catalog create/update/clone use structured fields and compose display address.
- Replace free-text address geocode with a structured Nominatim helper (line2 excluded; soft-fail; never invent default-center coords); unit tests without live Nominatim.
- Admin event/partner forms: native structured inputs; add-only partner prefill field-by-field; map preview stays non-draggable geocode preview.
- Public/member LOCATION shows composed `address` whenever present; map remains gated on `lat`/`lng`.
- Align product docs, Gherkin, coverage matrix, `DEPLOYMENT.md`, stories, and Playwright with structured location + optional live Nominatim pin success.
- Out of scope: commercial geocoders; Bezirk fields; member onboarding address structure; `ux-polish-03`–`05`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Events SHALL store structured location fields and compose display `address` on write; lat/lng remain structured-geocode-derived and may be null on soft-fail.
- `admin-events`: Admin create/edit SHALL collect street, house number, optional line2, and Berlin zip; map preview uses structured geocode (line2 excluded); soft-fail MUST NOT invent default-center coordinates; add-event partner change prefills structured fields; edit does not overwrite location.
- `partner-catalog`: Partners SHALL use the same minimal structured location fields (and zip parity) for clean event prefill.
- `event-discovery`: Public detail LOCATION SHALL show the composed address whenever present; map remains gated on lat/lng.
- `bdd-and-e2e`: Playwright SHALL assert structured street/house/zip prefill/save; live Nominatim pin success remains optional in CI.

## Impact

- **Schema / domain (`@unveiled/db`):** Drizzle `events` + `partners` columns; migration/backfill; compose-address helper; catalog create/update/clone/seed inputs; partner APIs for zip + structured fields.
- **Geocode (`apps/web`):** `geocode-berlin.ts` (+ tests) — structured search params instead of free-text `q` alone; `EventAdminBaseFields` / `EventGeoPicker` wiring; partner admin forms/parsers.
- **Public UI:** Event detail LOCATION (and any member surfaces showing venue address) read composed `address`.
- **Docs / e2e:** `admin-events.feature`, `admin-partners.feature`, `event-discovery.feature`; schema overview; gaps; coverage matrix; `DEPLOYMENT.md` map notes; Playwright admin-events/admin-partners specs.
- **Source brief:** `.dev-plan/current-iteration/ux-polish-02-structured-address.md`
- **Parent:** `.dev-plan/current-iteration/ux-polish-parent-guide.md`
- **Depends on:** none (independently mergeable; preferred after 01 for delivery order only)
- **Consumed by:** none (next planned: `ux-polish-03-event-detail-hero`)
- **Verification:** `bun run lint`; `bun run typecheck`; geocode/catalog unit tests + touched admin-events location e2e (live Nominatim optional)
