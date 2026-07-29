## Why

Inventory allocation and admin stocking (steps 02–03) are shipped, but members still see a single plain-text redemption block (booking-level `redemption_*` only) with no per-ticket rows, no masked reveal, and no PDF download. Without step 04, multi-ticket promo/PDF bookings and secret-code privacy on My Tickets / confirm remain unfinished.

## What Changes

- Thread `booking_tickets` from `listUserBookings` / confirm loaders into My Tickets and booking confirm UI props.
- Render **one redemption row per ticket** (labels Ticket 1..N when `tickets_count > 1`) on confirm and compact list cards.
- Mask `SECRET_CODE` / `VOUCHER_PROMO` codes by default (password-style); client island toggles show/hide with eye / eye-off; copy-to-clipboard works on the real value while masked.
- For `VOUCHER_PDF`, offer a per-ticket download control served by an **auth-gated** app route that checks booking ownership (proxy R2 bytes; `Content-Disposition: attachment`).
- Preserve partner website link for promo types when `redemption_url` / event website is present.
- Update DE/EN copy for reveal/hide, download, and multi-ticket labels.
- Out of scope: admin inventory UI; email PDF attachments; partner check-in; full Gherkin / product-doc rewrite (05).

## Capabilities

### New Capabilities

- _(none)_ — member reveal/download extends existing `ticket-redemption` and `booking` capabilities.

### Modified Capabilities

- `ticket-redemption`: Masked secret/promo codes with per-ticket reveal; ownership-checked PDF voucher download for members.
- `booking`: Post-booking actions and My Tickets consume per-ticket redemptions (reveal/hide, PDF download) instead of a single plain-text booking-level block.

## Impact

- **UI:** `TicketRedemptionBlock` (+ compact), `BookingTicketCard`, `BookConfirmPage`, `MyTicketsPage`; confirm + bookings routes.
- **Islands:** `RevealSecretIsland` (or extend redemption block / `CopyRedemptionButton`) under `apps/web/app/islands/`.
- **Routes:** Auth-gated PDF download e.g. `/:locale/bookings/:bookingId/tickets/:ticketId/voucher.pdf`.
- **Domain/storage:** Booking ownership check + resolve `voucher_pdf_id` → `event_voucher_pdfs.object_key`; add `getObject` (or equivalent) in `@unveiled/images` if missing.
- **Copy:** `bookings-content` / `booking-content` DE/EN keys.
- **Source brief:** `.dev-plan/current-iteration/ticket-redemption-04-member-bookings-ui.md`
- **Parent:** `.dev-plan/current-iteration/ticket-redemption-parent-guide.md`
- **Depends on:** `ticket-redemption-02-allocation-domain`, `ticket-redemption-03-admin-voucher-ui` (done / archived)
- **Consumed by:** `ticket-redemption-05-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; manual member smoke (masked SECRET_CODE; multi promo rows; multi PDF downloads; guest denied)
