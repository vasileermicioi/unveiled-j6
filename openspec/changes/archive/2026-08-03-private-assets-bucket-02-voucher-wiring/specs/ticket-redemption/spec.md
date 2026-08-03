## ADDED Requirements

### Requirement: PDF voucher objects in private storage

PDF voucher inventory objects referenced by `event_voucher_pdfs.object_key` SHALL be stored in the configured private S3-compatible bucket, not in the public catalog image bucket. Admin staging upload for voucher PDFs SHALL write to the private bucket. The ownership-gated download route `/:locale/bookings/:bookingId/tickets/:ticketId/voucher.pdf` SHALL read object bytes from the private bucket after verifying the signed-in user owns the booking ticket. The system MUST NOT expose voucher PDFs via `IMAGE_PUBLIC_BASE_URL` or any public object URL.

#### Scenario: Member downloads owned PDF voucher

- **WHEN** a booking owner requests their ticket’s voucher.pdf route
- **THEN** the server streams the PDF from the private bucket as an attachment

#### Scenario: Non-owner cannot download

- **WHEN** a different signed-in user or a guest requests that voucher.pdf URL
- **THEN** the download is denied (redirect/401 for guests; 404 for non-owners) without reading a public CDN URL

#### Scenario: Admin stages PDF into private bucket

- **WHEN** an admin uploads a voucher PDF via the staging upload route
- **THEN** the object is stored in the private bucket and the returned `objectKey` is suitable for inventory rows
