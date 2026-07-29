## ADDED Requirements

### Requirement: Masked redemption codes on member bookings

Members SHALL see secret codes and promo codes on My Tickets and booking confirm masked by default, with a control to show or hide each code. Text confirmed booking SHALL list one redemption row per `booking_tickets` row (ordered by ordinal). Textual codes (`SECRET_CODE` / `VOUCHER_PROMO`) SHALL NOT be readable as plain text in the initial SSR HTML presentation; a client island MAY reveal the code after the member activates the control. Copy-to-clipboard SHALL copy the real code value even while the code remains masked. When `tickets_count > 1`, each row SHALL be labeled with a localized Ticket 1..N (or equivalent) label. Promo types SHALL continue to expose the partner website link when a redemption URL is present.

#### Scenario: Reveal and hide a secret code

- **WHEN** a member views a confirmed `SECRET_CODE` booking on My Tickets or booking confirm
- **THEN** the secret code is not readable as plain text by default
- **AND** activating the reveal control shows the code
- **AND** activating hide masks it again

#### Scenario: Multi-ticket promo codes

- **WHEN** a member views a confirmed booking with multiple `VOUCHER_PROMO` tickets
- **THEN** each ticket’s promo code appears as its own masked row with its own reveal control
- **AND** copy on a row copies that ticket’s code

#### Scenario: Website link preserved for promo

- **WHEN** a member views a confirmed `VOUCHER_PROMO` booking with a redemption URL
- **THEN** each applicable row (or the redemption block) still offers the partner website action

### Requirement: PDF voucher download for members

Members SHALL be able to download each allocated PDF voucher for their own bookings via an authenticated application route. The download route SHALL verify that the session user owns the booking that contains the ticket, resolve the ticket’s `voucher_pdf_id` to the inventory object key, stream the PDF bytes (or equivalent proxy response), and set `Content-Disposition` to attachment with a sensible filename. Guests and other users MUST NOT receive the PDF (redirect to login or 401/403/404 per app auth patterns). The UI SHALL offer one download action per `VOUCHER_PDF` ticket on My Tickets and booking confirm.

#### Scenario: Download own PDF ticket

- **WHEN** a member opens a confirmed `VOUCHER_PDF` booking
- **THEN** each ticket offers a download action
- **AND** the download returns that ticket’s PDF as an attachment
- **AND** another user or guest cannot download that PDF

#### Scenario: Multi-ticket PDF downloads

- **WHEN** a member views a confirmed booking with multiple `VOUCHER_PDF` tickets
- **THEN** each ticket has its own download control
- **AND** each control downloads a distinct voucher PDF for that ticket
