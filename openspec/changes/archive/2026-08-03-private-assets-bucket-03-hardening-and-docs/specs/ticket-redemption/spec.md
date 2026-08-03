## MODIFIED Requirements

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

### Requirement: Automated coverage for redemption types

The test suite SHALL cover booking and My Tickets behavior for secret code, promo inventory, and PDF inventory paths, including reveal/hide and authorized PDF download. Playwright scenario titles SHALL track the rewritten Gherkin. Obsolete tests for `SHARED_GENERATED`, `UNIQUE_PER_BOOKING`, or single shared `VOUCHER` promo SHALL be removed (not left as permanent skips for removed product modes).

#### Scenario: Playwright redemption smoke

- **WHEN** CI or local e2e runs the booking redemption specs
- **THEN** each of the three ticket types has at least one passing member-visible assertion
- **AND** secret/promo paths assert masked-by-default reveal/hide
- **AND** the PDF path asserts an authorized download (and denial for guest/other user), or records a named env skip when private-bucket (and required shared/override) S3 configuration is unavailable
