# Ticket Redemption

Schema and domain rules for secret-code-only events and voucher inventory (promo codes / PDF tickets) with per-ticket redemption records.

## Requirements

### Requirement: Voucher inventory tables

The system SHALL store redeemable voucher assets per event in dedicated inventory tables in `public`, not as a single shared `promo_code` on the event used as the redemption source for new writes. Promo-code inventory SHALL live in `event_voucher_codes`. PDF voucher inventory SHALL live in `event_voucher_pdfs` (R2 object key + metadata). Each inventory row SHALL have status `AVAILABLE` or `ALLOCATED`. An allocated row SHALL reference the `booking_tickets` row that consumed it (nullable until allocation). Schema and types SHALL be exported from `@unveiled/db`.

#### Scenario: Promo code inventory row

- **WHEN** an admin persists promo codes for a `VOUCHER_PROMO` event
- **THEN** each code is stored as its own `event_voucher_codes` inventory row with status `AVAILABLE` or `ALLOCATED`
- **AND** an allocated row references the booking ticket that consumed it

#### Scenario: PDF voucher inventory row

- **WHEN** an admin persists sliced ticket PDFs for a `VOUCHER_PDF` event
- **THEN** each ticket PDF is stored as its own `event_voucher_pdfs` inventory row (R2 object key + metadata) with status `AVAILABLE` or `ALLOCATED`
- **AND** an allocated row references the booking ticket that consumed it

### Requirement: Per-ticket redemption records

The system SHALL record one redemption artifact per ticket on a booking in `booking_tickets` (exported from `@unveiled/db`), with ordinal `1..N` unique per booking and fields for code text and/or PDF reference plus optional voucher URL. For every newly created confirmed booking with `tickets_count = N`, the Booking domain SHALL write exactly N `booking_tickets` rows inside the booking transaction (including `SECRET_CODE` events, which copy the shared event secret onto each ticket without consuming inventory).

#### Scenario: Multi-ticket booking shape

- **WHEN** a booking is created with `tickets_count = N` (N ≥ 1)
- **THEN** exactly N `booking_tickets` rows exist for that booking (ordinal 1..N)
- **AND** each row carries the redemption payload for that ticket (code text and/or PDF reference, plus optional voucher URL)

### Requirement: Ticket types and secret codes

The system SHALL support ticket types `SECRET_CODE`, `VOUCHER_PROMO`, and `VOUCHER_PDF` only. Secret-code events SHALL always use a single admin-configured manual `secret_code` shared by all bookings of that event. The system SHALL NOT store or accept `secret_code_mode`. Legacy rows with `ticket_type = VOUCHER` SHALL migrate to `VOUCHER_PROMO`. Legacy non-empty `promo_code` values SHALL seed at most one `AVAILABLE` inventory row (not duplicated to capacity); new event writes SHALL NOT require or persist event-level `promo_code` as the voucher redemption source.

#### Scenario: Secret code has no mode

- **WHEN** an admin creates or edits a `SECRET_CODE` event
- **THEN** the only redemption field required is `secret_code`
- **AND** no `secret_code_mode` value is stored or accepted

#### Scenario: Legacy voucher migration

- **WHEN** existing rows with `ticket_type = VOUCHER` are migrated
- **THEN** they become `VOUCHER_PROMO`
- **AND** a non-empty legacy `promo_code` becomes at most one `event_voucher_codes` row (or remains for admin re-upload if empty)

### Requirement: Atomic per-ticket voucher allocation

The Booking domain SHALL allocate exactly one unused inventory asset per ticket for `VOUCHER_PROMO` and `VOUCHER_PDF` events inside the same Postgres transaction that creates the booking and deducts credits/capacity. Allocation SHALL lock candidate `AVAILABLE` inventory rows (using `SELECT … FOR UPDATE SKIP LOCKED` or an equivalent safe lock) and set them to `ALLOCATED` with `booking_ticket_id` pointing at the consuming `booking_tickets` row. When available inventory is less than the requested ticket count, the booking SHALL be rejected with typed error `INSUFFICIENT_VOUCHER_INVENTORY` and MUST NOT change credits, capacity, inventory, ledger, or booking rows.

