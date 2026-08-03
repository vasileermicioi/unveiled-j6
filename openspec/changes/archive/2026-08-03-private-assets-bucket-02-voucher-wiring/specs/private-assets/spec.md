## ADDED Requirements

### Requirement: Voucher PDFs use private asset helpers

All create-path writes and member reads of voucher PDF bytes SHALL use the `@unveiled/images` private-bucket helpers. Catalog image variant upload/download SHALL continue to use the public bucket helpers and `IMAGE_PUBLIC_BASE_URL`.

#### Scenario: Voucher staging and seed write privately

- **WHEN** admin staging upload, demo seed, or e2e inventory helpers upload voucher PDF bytes
- **THEN** those writes use `uploadPrivateObject` (or equivalent private helper)
- **AND** they MUST NOT use public `uploadObject` for voucher keys

#### Scenario: Member download reads privately

- **WHEN** the ownership-gated voucher.pdf route streams a PDF
- **THEN** it uses `getPrivateObject` (or equivalent private helper)
- **AND** it MUST NOT construct a URL from `IMAGE_PUBLIC_BASE_URL` and the voucher `object_key`

#### Scenario: Image pipeline unchanged

- **WHEN** catalog image variants are uploaded or served
- **THEN** public bucket helpers and `IMAGE_PUBLIC_BASE_URL` remain in use
