## ADDED Requirements

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
- **AND** the PDF path asserts an authorized download (and denial for guest/other user), or records a named env skip when R2/secrets are unavailable

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
