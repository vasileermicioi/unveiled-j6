## 1. Setup

- [x] 1.1 Read `docs/migration/extras/seo-and-metadata.md` and `docs/migration/ui/ui-component-map.md` EventCard/Event Detail sections
- [x] 1.2 Confirm at least one upcoming event exists in DB (run `bun run seed:demo` on empty DB or verify admin-created event)
- [x] 1.3 Verify root `.env` and staging have R2 vars (`IMAGE_PUBLIC_BASE_URL`, S3 credentials) per `apps/web/DEPLOYMENT.md`

## 2. `@unveiled/ui` package

- [x] 2.1 Scaffold `packages/ui` (`package.json`, `tsconfig.json`, workspace exports) with deps `@heroui/react`, `@unveiled/images`, `react`
- [x] 2.2 Add `EventCardItem`, `EventCardViewerState` types and image srcset helpers in `src/types.ts` / `src/image-urls.ts`
- [x] 2.3 Implement `EventCard` with guest-first CTA, `medium-640`/`small-320` srcset, category badge, bookmark `aria-label`, and HeroUI-only markup
- [x] 2.4 Export from `src/index.ts`; add `@unveiled/ui` dependency to `apps/web/package.json`
- [x] 2.5 Add theme classes for EventCard in `apps/web/app/styles/globals.css` if needed beyond preview styles

## 3. Public catalog queries

- [x] 3.1 Add `listUpcomingEvents(db, { limit, now })` — future events only, `date_time ASC`, default limit 6
- [x] 3.2 Add `getPublicEventById(db, eventId)` — thin wrapper over `getEventById`
- [x] 3.3 Export new functions from `@unveiled/db` index; add integration test for upcoming filter and ordering
- [x] 3.4 Add partner list query or reuse `listPartners` for discover venue grid (logos via `medium-640`)

## 4. Discover page wiring

- [x] 4.1 Update `discover.tsx` route to fetch upcoming events and partners from DB
- [x] 4.2 Refactor `DiscoverPage` to accept live event/partner props; replace `EventCardPreview` with `@unveiled/ui` `EventCard`
- [x] 4.3 Link each EventCard CTA to `/:locale/events/:id`; keep static marketing copy verbatim
- [x] 4.4 Render partner logos with `buildVariantUrl(logoImageId, "medium-640.webp")` or initial-letter placeholder
- [x] 4.5 Remove or stop importing `MOCK_DISCOVER_EVENTS` for the event grid

## 5. Public event detail route

- [x] 5.1 Create `apps/web/app/routes/[locale]/events/[id].tsx` — no auth gate
- [x] 5.2 Create `EventDetailPage` component with hero srcset (`hero-1920` through `small-320`), full field set, map placeholder
- [x] 5.3 Guest CTA links to `/:locale/login` (or membership banner); sold-out/past messaging without hard 404
- [x] 5.4 Return `NotFoundPage` with 404 for unknown event id

## 6. SEO and structured data

- [x] 6.1 Add `eventDetailPageMeta` and `eventJsonLd` helpers in `apps/web/app/lib/seo.ts`
- [x] 6.2 Extend `buildPageMeta` to support optional `robots` meta (`noindex, follow` when not bookable)
- [x] 6.3 Wire event detail route render options: unique title/description, canonical, hreflang, `og-1200x630`, Twitter card
- [x] 6.4 Emit `schema.org/Event` JSON-LD script in event detail HTML

## 7. Deployment and docs

- [x] 7.1 Update `apps/web/DEPLOYMENT.md` — Phase 4 release gate, R2 setup, admin credentials, `seed:demo`, image URL convention, staging smoke checklist
- [ ] 7.2 Deploy to staging and run Phase 4 client demo script (admin upload → discover → shareable event URL)

## 8. Validation

- [x] 8.1 Verify `/de/discover` shows up to 6 real EventCards from DB
- [x] 8.2 Verify `/de/events/:id` without login — 200, hero srcset, event-specific title/description, `og:image` = `og-1200x630`, JSON-LD present
- [x] 8.3 Run `bun run lint && bun run typecheck && bun run build`

## 9. Cleanup

- [x] 9.1 Mark step 05 and Phase 4 complete in `.dev-plan/current-iteration/catalog-parent-guide.md`
- [x] 9.2 Remove dead `EventCardPreview` / mock discover event imports if no longer referenced
