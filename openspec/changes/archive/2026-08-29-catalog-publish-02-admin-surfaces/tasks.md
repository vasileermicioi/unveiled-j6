## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/catalog-publish-02-admin-surfaces.md` (all 5 proposal sections + spec deltas), the parent guide product-decision table / mutations / admin-lists rows, archived `catalog-publish-01-schema-and-domain` design, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm prerequisites exist: `setEventPublished`, `setFeaturedEventPublished`, `setFeaturedPartnerPublished`; Discover `publishedOnly: true`; `admin/events/[id]/delete.tsx`; `AdminEventsTable`, `AdminEventsListFilters`, `AdminFeaturedListPage`, `AdminFeaturedPartnersListPage`; manager islands; `admin-content.ts`; `docs/product/sitemap/sitemap.md`

## 2. Domain DTO and events list filter

- [x] 2.1 Extend `FeaturedEventRow` to `Event & { sortOrder: number; featuredPublished: boolean }`; map `featuredEvents.published` in `listFeaturedEvents` without overwriting catalog `Event.published`; `addFeaturedEvent` returns `featuredPublished: false`; `reorderFeaturedEvents` keeps the field via `listFeaturedEvents`
- [x] 2.2 Extend `FeaturedPartnerRow` the same way (`featuredPublished` from `featured_partners.published`); `addFeaturedPartner` returns `featuredPublished: false`
- [x] 2.3 Add `published?: boolean` to `ListEventsOptions`, `CountEventsOptions`, and `eventListFilterConditions`; omit the predicate when undefined. Do **not** pass `published` into `searchEventsNotFeatured`
- [x] 2.4 Package tests: `listEvents({ published: false })` / `countEvents` return drafts only; `listFeaturedEvents` row has `featuredPublished` independent of `event.published`; unpublished featured partner row still appears on the unfiltered admin list

## 3. Copy, paths, and icons

- [x] 3.1 Add every DE/EN key from design.md decision 7 to `AdminCopy` + both locale objects **verbatim** (`statusPublished`, `statusDraft`, publish/unpublish actions and confirm titles/bodies, filter labels, `okPublish` / `okUnpublish`, `featuredCatalogDraftNote`)
- [x] 3.2 Add path helpers on `admin-tabs.ts`: `adminEventPublishPath`, `adminEventUnpublishPath`, `adminFeaturedPublishPath`, `adminFeaturedUnpublishPath`, `adminFeaturedPartnerPublishPath`, `adminFeaturedPartnerUnpublishPath`. Leave `inferAdminTab` unchanged
- [x] 3.3 Extend `AdminTableActionIcon` with `"publish"` | `"unpublish"` and add `apps/web/public/icons/admin-publish.svg` / `admin-unpublish.svg` (same 16–24px stroke as existing admin icons)

## 4. Events catalog list

- [x] 4.1 Parse `published=yes|no` on `AdminEventsListQuery` / `parseAdminEventsListQuery` (invalid/omitted = no filter). Thread `published` through `buildAdminListQueryString`, list pagination, `AdminEventsListFilters` (`AdminFormSelect` All / Published / Draft), `hasFilters` / `resetHref`, and `AdminEventsTable` `sortHref`. Verify `admin-route.test.ts` / `admin-list` tests cover yes/no/omit and that sort+page keep the param
- [x] 4.2 `admin/events/index.tsx`: pass `published` into `listEvents` and `countEvents`. `AdminEventsListPage` shows `?ok=publish|unpublish|created` via `admin-flash admin-flash--success`
- [x] 4.3 `AdminEventsTable`: Status column with HeroUI `Chip` (`statusPublished` / `statusDraft`); Publish action when draft, Unpublish when published (after edit). Unpublished rows remain when the filter is omitted

## 5. Confirm pages

- [x] 5.1 Add shared `AdminPublishConfirmPage` (HeroUI title, body, optional draft note, primary submit, cancel `Link` to the originating list). **No** `FormDraftPersistence`
- [x] 5.2 Event GET+POST `/:locale/admin/events/:id/publish` and `.../unpublish` modeled on `delete.tsx`: `guardAdminRoute`; `getEventById` 404; POST `setEventPublished`; success `302` to events list `?ok=publish` or `?ok=unpublish`; idempotent if already in target state
- [x] 5.3 Featured event GET+POST `/:locale/admin/featured/:eventId/publish|unpublish`: 404 if featured membership missing (even if catalog event exists); POST `setFeaturedEventPublished`; show `featuredCatalogDraftNote` when catalog `event.published === false`; redirect to `adminFeaturedPath` with `?ok=`
- [x] 5.4 Featured partner GET+POST `/:locale/admin/featured-partners/:partnerId/publish|unpublish`: 404 if featured membership missing; POST `setFeaturedPartnerPublished`; redirect to `adminFeaturedPartnersPath` with `?ok=`
- [x] 5.5 Guest on any of the six routes → login; USER → locale home (same as other admin confirms)

## 6. Create, edit, and featured-add pointers

- [x] 6.1 After successful `createEvent`, redirect to `adminEventPublishPath` (not a silent list redirect that implies Browse is live). Confirm cancel returns to the events list
- [x] 6.2 After successful `addFeaturedEvent` / `addFeaturedPartner`, redirect to that row’s featured publish confirm. Confirm cancel returns to the featured list
- [x] 6.3 Event edit chrome: text `Link` to publish or unpublish confirm (not a modal, not a primary submit). Edit-save redirect stays the events list

## 7. Featured lists

- [x] 7.1 `AdminFeaturedListPage`: pass `featuredPublished`, `statusLabel`, `publishHref`, `publishLabel` into manager items. Island renders Chip + `Link` beside the title with `stopDragGesture`. Reorder POST body unchanged (ids only)
- [x] 7.2 Same status + confirm links on `AdminFeaturedPartnersListPage` / `AdminFeaturedPartnersManager`
- [x] 7.3 Featured lists show `?ok=publish|unpublish` flash. Unpublished featured rows stay on the list

## 8. Sitemap, verification, and handoff

- [x] 8.1 Register the six routes in `docs/product/sitemap/sitemap.md` and add `published=` to the Events list query-string notes. Leave canonical Gherkin / Playwright for `catalog-publish-03-hardening`
- [x] 8.2 Run `bun run lint` — exit 0
- [x] 8.3 Run `bun run typecheck` — exit 0
- [x] 8.4 Manual/dev: ADMIN GET confirm pages 200; POST flips `published` and lands on the originating list with flash; `published=no` lists drafts only; create lands on publish confirm; featured add lands on featured publish confirm; guest → login; USER → locale home
- [x] 8.5 Mark step done in `.dev-plan/current-iteration/catalog-publish-parent-guide.md`; leave feature-file / e2e / schema-overview / i18n inventory for step 03
