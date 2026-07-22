## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/featured-event-gallery-04-docs-and-hardening.md` and parent guide release criteria / non-goals / open “featured-only” question
- [x] 1.2 Confirm prerequisites: admin gallery routes + public slider shipped; `admin-events.feature` / `event-discovery.feature`, sitemap, ui-component-map, bdd-and-e2e, seed paths exist
- [x] 1.3 Skim shipped copy surfaces (`admin-content.ts` gallery keys, `event-detail-gallery-copy.ts`) and existing e2e hooks (`admin-events.spec.ts`, `event-discovery.spec.ts`)

## 2. Product docs & decisions

- [x] 2.1 Add gallery scenarios to `docs/product/features/admin-events.feature` (multi-upload, SSR remove single/multi, capacity; proximity-friendly wording; stable Scenario titles)
- [x] 2.2 Add gallery scenarios to `docs/product/features/event-discovery.feature` (guest gallery + slider, omit when empty, featured demo seed guarantee)
- [x] 2.3 Update `ui/ui-component-map.md` Event detail (+ admin Events as needed) for end-of-page gallery / slider / manage entry
- [x] 2.4 Update `extras/content-i18n-inventory.md` for new admin + public gallery strings; verify sitemap gallery rows; fix schema overview only if gaps remain
- [x] 2.5 Update `extras/image-uploads.md` so multi-image galleries are in-scope / cross-linked (not §9 out-of-scope); keep primary `events.image_id` singular
- [x] 2.6 Record featured-only display decision in `extras/gaps-and-decisions.md` (show gallery whenever non-empty; not gated on Discover featured)

## 3. Demo seed

- [x] 3.1 Extend `packages/db/src/catalog/seed.ts` (and helpers as needed) so after feature rows are created, one upcoming featured event gets ≥2 gallery images via persist prebuilt + `addEventGalleryImages` (distinct image ids from hero)
- [x] 3.2 Verify seed path locally (`bun run seed:demo` / force reset as documented) shows multiple gallery thumbs on that event’s public detail

## 4. E2E, demo script, and polish

- [x] 4.1 Add/adjust Playwright tests with verbatim Scenario titles for admin gallery add/remove and public slider; skip with named env reasons when R2/admin/DB unavailable
- [x] 4.2 Update `docs/product/testing/coverage-matrix.md` (and DEPLOYMENT demo steps if any path is manual-only)
- [x] 4.3 Polish admin empty/max-cap/error copy and slider a11y labels only where gaps are found

## 5. Validation and release close-out

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run `bun run test:e2e` for touched specs when env allows; otherwise note skipped with reason
- [x] 5.3 Confirm parent release criteria: admin multi add/remove, public thumbs + slider, hero unchanged, docs/product reflects gallery
- [x] 5.4 Mark step 04 done and feature releasable in `.dev-plan/current-iteration/featured-event-gallery-parent-guide.md`; note `client-image-resize` dependency satisfied if that feature also shipped
