## Why

Admins today author event location by dragging a map pin (and implicitly writing `lat` / `lng` / `map_zoom`) in addition to the address. Product wants **address as the only location input** — the map should preview a geocode, not be the source of truth — and public detail LOCATION should always show the address even when geocoding failed.

## What Changes

- Remove admin-editable latitude, longitude, and map zoom from create/edit/series forms (no visible number fields; no drag-to-set / click-to-set as primary authoring).
- Keep a MapLibre + OSM map preview that updates from address geocode (partner select prefill on create/series; address edits may re-geocode; Nominatim soft-fail leaves prior/default preview).
- Persist address as the admin source of truth; continue storing derived `lat`/`lng` when geocode succeeds so detail + member map keep working.
- **BREAKING (schema):** Drop `events.map_zoom` via Drizzle migration (preferred); UI always uses a default zoom for preview/detail maps.
- Public detail LOCATION: always show address when present; show map under the address only when derived coordinates exist.
- Update admin Gherkin / OpenSpec for address-first partner-prefill and soft-fail; update discovery Gherkin / OpenSpec for address-without-map; update schema overview and gaps-and-decisions (lat/lng system-derived; `map_zoom` removed).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `admin-events`: Address is the only admin location input; map is geocode preview only; partner-prefill and edit-no-overwrite scenarios use address-first wording; geocode soft-fail still saves address.
- `event-discovery`: Detail LOCATION shows address whenever an address exists; map is optional when derived coordinates exist.
- `event-catalog`: Replace admin map-geolocation-with-zoom authoring with address-first + derived coords; remove `map_zoom` persistence requirement.

## Impact

- **Schema / DB:** `packages/db` — drop `events.map_zoom`; stop accepting `mapZoom` on create/update; keep nullable `lat`/`lng` as system-derived; seed/tests/fixtures.
- **Admin UI:** `EventGeoPicker` (display-only geocode preview; non-draggable marker), `EventAdminBaseFields` / series, form parse (`admin-event-form.ts`), `EventFormValues`, `admin-event-input.ts`, route helpers, admin copy (remove lat/lng/zoom labels if any).
- **Public UI:** `EventDetailPage` LOCATION card — address without requiring coords; map conditional.
- **Docs:** `docs/product/features/admin-events.feature`, `event-discovery.feature`, `database/schema-overview.md`, `extras/gaps-and-decisions.md`, any ui-component-map notes for geo picker.
- **Unchanged this step:** language-independent (01, shipped); image retention on error (03); partner schema lat/lng; member map clustering/filters beyond reading derived coords; reverse-geocode from pin drag.
- **Source brief:** `.dev-plan/current-iteration/event-form-polish-02-address-only-location.md`
- **Parent:** `.dev-plan/current-iteration/event-form-polish-parent-guide.md`
- **Depends on:** `event-form-polish-01-language-independent` (archived/done)
- **Consumed by:** `event-form-polish-03-retain-images-on-error`
- **Verification:** `bun run lint`; `bun run typecheck`; admin-event form unit tests updated; manual create → partner prefill → no zoom/lat/lng fields → detail address + map / address-only on geocode fail
