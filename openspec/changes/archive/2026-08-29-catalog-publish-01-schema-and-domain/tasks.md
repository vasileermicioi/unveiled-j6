## 1. Setup

- [x] 1.1 Read the step plan, parent guide product-decision table, `proposal.md`, `design.md`, and the four spec deltas; confirm artifacts exist (`packages/db/src/schema/events.ts`, `featured-events.ts`, `featured-partners.ts`; `catalog/events.ts`, `discovery.ts`, `featured-events.ts`, `featured-partners.ts`, `seed.ts`; `booking/book-event.ts`; `waitlist/join-waitlist.ts`; `apps/web/app/routes/[locale]/discover.tsx`)
- [x] 1.2 Lock approach: backfill `true` then default `false`; independent flags; `publishedOnly` default false; Discover uses `publishedOnly: true`; unpublished is `EVENT_NOT_FOUND` / `PARTNER_NOT_FOUND`; no create/edit `published` input; do not edit `docs/product/` Gherkin

## 2. Schema and migration

- [x] 2.1 Add `published: boolean("published").notNull().default(false)` on `events`, `featured_events`, and `featured_partners`; add `index("events_published_date_time_idx").on(published, dateTime)` on `events`; inferred `Event` / featured types pick it up without create-input changes
- [x] 2.2 Generate SQL (`bun run db:generate`); hand-edit so each table adds `published boolean DEFAULT true NOT NULL` then `ALTER … SET DEFAULT false`; apply (`bun run db:migrate`) and confirm existing rows are `true`

## 3. Publish use cases

- [x] 3.1 Add `setEventPublished(db, eventId, published)` in `catalog/events.ts`: missing row → `EVENT_NOT_FOUND`; already in the requested state is a no-op success; does not touch bookings or featured rows; export from `@unveiled/db`
- [x] 3.2 Add `setFeaturedEventPublished(db, eventId, published)` and `setFeaturedPartnerPublished(db, partnerId, published)`: missing featured row → `EVENT_NOT_FOUND` / `PARTNER_NOT_FOUND`; no-op when already set; do not change catalog event/partner `published` or membership

## 4. Public, member, sitemap, and save filters

- [x] 4.1 Change `getPublicEventById` to return null when `published` is false; keep `getEventById` / `listEvents` unfiltered (admin drafts stay readable)
- [x] 4.2 Add `events.published = true` to `memberFeedConditions`, `listSavedUpcomingEvents`, `listBookableEventsForSitemap`, and `listUpcomingEvents`
- [x] 4.3 Make `saveEvent` load the event and reject missing/unpublished with `EVENT_NOT_FOUND` (no row written); leave `unsaveEvent`, `isEventSaved`, and `listSavedEventIds` unchanged

## 5. Featured lists and Discover leak-prevention

- [x] 5.1 Add `publishedOnly?: boolean` (default false) to `listFeaturedEvents` / `listFeaturedPartners`; when true, require `featured_*.published` and, for events, `events.published`; admin list/reorder/remove keep the default
- [x] 5.2 Change `apps/web/app/routes/[locale]/discover.tsx` to `listFeaturedEvents(db, { publishedOnly: true })` and `listFeaturedPartners(db, { publishedOnly: true, limit: 8 })`; do not add upcoming-only

## 6. Booking and waitlist gates

- [x] 6.1 In `bookEvent`, after idempotency return and event lock, reject `!event.published` as `EVENT_NOT_FOUND` before credits/capacity/inventory writes; existing `CONFIRMED` rows stay
- [x] 6.2 In `joinWaitlist`, after qty validation: if no existing `WAITING` row, load the event and reject missing/unpublished as `EVENT_NOT_FOUND`; return an existing `WAITING` row without creating another

## 7. Demo seed

- [x] 7.1 After each demo `createEvent` / `addFeaturedEvent` / `addFeaturedPartner` (including voucher/locale helper creates), call the matching `set*Published(..., true)` so seeded Discover and Browse still show demo rows

## 8. Tests

- [x] 8.1 Catalog/public: unpublished event absent from `getPublicEventById`, `listBookableEventsForSitemap`, `listUpcomingEvents`; present in `listEvents` / `getEventById`; `setEventPublished` no-op and not-found cases
- [x] 8.2 Discovery: unpublished absent from member feed, map helper, and `listSavedUpcomingEvents`; `saveEvent` rejects unpublished; existing save row remains after unpublish
- [x] 8.3 Featured: unpublished featured event/partner absent from `publishedOnly` lists, present in admin lists; featured published + event unpublished absent from `publishedOnly`; `setFeatured*Published` does not drop membership
- [x] 8.4 Booking/waitlist: `bookEvent` and `joinWaitlist` reject unpublished with no booking/ledger/waitlist write; existing `CONFIRMED` / `WAITING` rows survive unpublish; seed path still yields published featured rows

## 9. Verification and handoff

- [x] 9.1 Run `bun run lint` — exits 0
- [x] 9.2 Run `bun run typecheck` — `@unveiled/db` exits 0; full `bun run typecheck` still fails only on pre-existing `apps/web/app/client.ts` `import.meta.glob` typings
- [x] 9.3 Run `bun test packages/db/src/catalog/ packages/db/src/booking/ packages/db/src/waitlist/` — exits 0 including the new published cases
- [x] 9.4 Mark step 01 done in `.dev-plan/current-iteration/catalog-publish-parent-guide.md`; do not rewrite canonical Gherkin or schema overview (step 03)