#### Scenario: Promo codes for a multi-ticket booking

- **WHEN** a member books N tickets on a `VOUCHER_PROMO` event with at least N `AVAILABLE` codes
- **THEN** N distinct codes become `ALLOCATED`
- **AND** each appears on one `booking_tickets` row for that booking
- **AND** credits and remaining capacity decrease by the usual amounts

#### Scenario: PDF vouchers for a multi-ticket booking

- **WHEN** a member books N tickets on a `VOUCHER_PDF` event with at least N `AVAILABLE` PDFs
- **THEN** N distinct PDF inventory rows become `ALLOCATED`
- **AND** each booking ticket references its PDF inventory row for later download

#### Scenario: Insufficient voucher inventory

- **WHEN** available inventory is less than the requested ticket count
- **THEN** the booking is rejected with `INSUFFICIENT_VOUCHER_INVENTORY`
- **AND** no credits, capacity, inventory, or booking rows change

### Requirement: Cancel restocks voucher inventory

Admin cancellation of a confirmed booking SHALL return that booking’s allocated promo codes and PDF vouchers to `AVAILABLE`, clear inventory `booking_ticket_id` links, and clear live redemption payloads on the related `booking_tickets` rows. Credits MUST NOT be auto-refunded. Bookings that are not `CONFIRMED` (including future `USED` check-in) SHALL NOT be cancelled via this path and therefore SHALL NOT restock inventory.

#### Scenario: Cancel returns promo codes

- **WHEN** an admin cancels a confirmed `VOUCHER_PROMO` booking
- **THEN** each allocated code for its booking tickets becomes `AVAILABLE` again
- **AND** remaining capacity increases by the booking’s ticket count as today
- **AND** credits are still not auto-refunded

#### Scenario: Cancel returns PDF vouchers

- **WHEN** an admin cancels a confirmed `VOUCHER_PDF` booking
- **THEN** each allocated PDF inventory row becomes `AVAILABLE` again with `booking_ticket_id` cleared
- **AND** remaining capacity increases by the booking’s ticket count as today

### Requirement: Secret code redemption on booking

For `SECRET_CODE` events, every booking ticket SHALL receive the event’s configured manual secret code (same value for all tickets and bookings). No inventory row is consumed. The booking-level `redemption_*` fields SHALL summarize ticket ordinal 1 for backward-compatible readers until member UI reads per-ticket rows.

#### Scenario: Secret code booking

- **WHEN** a member books any ticket count on a `SECRET_CODE` event with a configured `secret_code`
- **THEN** each booking ticket’s redemption info equals that secret code
- **AND** no `event_voucher_codes` or `event_voucher_pdfs` rows change status

### Requirement: Admin promo code file upload with preview

Admins SHALL upload promo codes for `VOUCHER_PROMO` events from a text or CSV file (and MAY paste the same content). The browser SHALL parse the file as one non-empty trimmed code per line and preview codes before an SSR form POST persists them. Inventory rows SHALL NOT be written until the form is successfully posted. After a successful save, each previewed code SHALL exist as an `AVAILABLE` `event_voucher_codes` row for that event. On edit, a new upload SHALL append by default; an optional replace-unused control MAY delete only `AVAILABLE` rows before append and MUST NOT delete `ALLOCATED` rows.

#### Scenario: Preview then save promo codes

- **WHEN** an admin selects a text/CSV file on the event form
- **THEN** the UI lists the extracted non-empty codes (one per line) for preview
- **AND** no inventory rows are written until the form is successfully posted
- **AND** after a successful save each previewed code exists as an `AVAILABLE` inventory row

#### Scenario: Edit appends promo codes by default

- **WHEN** an admin edits a `VOUCHER_PROMO` event that already has inventory
- **AND** uploads additional codes without replace-unused
- **THEN** the new codes are inserted as `AVAILABLE`
- **AND** existing `ALLOCATED` and prior `AVAILABLE` rows remain

### Requirement: Admin PDF voucher split with preview

