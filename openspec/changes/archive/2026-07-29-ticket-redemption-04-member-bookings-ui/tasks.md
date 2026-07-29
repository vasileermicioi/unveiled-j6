## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/ticket-redemption-04-member-bookings-ui.md`, parent guide, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm prerequisites: `listUserBookings` returns `tickets`, `listBookingTickets` exported, admin-stocked demo events available; locate `TicketRedemptionBlock`, `BookingTicketCard`, `MyTicketsPage`, `BookConfirmPage`, confirm + bookings routes, `CopyRedemptionButton`

## 2. PDF download path

- [x] 2.1 Add `getObject` (or equivalent) in `@unveiled/images` using `GetObjectCommand`; export from package index
- [x] 2.2 Add booking-domain helper e.g. `getOwnedBookingTicketPdf(db, { userId, bookingId, ticketId })` that enforces ownership and returns object key + ordinal/filename metadata; export from booking index
- [x] 2.3 Add auth-gated GET route `/:locale/bookings/:bookingId/tickets/:ticketId/voucher.pdf` that streams PDF with `Content-Disposition: attachment`; guests redirect/401; other users 404

## 3. Member redemption UI

- [x] 3.1 Add DE/EN copy keys in `booking-content` / `bookings-content` for show/hide, download PDF, and Ticket 1..N labels
- [x] 3.2 Build `RevealSecretIsland` (or combined code controls) under `apps/web/app/islands/` — masked by default, eye toggle, copy works while masked; Lucide Eye/EyeOff OK
- [x] 3.3 Refactor `TicketRedemptionBlock` (+ compact) to render one row per ticket: masked code rows for SECRET/PROMO, download link for PDF, preserve promo website link; fall back to booking-level summary only if tickets empty
- [x] 3.4 Wire `tickets` through `MyTicketsPage` → `BookingTicketCard` and confirm loader (`listBookingTickets`) → `BookConfirmPage`
- [x] 3.5 Update stories/fixtures for multi-ticket SECRET / PROMO / PDF presentation
- [x] 3.6 Tolerate cancelled/cleared redemptions without crashing (omit empty rows or muted empty state)

## 4. Verification and handoff

- [x] 4.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [ ] 4.2 Manual member smoke: book SECRET_CODE → masked on `/bookings` + confirm → eye reveals/hides; copy still works masked
- [ ] 4.3 Manual: book VOUCHER_PROMO ×2 → two masked rows with independent reveal; book VOUCHER_PDF ×2 → two downloads succeed while logged in; guest/other user denied
- [x] 4.4 Mark step 04 done in `.dev-plan/current-iteration/ticket-redemption-parent-guide.md`; note PDF route for sitemap/BDD in step 05
