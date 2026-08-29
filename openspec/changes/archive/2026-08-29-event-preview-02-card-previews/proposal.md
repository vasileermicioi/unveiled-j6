## Why

Step 01 shipped an admin detail preview that reuses `EventDetailPage`. Admins still cannot see the compact `EventCard` used on member Browse events and guest Discover, so they cannot check title, zip, next datetime, or featured-section chrome for a draft without publishing it.

## What Changes

- Add ADMIN-only GET `/:locale/admin/events/:id/preview/browse` that renders one `EventCard` in the same feed grid as `EventFeedPage` (member viewer, no bookmark form).
- Add ADMIN-only GET `/:locale/admin/events/:id/preview/discover` that renders one `EventCard` in the Discover featured grid (guest viewer) under the same `PageSectionHeader` copy as live Discover (`getPageContent(locale, "discover").livePreview`).
- Both pages work for unpublished events and for events that are not on the featured list. Card CTAs go to the admin detail preview, not public `/events/:id`.
- Extend `AdminEventPreviewChrome` with three surface links: Detail, Browse events, Discover. Active surface is the current route. Audience guest/member links stay on detail only.
- Register the two paths in `docs/product/sitemap/sitemap.md`. Optional Preview link on the Featured events list.
- Out of scope: map popup preview; partner-tile preview; Playwright / canonical Gherkin / i18n inventory (step 03); live Discover/Browse query changes; filter shell or partner marquee.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Admins can open `/:locale/admin/events/:id/preview/browse` and `.../preview/discover` to see the same `EventCard` treatment as member `/events` and guest Discover. Both pages are ADMIN-only, `noindex`, available for unpublished and non-featured events, and do not list other catalog events or run save/book POST.

## Impact

- **Routes:** `apps/web/app/routes/[locale]/admin/events/[id]/preview/browse.tsx` and `preview/discover.tsx`. Relocate existing `preview.tsx` to `preview/index.tsx` so HonoX can nest the new files (same detail URL). `guardAdminRoute`; `getEventById`; missing id → admin 404; guest → login; USER → locale home.
- **UI:** extend `AdminEventPreviewChrome` with surface links. Reuse `@unveiled/ui` `EventCard` + `toEventCardItem`. Discover frame uses `PageSectionHeader` + Discover `livePreview` eyebrow/headline. Optional shared grid helper stays in `apps/web/app/components/admin/`.
- **Copy:** `admin-content.ts` keys for Browse/Discover surface labels (match shell **Browse events** / **Events entdecken** and **Discover** / **Entdecken**) plus an optional muted browse note that filters/map are not part of this preview. Reuse `previewDocumentTitle`.
- **SEO:** both new pages `robots: "noindex"`. No JSON-LD.
- **Docs this step:** sitemap rows for `/admin/events/:id/preview/browse` and `.../preview/discover`. Canonical Gherkin / Playwright wait for `event-preview-03-hardening`.
- **Source brief:** `.dev-plan/current-iteration/event-preview-02-card-previews.md`
- **Parent:** `.dev-plan/current-iteration/event-preview-parent-guide.md`
- **Depends on:** `event-preview-01-detail-preview` (archived 2026-08-29)
- **Consumed by:** `event-preview-03-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; ADMIN GET both new paths 200 for a draft; card title matches `toEventCardItem` / `resolveEventCopy`; USER/guest cannot load the routes
