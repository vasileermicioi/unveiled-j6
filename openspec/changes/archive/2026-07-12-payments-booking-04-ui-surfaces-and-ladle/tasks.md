## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/payments-booking-04-ui-surfaces-and-ladle.md`, design.md, sitemap `/bookings`, pagination page size 20, app-shell My Tickets, and design-system story ownership
- [x] 1.2 Confirm step 03 artifacts: book/confirm routes, `BookConfirmPage` redemption UI, `MembershipInfoPage` view states, existing Ladle guest membership story
- [x] 1.3 Identify pagination templates to mirror (`event-feed.ts` / `EventFeedPagination`) and nav/copy extension points (`copy.ts`, `AppNavbar`, `AppNavbarMenu`)

## 2. Booking list domain + route

- [x] 2.1 Implement `listUserBookings` in `@unveiled/db` (`BOOKINGS_PAGE_SIZE = 20`, newest-first, booking + event summary fields); export from booking index
- [x] 2.2 Add `apps/web` pagination helpers (`parse` / clamp / redirect) for `?page=` on `/bookings`
- [x] 2.3 Add SSR route `apps/web/app/routes/[locale]/bookings.tsx` + `MyTicketsPage` with empty state, ticket rows, and SSR prev/next pagination (no client-only fetch; no self-cancel)

## 3. Shared ticket UI + nav

- [x] 3.1 Extract `TicketRedemptionBlock` / `BookingTicketCard` (HeroUI-only); refactor `BookConfirmPage` to compose them without changing confirm copy/CTAs
- [x] 3.2 Add My Tickets copy (`myBookings` DE/EN + empty/pagination strings) and wire USER nav link in `AppNavbar` + mobile menu to `/:locale/bookings`
- [x] 3.3 Set `/bookings` meta to `noindex` if other gated member pages do; audit new UI for raw HTML / non-theme color utilities

## 4. Ladle stories

- [x] 4.1 Add `mockBooking` (and related) fixtures; document booking as an allowed page-level story group in `docs/product/ui/design-system.md`
- [x] 4.2 Add Ladle stories: `BookConfirmPage`, `BookingTicketCard`, expand `MembershipInfoPage` (`guest` / `checkout` / `active` / `frozen`), and `BookEventPage` `past_due` if past-due messaging is not on membership
- [x] 4.3 Spot-check stories compile/load via `bun run stories` (or web filter); list story paths for Phase 6 demo handoff

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` until exit 0
- [x] 5.2 Manual check: signed-in member with a booking sees it on `/bookings` page 1; confirm empty state path mentally or with a zero-booking user
- [x] 5.3 Confirm no waitlist UI, Playwright, Stripe/webhook changes, or self-cancel controls were added; mark step 04 done in `payments-booking-parent-guide.md`
