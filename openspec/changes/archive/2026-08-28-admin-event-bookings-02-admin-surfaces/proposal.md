## Why

Step 01 shipped `listEventBookings`, `listEventsWithBookingStats`, and `cancelAllBookingsForEvent`, but admins still only reach a single no-refund cancel page from member detail, and `/admin/bookings` is inferred as the Users tab. Admins cannot inspect bookings per event or run cancel-all (refund + waitlist close) from a dedicated SSR confirm page, and members are not emailed after bulk cancel.

## What Changes

- Add ADMIN chrome tab **Buchungen** / **Bookings** after Events. Paths: `adminBookingsPath`, `adminEventBookingsPath`, `adminEventBookingsCancelAllPath`. `inferAdminTab`: `/admin/bookings` and `/admin/events/:id/bookings*` → `bookings` (stop mapping `/admin/bookings` to `users`). Single-booking cancel also highlights Bookings.
- `GET /:locale/admin/bookings?title=&partner=&page=` — stats table of events with bookings or waitlist (from `listEventsWithBookingStats`). Row links to the per-event list. GET filters, page size 25.
- `GET /:locale/admin/events/:id/bookings?status=&page=` — that event’s bookings. CONFIRMED rows link to existing single cancel (no-refund). Toolbar **Cancel all confirmed bookings** when confirmed count > 0. Events catalog row action **Bookings** / **Buchungen**.
- `GET`+`POST /:locale/admin/events/:id/bookings/cancel-all` — dedicated confirm page; native `textarea` for required reason; **no** `FormDraftPersistence`. POST calls `cancelAllBookingsForEvent` then sends emails. Redirect `?ok=cancel-all`.
- `@unveiled/email`: post-commit cancellation email to each cancelled CONFIRMED member; waitlist-closed email to former WAITING members. Same from-address env as booking confirmation. Never throw on Resend failure.
- Verbatim DE/EN copy in `admin-content.ts`. Ladle: `AdminTabNav` Bookings story.
- Out of scope: Playwright, canonical Gherkin/sitemap (step 03). Changing single-cancel refund policy. Event delete/unpublish. Export CSV changes.

## Capabilities

### New Capabilities

- `admin-event-bookings`: ADMIN Bookings tab, per-event booking list, Events-catalog Bookings action, and SSR cancel-all confirm (reason, counts, two-path warnings, post-commit emails).

### Modified Capabilities

- `booking`: After a successful event cancel-all commit, email each member whose CONFIRMED booking was cancelled (ticket void; credit-return sentence when `total_credits > 0`). Email failure MUST NOT roll back the cancellation.
- `waitlist`: After a successful event cancel-all commit, email each former WAITING member that the waitlist is closed (no credit language). Email failure MUST NOT roll back waitlist close.

## Impact

- **Admin chrome:** `admin-tabs.ts`, `AdminTabNav.tsx`, `admin-content.ts` (`tabBookings` after Events), `inferAdminTab` order (bookings routes before `/admin/events` and `/admin/users` fallthrough).
- **Routes:** `admin/bookings/index.tsx`, `admin/events/[id]/bookings/index.tsx`, `admin/events/[id]/bookings/cancel-all.tsx`. Existing `admin/bookings/[id]/cancel.tsx` stays no-refund; tab highlight only.
- **UI:** stats table, per-event table, cancel-all confirm page (HeroUI layout + native textarea/select). Events table Bookings action. Success flash `ok=cancel-all`.
- **Domain (additive):** extend `cancelAllBookingsForEvent` result with notification snapshots so POST can email the exact members cancelled in that transaction (no paginated pre-query).
- **Email (`@unveiled/email`):** cancellation + waitlist-closed builders/senders; web POST log-and-continue (same pattern as `sendBookingConfirmation`).
- **Source brief:** `.dev-plan/current-iteration/admin-event-bookings-02-admin-surfaces.md`
- **Parent:** `.dev-plan/current-iteration/admin-event-bookings-parent-guide.md`
- **Depends on:** `admin-event-bookings-01-domain` (archived)
- **Consumed by:** `admin-event-bookings-03-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test packages/email`; manual ADMIN drill-down + cancel-all + USER denied