Admins SHALL stock `VOUCHER_PDF` inventory either by (1) uploading one master PDF, configuring pages to skip as comma-separated pages/ranges (e.g. `1-3,7,9-10`) and pages per ticket (default 1), and seeing only the resulting ticket count; or (2) uploading multiple PDF files where each file is one ticket. Client-side split/upload SHALL produce one downloadable PDF object per ticket stored in R2; the SSR create/edit path SHALL insert corresponding `AVAILABLE` `event_voucher_pdfs` rows. Preview islands SHALL NOT write inventory alone.

#### Scenario: Configure split and preview tickets

- **WHEN** an admin uploads a PDF and sets skip = S and pages-per-ticket = P
- **THEN** the UI shows one preview entry per derived ticket after the skipped pages
- **AND** confirming the event form stores one downloadable PDF object per previewed ticket as `AVAILABLE` inventory

#### Scenario: Invalid split configuration

- **WHEN** skip/pages-per-ticket leave zero complete tickets
- **THEN** the UI prevents submit and explains that no tickets were produced

### Requirement: Admin redemption configuration validation on create

Creating an event (including series create of voucher-typed base fields) SHALL validate redemption fields by ticket type as follows: `SECRET_CODE` requires `secretCode`; `VOUCHER_PROMO` requires a non-empty promo inventory payload and `eventWebsiteUrl`; `VOUCHER_PDF` requires a non-empty PDF inventory payload. There is no secret-code mode field. Editing an event MAY omit a new inventory payload when inventory already exists for that type.

#### Scenario Outline: Required redemption inputs

- **WHEN** an admin creates an event with ticket type "<ticketType>"
- **AND** omits "<requiredField>"
- **THEN** creation is rejected until it is provided

| ticketType    | requiredField        |
|---------------|----------------------|
| SECRET_CODE   | secretCode           |
| VOUCHER_PROMO | promo inventory      |
| VOUCHER_PROMO | eventWebsiteUrl      |
| VOUCHER_PDF   | PDF ticket inventory |

#### Scenario: Edit without new inventory keeps existing stock

- **WHEN** an admin edits a voucher event and does not upload new inventory
- **THEN** the save succeeds if event-level redemption fields remain valid
- **AND** existing inventory rows are unchanged

### Requirement: Masked redemption codes on member bookings

Members SHALL see secret codes and promo codes on My Tickets and booking confirm masked by default, with a control to show or hide each code. Each confirmed booking SHALL list one redemption row per `booking_tickets` row (ordered by ordinal). Textual codes (`SECRET_CODE` / `VOUCHER_PROMO`) SHALL NOT be readable as plain text in the initial SSR HTML presentation; a client island MAY reveal the code after the member activates the control. Copy-to-clipboard SHALL copy the real code value even while the code remains masked. When `tickets_count > 1`, each row SHALL be labeled with a localized Ticket 1..N (or equivalent) label. Promo types SHALL continue to expose the partner website link when a redemption URL is present.

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

### Requirement: PDF voucher objects in private storage

PDF voucher inventory objects referenced by `event_voucher_pdfs.object_key` SHALL be stored in the configured private S3-compatible bucket, not in the public catalog image bucket. Admin staging upload for voucher PDFs SHALL write to the private bucket. The ownership-gated download route `/:locale/bookings/:bookingId/tickets/:ticketId/voucher.pdf` SHALL read object bytes from the private bucket after verifying the signed-in user owns the booking ticket. The system MUST NOT expose voucher PDFs via `IMAGE_PUBLIC_BASE_URL` or any public object URL. Product and e2e documentation for ownership-gated PDF voucher download SHALL state that bytes are read from the private assets bucket. Tests MAY skip when private (or shared) S3 configuration is unavailable, with an explicit skip reason that names the private bucket requirement. Behavior for guests and non-owners remains denial without exposing a public object URL.

#### Scenario: Member downloads owned PDF voucher

- **WHEN** a booking owner requests their ticket’s voucher.pdf route
- **THEN** the server streams the PDF from the private bucket as an attachment

#### Scenario: Non-owner cannot download

- **WHEN** a different signed-in user or a guest requests that voucher.pdf URL
- **THEN** the download is denied (redirect/401 for guests; 404 for non-owners) without reading a public CDN URL

