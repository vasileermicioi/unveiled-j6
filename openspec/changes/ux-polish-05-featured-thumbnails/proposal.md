## Why

Admins managing Featured events see title/partner/date only, so similar rows are hard to distinguish at a glance. Parent UX polish step 05 closes the feature by adding primary-image thumbnails on the featured list and add-results, matching the existing admin events/partners table pattern.

## What Changes

- Wire `imageId` → `small-320.webp` thumb URLs into featured list and add-results loaders (try/catch so bad IDs never throw).
- Render a compact thumbnail cell on `AdminFeaturedTable` and `AdminFeaturedAddResults` (HeroUI chrome + `<img>` exception; theme `.admin-table__logo` styles; safe placeholder when missing/broken).
- Missing or broken thumbs MUST NOT block add/remove/gallery actions.
- Update `admin-events.feature`, `ui-component-map`, coverage matrix, and Playwright proximity assertions for featured thumbs.
- Mark `ux-polish-05-featured-thumbnails` done in the parent guide (feature complete).
- Out of scope: Discover EventCard redesign; partners grid; new image variants; featured drag-reorder; other polish steps.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Featured events list and add-results SHALL show a primary-image thumbnail per row; missing/broken thumbs MUST NOT block add/remove actions.
- `bdd-and-e2e`: Playwright SHALL assert a thumbnail associated with featured event rows using proximity-only selectors (or a named coverage-matrix deferral).

## Impact

- **Admin UI (`apps/web`):** `AdminFeaturedTable`, `AdminFeaturedAddResults`, `AdminFeaturedListPage`, `AdminFeaturedAddPage`; featured list/add routes build and pass `imageUrls` (mirror events `index.tsx` / `AdminEventsTable`).
- **Images:** Reuse `@unveiled/images` `buildVariantUrl(..., "small-320.webp")` — no new variants; no schema/migration.
- **Docs / e2e:** `admin-events.feature`, `ui-component-map.md`, `coverage-matrix.md`, `e2e/specs/admin-events.spec.ts` (featured scenarios).
- **Source brief:** `.dev-plan/current-iteration/ux-polish-05-featured-thumbnails.md`
- **Parent:** `.dev-plan/current-iteration/ux-polish-parent-guide.md` (closes the feature when done)
- **Depends on:** none (independently mergeable; preferred after 04 for delivery order only)
- **Verification:** `bun run lint`; `bun run typecheck`; featured-events Playwright touched (existing R2/env skips unchanged)
