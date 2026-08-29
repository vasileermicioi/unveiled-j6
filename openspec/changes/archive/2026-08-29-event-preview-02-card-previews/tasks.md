## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-preview-02-card-previews.md` (all 5 proposal sections + spec delta), the parent guide product-decision table, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm prerequisites exist: `AdminEventPreviewChrome`, `adminEventPreviewPath`, `preview.tsx` (`getEventById` + `guardAdminRoute` + `noindex`), `toEventCardItem`, `EventCard`, `EventFeedPage` grid classes, `DiscoverPage` `PageSectionHeader` + `getPageContent(locale, "discover").livePreview`, `previewDocumentTitle` / `previewSurfaceDetail`

## 2. Route folder, copy, and paths

- [x] 2.1 Move `apps/web/app/routes/[locale]/admin/events/[id]/preview.tsx` → `preview/index.tsx`. Detail URL `/:locale/admin/events/:id/preview` MUST stay 200. Pass `surface="detail"` into chrome once that prop exists (task 3.1)
- [x] 2.2 Add every DE/EN key from design.md decision 8 to `AdminCopy` + both locale objects **verbatim** (`previewSurfaceBrowse`, `previewSurfaceDiscover`, `previewBrowseNote`). Reuse `previewBanner`, `previewSurfaceDetail`, `previewDocumentTitle`, `previewAction`, audience keys
- [x] 2.3 Add `adminEventPreviewBrowsePath(locale, eventId)` and `adminEventPreviewDiscoverPath(locale, eventId)` on `admin-tabs.ts`. Extend `admin-route.test.ts` next to the existing `adminEventPreviewPath` test. Leave `inferAdminTab` unchanged

## 3. Chrome switcher

- [x] 3.1 Extend `AdminEventPreviewChrome` with `surface: "detail" | "browse" | "discover"`. Render three `Link`s (Detail, Browse events, Discover) using the path helpers and copy keys. Active surface gets `aria-current="page"`. Audience guest/member links render **only** when `surface === "detail"`. Banner + Draft/Published + edit + publish/unpublish stay on every surface. **No** `FormDraftPersistence`

## 4. Card preview routes

- [x] 4.1 Extract a shared `loadAdminEventPreview` (or equivalent) used by all three preview routes: `guardAdminRoute`, missing id/row → `NotFoundPage` + `noindex`. Do not call `listFeaturedEvents` or partner lists on card routes
- [x] 4.2 Route `/:locale/admin/events/:id/preview/browse`: `c.render` chrome (`surface="browse"`) + one `EventCard` in `Surface` `grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3` (same padding as `EventFeedPage` / `DiscoverPage`). Map with `toEventCardItem`. Viewer `{ kind: "member", subscriptionActive: true, saved: false }`. Omit `bookmarkFormAction`. `ctaHref` → `adminEventPreviewPath`. Optional muted `previewBrowseNote`. `robots: "noindex"`; title `previewDocumentTitle(...)`. **Not** `renderAdminPage` / `EventDiscoveryShell`
- [x] 4.3 Route `/:locale/admin/events/:id/preview/discover`: same grid; guest `EventCard` (default viewer); above it `PageSectionHeader` using Discover `livePreview` eyebrow/headline from `getPageContent(locale, "discover")`. Same `ctaHref` to detail preview. Works if the event is not featured. No partner marquee. Guest on either card route → login; USER → locale home
- [x] 4.4 If the two frames share more than a few duplicated lines, extract `AdminEventPreviewCardFrame` in `apps/web/app/components/admin/` — not `@unveiled/ui`

## 5. Optional Featured entry, sitemap, verification, and handoff

- [x] 5.1 Optional: add a Preview `Link` on the Featured events list (`AdminFeaturedListPage` / manager row) to `adminEventPreviewPath` (detail). Do not block the step if skipped
- [x] 5.2 Register `/admin/events/:id/preview/browse` and `/admin/events/:id/preview/discover` in `docs/product/sitemap/sitemap.md` next to the existing detail preview row. Leave canonical Gherkin / Playwright / i18n inventory for `event-preview-03-hardening`
- [x] 5.3 Run `bun run lint` — exit 0
- [x] 5.4 Run `bun run typecheck` — exit 0
- [x] 5.5 Manual/dev: ADMIN GET both new paths 200 for a draft; card title matches `toEventCardItem` / `resolveEventCopy`; browse shows member datetime/zip chrome and no save POST; discover shows guest card + Discover section header; CTA goes to detail preview (not public `/events/:id`); chrome switches among the three surfaces; guest → login; USER → locale home; live `/discover` and `/events` queries unchanged
- [x] 5.6 Mark step done in `.dev-plan/current-iteration/event-preview-parent-guide.md`; leave feature-file / e2e / i18n inventory for step 03
