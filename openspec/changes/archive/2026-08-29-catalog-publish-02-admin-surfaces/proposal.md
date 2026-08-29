## Why

Step 01 shipped `published` flags and `set*Published` use cases, and Discover/Browse already hide drafts. Admins still have no control surface: lists do not show Published/Draft, and there is no SSR confirm to publish or unpublish an event, featured event, or featured partner. New creates stay unpublished (DB default) with no path to go live.

## What Changes

- Add Published / Draft status on the admin Events catalog, Featured events list, and Featured partners grid. Unpublished rows stay on those admin lists.
- Add six dedicated ADMIN confirm routes (GET + form POST, delete-class, no `FormDraftPersistence`): `/:locale/admin/events/:id/publish|unpublish`, `/:locale/admin/featured/:eventId/publish|unpublish`, `/:locale/admin/featured-partners/:partnerId/publish|unpublish`. POST calls the matching `set*Published` and redirects to the originating list. Missing row → 404. Already in the target state → idempotent success.
- Events catalog: Publish action when draft, Unpublish when published; optional `published=yes|no` query + native select on `AdminEventsListFilters` (preserve sort/title/partner/language). `listEvents` / `countEvents` accept optional `published?: boolean`.
- Event edit: text link to the matching confirm page (not a modal). Create-success and featured-add success copy MUST NOT imply Browse/Discover is updated; point at publish confirm.
- Featured manager islands stay reorder/remove-only. Publish is a link out. Expose featured-membership `published` on admin list DTOs (`FeaturedEventRow` currently aliases catalog `Event.published`; `FeaturedPartnerRow` has no flag).
- DE/EN admin copy in `admin-content.ts`. Sitemap table rows for the six routes and the events `published=` query. `AdminTableActions` may gain `publish` / `unpublish` icon keys.
- Out of scope: event preview routes; Playwright / canonical Gherkin (step 03); `partners.published`; bulk actions; client-side publish toggles.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: ADMIN Events catalog shows Published/Draft, optional `published=yes|no` filter, and dedicated SSR publish/unpublish confirm pages. Event edit and create-success point at publish confirm; create MUST NOT imply the event is live on Browse.
- `admin-featured-partners`: ADMIN Featured events and Featured partners lists show Published/Draft for the **featured membership** flag and link to dedicated SSR publish/unpublish confirms. Adding to featured creates an unpublished row and MUST NOT by itself update Discover.

## Impact

- **Routes:** `admin/events/[id]/publish.tsx`, `unpublish.tsx`; `admin/featured/[eventId]/publish.tsx`, `unpublish.tsx`; `admin/featured-partners/[partnerId]/publish.tsx`, `unpublish.tsx`. Pattern: `admin/events/[id]/delete.tsx`.
- **UI:** `AdminEventsTable`, `AdminEventsListFilters`, `AdminEventsListPage`, event edit/create wizard success, `AdminFeaturedListPage` / `AdminFeaturedPartnersListPage`, featured manager islands (display + link only), `AdminTableActions` + icons under `apps/web/public/icons/`.
- **Copy:** `apps/web/app/lib/admin-content.ts` (Published / Veröffentlicht, Draft / Entwurf, Publish / Veröffentlichen, Unpublish / Veröffentlichung aufheben, confirm titles/bodies, success flash via `?ok=`).
- **Domain (additive, UI-enabling):** `listEvents` / `countEvents` optional `published`; featured list rows include membership `published` distinct from catalog `Event.published`. No new write path — still `setEventPublished` / `setFeaturedEventPublished` / `setFeaturedPartnerPublished`.
- **Docs this step:** `docs/product/sitemap/sitemap.md` route rows only. Canonical Gherkin / Playwright wait for step 03.
- **Source brief:** `.dev-plan/current-iteration/catalog-publish-02-admin-surfaces.md`
- **Parent:** `.dev-plan/current-iteration/catalog-publish-parent-guide.md`
- **Depends on:** `catalog-publish-01-schema-and-domain` (archived)
- **Consumed by:** `catalog-publish-03-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; GET confirm pages 200 for ADMIN, guest → login, USER → locale home; POST flips `published` and redirects to the originating list
