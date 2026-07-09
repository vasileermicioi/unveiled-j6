## 1. Setup and helpers

- [x] 1.1 Confirm `listMemberFeedEvents`, `MEMBER_FEED_PAGE_SIZE`, and related exports from `@unveiled/db`; confirm `EventCard` / `resolveEventCardCta` viewer API and `toEventCardItem`
- [x] 1.2 Add `apps/web/app/lib/event-feed.ts` with `parseEventFeedQuery`, `buildEventFeedQueryString`, `clampEventFeedPage`, and `eventFeedPageRedirectPath` (params: `category`, `partnerId`, `from`, `to`, `page`; page size 24)
- [x] 1.3 Add `guardMemberFeedRoute` (session + login `returnTo` with path/search; allow USER and ADMIN; redirect PARTNER) in `apps/web/app/lib/event-feed-route.ts` or equivalent
- [x] 1.4 Add unit tests for event-feed query parse/build/clamp helpers

## 2. Feed UI components

- [x] 2.1 Add `EventFeedFilters` (HeroUI GET form: category/partner `Select`, `from`/`to` date inputs, reset `Link` to bare `/events`, active date-range label; copy from `filters` i18n inventory)
- [x] 2.2 Add `EventFeedPage` composing subscription-gate `Banner`/`Alert`, filters, EventCard grid, pagination ("Showing X–Y of Z"), and empty/no-results state — HeroUI-only, Tailwind layout only
- [x] 2.3 Wire EventCard `viewer` from subscription status; CTA hrefs: sold-out → detail, inactive → `/membership`, ACTIVE → detail; omit `onBookmarkToggle`

## 3. Route and data loading

- [x] 3.1 Implement `apps/web/app/routes/[locale]/events/index.tsx` GET: guard → parse query → load subscription + `listMemberFeedEvents` + partner/category options → clamp page redirect → `c.render` with `robots: "noindex"`
- [x] 3.2 Ensure filter option lists use admin category options + `listPartners`; map events via `toEventCardItem`

## 4. Verification and cleanup

- [x] 4.1 Run `bun run typecheck` and `bun run lint`
- [x] 4.2 Manual USER walkthrough: default today feed, category/partner/`from`+`to`, reset, empty state, pagination with preserved params, guest login redirect, inactive subscription banner
- [x] 4.3 Mark step 02 done in `discovery-parent-guide.md` and document the feed query-param contract for the map step
