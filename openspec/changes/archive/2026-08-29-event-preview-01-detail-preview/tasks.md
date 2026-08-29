## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-preview-01-detail-preview.md` (all 5 proposal sections + spec delta), the parent guide product-decision table, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm prerequisites exist: `getEventById` (includes drafts), `getPublicEventById` (published only), `EventDetailPage` + `EventDetailCheckoutCard`, public `events/[id].tsx`, `toPublicEventGalleryImages`, `eventDetailPageMeta`, `guardAdminRoute`, `admin/events/[id]/delete.tsx` 404 pattern, `AdminEventsTable`, `EventAdminWizardPage`, `adminEventPublishPath` / `adminEventUnpublishPath`, `admin-content.ts` `statusDraft` / `statusPublished`

## 2. Inert `EventDetailPage`

- [x] 2.1 Add optional `preview?: { primaryHref: string; primaryLabel: string }` on `EventDetailPage`. When set, primary checkout action is that link; secondary is `null`; do not emit book / waitlist / login hrefs. Guest vs eligible chrome still follows `viewer`. Public `events/[id].tsx` omits the prop — verify public checkout actions are unchanged
- [x] 2.2 Preview route MUST NOT pass `bookedOccurrenceIsos`. `closeHref` is `adminEventsPath`. Verify the already-booked overlay and “My tickets” link do not appear on preview

## 3. Copy, paths, and icon

- [x] 3.1 Add every DE/EN key from design.md decision 7 to `AdminCopy` + both locale objects **verbatim** (`previewAction`, `previewPageTitle`, `previewBanner`, `previewAudienceGuest`, `previewAudienceMember`, `previewSurfaceDetail`, `previewOnlyCta`, `previewDocumentTitle`). Reuse `statusDraft`, `statusPublished`, `publishAction`, `unpublishAction`, `editAction`
- [x] 3.2 Add `adminEventPreviewPath(locale, eventId, audience?: "guest" | "member")` on `admin-tabs.ts`. Omit the query when audience is guest/undefined; `?audience=member` when member. Leave `inferAdminTab` unchanged
- [x] 3.3 Extend `AdminTableActionIcon` with `"preview"` and add `apps/web/public/icons/admin-preview.svg` (24 viewBox, square caps, `stroke-width="2"`, same family as existing admin icons)

## 4. Chrome and preview route

- [x] 4.1 Add `AdminEventPreviewChrome` (HeroUI `Surface` / `Paragraph` / `Link` / `Chip`): `previewBanner`; Draft/Published chip; edit + publish/unpublish links; audience guest/member links with `aria-current="page"` on the active one; Detail surface label only — **no** Browse/Discover links. **No** `FormDraftPersistence`
- [x] 4.2 Route `/:locale/admin/events/:id/preview`: `guardAdminRoute`; `getEventById` (not `getPublicEventById`); gallery + partner + hero credit same as public detail; `c.render` chrome + `EventDetailPage` (**not** `renderAdminPage` / `AdminLayout`); `robots: "noindex"`; title `previewDocumentTitle(resolveEventCopy(...).title)`; no JSON-LD; no `eventDetailPageMeta`. Missing id/row → `NotFoundPage` + `noindex`
- [x] 4.3 Default `viewer: { kind: "guest" }`. `?audience=member` only (case-sensitive) → `{ kind: "eligible" }` with `futureOccurrences` and synthetic credits `99` for `maxBookableTickets`. Do not use the admin session for viewer kind, credits, or booked slots. Pass `preview: { primaryHref: adminEventPreviewPath(...), primaryLabel: copy.previewOnlyCta }`
- [x] 4.4 Guest on the route → login; USER → locale home (same as other admin routes)

## 5. Catalog and edit entry

- [x] 5.1 `AdminEventsTable`: insert Preview action after edit (`adminEventPreviewPath`, `copy.previewAction`, icon `"preview"`)
- [x] 5.2 `EventAdminWizardPage` edit header: text `Link` (`className="link"`) to preview next to publish/unpublish. Create wizard has no Preview link

## 6. Sitemap, verification, and handoff

- [x] 6.1 Register `/admin/events/:id/preview?audience=` in `docs/product/sitemap/sitemap.md` next to publish/unpublish. Leave canonical Gherkin / Playwright / i18n inventory for `event-preview-03-hardening`
- [x] 6.2 Run `bun run lint` — exit 0
- [x] 6.3 Run `bun run typecheck` — exit 0
- [x] 6.4 Manual/dev: ADMIN GET `/en/admin/events/:id/preview` 200 for a draft (`getEventById`); guest chrome by default; `?audience=member` shows date/credit chrome; no book/waitlist/save POST or href to those mutation routes; guest → login; USER → locale home; public `/en/events/:id` for that draft remains 404
- [x] 6.5 Mark step done in `.dev-plan/current-iteration/event-preview-parent-guide.md`; leave feature-file / e2e / i18n inventory for step 03
