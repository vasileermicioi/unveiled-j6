## Why

Steps 01–03 shipped gallery schema, ADMIN manage UI, and the public detail slider, but `docs/product/` Gherkin, UI map, i18n inventory, seed data, and e2e/demo coverage still lag the implementation. Without this hardening slice the feature is not releasable: QA and agents lack a single SoT for add/remove/view/slider, and staging demos have no seeded multi-image gallery to exercise.

## What Changes

- Update product Gherkin (`admin-events.feature`, `event-discovery.feature`) with gallery admin multi-add/remove and public gallery/slider scenarios (proximity/layout selectors only).
- Sync sitemap notes (if any gaps), `ui/ui-component-map.md`, `content-i18n-inventory.md`, `image-uploads.md` cross-links, and schema overview gaps if found.
- Record the **featured-only display** decision explicitly in `gaps-and-decisions.md` (display whenever gallery non-empty; not gated on Discover featured membership).
- Extend demo seed so at least one upcoming **featured** event has ≥2 gallery images after `bun run seed:demo`.
- Add or extend Playwright coverage for admin gallery + public slider happy paths when existing e2e hooks allow; otherwise document a staging/local demo script in `apps/web/DEPLOYMENT.md` / parent guide.
- Polish admin empty/error/max-cap copy and slider a11y labels found while hardening.
- Mark step 04 and the parent feature releasable in `.dev-plan/current-iteration/featured-event-gallery-parent-guide.md`; note `client-image-resize` dependency satisfied if that feature also shipped.
- **No** new resize pipeline work, drag-and-drop reorder, partner portal gallery, or Discover card multi-image carousels.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `admin-events`: Product feature file and BDD/e2e SHALL match shipped ADMIN gallery list/add/remove SSR routes, multi-upload, multi/single remove confirm, and max-12 capacity error behavior.
- `event-discovery`: Product feature file SHALL describe public end-of-page gallery + slider; demo seed SHALL guarantee at least one upcoming featured event with multiple gallery images visible on public detail.
- `bdd-and-e2e`: Playwright SHALL cover gallery happy paths (admin add/remove and public slider) when env allows, or document an explicit manual demo script + skip reason.
- `image-uploads`: Docs SHALL stop treating multi-image event galleries as out of scope; cross-link `event_gallery_images` / featured-event-gallery behavior while keeping primary `events.image_id` singular.

## Impact

- **Product SoT:** `docs/product/features/admin-events.feature`, `event-discovery.feature`; `sitemap/sitemap.md`; `ui/ui-component-map.md`; `extras/content-i18n-inventory.md`, `gaps-and-decisions.md`, `image-uploads.md`; schema overview only if gaps remain.
- **Seed:** `packages/db/src/catalog/seed.ts` (+ seed image fixtures / `addEventGalleryImages` as needed) so a featured upcoming demo event has ≥2 gallery images.
- **E2E:** `e2e/specs/admin-events.spec.ts`, `e2e/specs/event-discovery.spec.ts` (and fixtures if needed); or documented demo steps in `apps/web/DEPLOYMENT.md`.
- **App polish (narrow):** admin gallery error/empty/max-cap copy; public slider a11y labels (`event-detail-gallery-copy`, admin gallery content) — no new product surfaces.
- **Planning:** parent guide step 04 → done / feature releasable.
- **Source brief:** `.dev-plan/current-iteration/featured-event-gallery-04-docs-and-hardening.md`
- **Parent:** `.dev-plan/current-iteration/featured-event-gallery-parent-guide.md`
- **Depends on:** `featured-event-gallery-03-public-gallery-and-slider` (done)
- **Consumed by:** closes Featured Event Gallery
- **Verification:** `bun run lint`, `bun run typecheck`, `bun run test:e2e` for touched specs (or skip noted); manual demo from parent release criteria
