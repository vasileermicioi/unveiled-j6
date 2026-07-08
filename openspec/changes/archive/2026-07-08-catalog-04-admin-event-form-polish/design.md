## Context

catalog-04 delivered working admin event CRUD with HeroUI `Select` (via `AdminFormSelect` island), admin tab layout, and multipart forms including image upload + URL paste. This change improves **non-image** form UX only. Image handling is specified in `catalog-04-admin-event-image-upload`.

## Goals / Non-Goals

**Goals:**

- HeroUI DatePicker for event date.
- Multi-select for languages and target age groups.
- MapLibre map picker for lat/lng + zoom.
- Select popovers anchor correctly below triggers.

**Non-Goals:**

- Image upload, FileTrigger, R2 pipeline, admin list thumbnails — separate change.
- Partner form changes.
- Public event detail / SEO images (catalog-05).

## Decisions

### 1. DatePicker island

Wrap HeroUI `DatePicker` in client island; serialize selected date to hidden input or controlled field for SSR POST. Use Europe/Berlin timezone rules from domain layer for `date_time` derivation.

### 2. Multi-select languages / age groups

Reuse `AdminFormSelect` with `selectionMode="multiple"`. Options from existing admin-content catalogs. Server parses repeated fields or comma-joined hidden value into arrays.

### 3. Map geolocation picker

New `EventGeoPicker` island: MapLibre GL JS + OSM tiles (no API key). Draggable marker; hidden inputs `lat`, `lng`, `map_zoom`. Add `map_zoom` column via migration if not present.

### 4. Select placement

Continue `admin-form__select-popover` global styles; adjust `placement` / offset on `Select.Popover` if needed.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| DatePicker hydration mismatch | Island-only; default from server props on edit |
| Map bundle size | Lazy-load MapLibre in island only |
| `map_zoom` migration | Nullable default; backfill null for existing rows |

## Open Questions

- **Date-range series builder:** Include DatePicker in series slot UI in this change or follow-up? Prefer same change if series form shares base fields.
