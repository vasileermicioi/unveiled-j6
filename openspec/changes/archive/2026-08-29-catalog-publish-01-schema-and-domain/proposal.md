## Why

Every catalog event is treated as live today (`getPublicEventById` aliases `getEventById`; Discover lists every featured row). Admins cannot keep a draft in the catalog without it appearing on Browse, Discover, public detail, sitemap, or booking. This first slice of **catalog publish** adds independent `published` flags and enforces the visibility/booking gates in `@unveiled/db` so step 02 can be admin-UI only.

## What Changes

- Add `published` boolean NOT NULL on `events`, `featured_events`, and `featured_partners`. Migration backfills existing rows to `true`, then sets the column default to `false` for new inserts. Add a btree index on `events (published, date_time)`.
- **BREAKING (domain):** Public/member readers no longer treat unpublished rows as live. `getPublicEventById` returns null when unpublished; `getEventById` / `listEvents` / unfiltered `listFeatured*` stay admin-visible.
- Add `setEventPublished`, `setFeaturedEventPublished`, and `setFeaturedPartnerPublished`. Missing row → existing catalog not-found (`EVENT_NOT_FOUND` / `PARTNER_NOT_FOUND`). No-op when already in the requested state. Unpublish does not delete rows, cancel bookings, or flip the other flags.
- Filter member feed (`memberFeedConditions`), saved-upcoming, sitemap (`listBookableEventsForSitemap`), and admin comp picker (`listUpcomingEvents`) to `events.published = true`. `saveEvent` rejects unpublished (`EVENT_NOT_FOUND`). `unsaveEvent` unchanged.
- `listFeaturedEvents` / `listFeaturedPartners` gain `publishedOnly?: boolean` (default `false` for admin). When true, require the featured flag and, for events, catalog `events.published`. **This step flips Discover** to `publishedOnly: true` so unpublished featured rows cannot leak before admin UI exists.
- `bookEvent` and waitlist join reject unpublished events as not found / not bookable. Existing `CONFIRMED` bookings and existing save/waitlist rows stay.
- Demo seed explicitly publishes demo events, featured events, and featured partners after create/add so seeded Discover and Browse keep working.
- Out of scope: admin publish pages, Playwright, canonical `docs/product/` Gherkin (step 03), event preview.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: `published` on events and featured rows; `set*Published` use cases; public `getPublicEventById` hides drafts; admin lists stay unfiltered.
- `event-discovery`: Member feed, map helper, saved-upcoming, and Discover `publishedOnly` lists omit unpublished rows; `saveEvent` rejects unpublished.
- `booking`: `bookEvent` rejects unpublished events (`EVENT_NOT_FOUND`); existing `CONFIRMED` bookings stay.
- `waitlist`: `joinWaitlist` rejects unpublished events; existing `WAITING` rows stay.

## Impact

- **DB:** `packages/db/src/schema/events.ts`, `featured-events.ts`, `featured-partners.ts`; new Drizzle migration after `0029` (backfill `true` → default `false`; index `events_published_date_time_idx`).
- **Domain (`@unveiled/db`):** `catalog/events.ts` (`getPublicEventById`, `listUpcomingEvents`, `listBookableEventsForSitemap`, `setEventPublished`); `catalog/discovery.ts`; `catalog/featured-events.ts`; `catalog/featured-partners.ts`; `catalog/seed.ts`; `booking/book-event.ts`; `waitlist/join-waitlist.ts`.
- **SSR leak-prevention only:** `apps/web/app/routes/[locale]/discover.tsx` calls `listFeaturedEvents({ publishedOnly: true })` and `listFeaturedPartners({ publishedOnly: true, limit: 8 })`. No admin routes or copy.
- **Tests:** catalog / discovery / featured / booking / waitlist package tests next to existing files — unpublished absent from public/member/sitemap/`publishedOnly` lists; present in admin lists; booking/waitlist/save reject unpublished; seed still yields published featured rows.
- **Source brief:** `.dev-plan/current-iteration/catalog-publish-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/catalog-publish-parent-guide.md`
- **Consumed by:** `catalog-publish-02-admin-surfaces`; `event-preview-01-detail-preview` may start after this step
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test packages/db/src/catalog/ packages/db/src/booking/ packages/db/src/waitlist/`