#### Scenario: Admin stages PDF into private bucket

- **WHEN** an admin uploads a voucher PDF via the staging upload route
- **THEN** the object is stored in the private bucket and the returned `objectKey` is suitable for inventory rows

#### Scenario: Docs and e2e name private storage

- **WHEN** an agent reads product/integration docs and e2e skip inventory for PDF voucher download
- **THEN** those materials state that PDF bytes are read from the private assets bucket
- **AND** missing private (or shared) S3 configuration produces a named skip mentioning the private bucket

### Requirement: Canonical product docs match shipped redemption

The project’s canonical product specs SHALL describe only `SECRET_CODE` (manual), `VOUCHER_PROMO` (line-file inventory), and `VOUCHER_PDF` (split-PDF inventory), including member masked codes and PDF download, and SHALL NOT document secret-code generation modes or a single shared event `promo_code` as the voucher source. At minimum, `docs/product/features/booking.feature`, `docs/product/features/admin-events.feature`, and `docs/product/database/schema-overview.md` SHALL agree with the implemented allocation and UI behavior. Removed modes MAY appear only in historical decision notes (`gaps-and-decisions.md`). Sitemap SHALL list the auth-gated PDF download route; the UI component map SHALL list inventory islands and the reveal control.

#### Scenario: Feature files and schema overview agree

- **WHEN** an agent reads `booking.feature`, `admin-events.feature`, and `schema-overview.md` after this step
- **THEN** those documents match the implemented allocation and UI behavior
- **AND** removed modes (`SHARED_GENERATED`, `UNIQUE_PER_BOOKING`, `secret_code_mode` as a live field) appear only in historical decision notes if needed

#### Scenario: Sitemap and UI map include member PDF and reveal

- **WHEN** an agent reads `docs/product/sitemap/sitemap.md` and `docs/product/ui/ui-component-map.md` after this step
- **THEN** the PDF download route `/:locale/bookings/:bookingId/tickets/:ticketId/voucher.pdf` is documented
- **AND** member reveal control and admin voucher inventory islands are listed

### Requirement: Automated coverage for redemption types

The test suite SHALL cover booking and My Tickets behavior for secret code, promo inventory, and PDF inventory paths, including reveal/hide and authorized PDF download. Playwright scenario titles SHALL track the rewritten Gherkin. Obsolete tests for `SHARED_GENERATED`, `UNIQUE_PER_BOOKING`, or single shared `VOUCHER` promo SHALL be removed (not left as permanent skips for removed product modes).

#### Scenario: Playwright redemption smoke

- **WHEN** CI or local e2e runs the booking redemption specs
- **THEN** each of the three ticket types has at least one passing member-visible assertion
- **AND** secret/promo paths assert masked-by-default reveal/hide
- **AND** the PDF path asserts an authorized download (and denial for guest/other user), or records a named env skip when private-bucket (and required shared/override) S3 configuration is unavailable

### Requirement: GDPR export includes per-ticket redemption

Member GDPR data export SHALL include per-ticket redemption fields from `booking_tickets` for each of the user’s bookings (ordinal plus code text and/or PDF reference as applicable), in addition to any booking-level `redemption_*` summary fields.

#### Scenario: Export contains booking tickets

- **WHEN** a member (or admin acting for them) exports user data for an account that has a confirmed booking with `booking_tickets` rows
- **THEN** the export payload includes those ticket redemption fields
- **AND** booking-level redemption summary fields remain present for compatibility

### Requirement: Demo seed stocks three redemption types

`bun run seed:demo` SHALL create or leave at least one upcoming bookable event for each of `SECRET_CODE`, `VOUCHER_PROMO`, and `VOUCHER_PDF`, with promo/PDF inventory sufficient for multi-ticket bookings (at least four available inventory rows for voucher types when capacity allows).

#### Scenario: Seeded promo and PDF inventory

- **WHEN** an operator runs a fresh demo seed with required env
- **THEN** they can book a multi-ticket `VOUCHER_PROMO` and a multi-ticket `VOUCHER_PDF` event without manually stocking inventory first
- **AND** an existing `SECRET_CODE` demo event remains bookable
