## Why

After catalog-04 shipped admin event CRUD with HeroUI selects and island hydration, several form controls still use raw HTML (native date input, comma-separated text for languages/age groups, free-text lat/lng) and select popovers need layout fixes. This change polishes admin event **form controls** (dates, selects, map, multi-select fields) — **not** image upload, which is tracked separately in `catalog-04-admin-event-image-upload`.

## What Changes

- **HeroUI DatePicker** for event date (replacing native `<Input type="date">`).
- **Select anchoring** — option lists appear below trigger (popover placement / portal fixes).
- **Multi-select** for `languages` and `target_age_groups` (predefined options → `text[]` / enum arrays).
- **MapLibre geolocation picker** island replacing lat/lng text fields; persist `map_zoom` (schema migration if missing).
- **No image changes** — see `catalog-04-admin-event-image-upload` for upload-only UI, R2 pipeline, and admin thumbnails.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Admin event form HeroUI-first controls, multi-select languages/age groups, map geolocation with zoom.

## Impact

- **App:** `EventAdminBaseFields`, `EventAdminForm` island, new `EventGeoPicker` island, admin routes for map fields, possible Drizzle migration for `events.map_zoom`.
- **Out of scope:** Image upload, R2, thumbnails, FileTrigger — `catalog-04-admin-event-image-upload`.
- **Depends on:** catalog-04 CRUD routes and domain layer.
- **Parallel with:** `catalog-04-admin-event-image-upload`.
