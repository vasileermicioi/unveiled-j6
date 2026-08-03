# Private Assets

Dedicated private S3-compatible object storage for non-public files (e.g. voucher PDFs), separate from the public catalog image bucket and CDN.

## Requirements

### Requirement: Private S3-compatible bucket configuration

The system SHALL support a dedicated private object-storage bucket for non-public files, configured via `S3_PRIVATE_BUCKET` and optional `S3_PRIVATE_ENDPOINT`, `S3_PRIVATE_REGION`, `S3_PRIVATE_ACCESS_KEY_ID`, and `S3_PRIVATE_SECRET_ACCESS_KEY`. When an optional override is unset, the corresponding public `S3_ENDPOINT` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` value SHALL be used. The private bucket MUST NOT be exposed through `IMAGE_PUBLIC_BASE_URL` or any other public CDN base URL. The `@unveiled/images` package SHALL expose helpers to upload and download objects in the private bucket separately from the public catalog image bucket helpers.

#### Scenario: Private bucket required for private helpers

- **WHEN** private upload/download is invoked without `S3_PRIVATE_BUCKET`
- **THEN** the helper fails with a clear configuration error

#### Scenario: Shared credentials with distinct bucket

- **WHEN** only `S3_PRIVATE_BUCKET` is set among the private overrides and public `S3_*` credentials are present
- **THEN** private helpers use the public endpoint/region/keys with the private bucket name

#### Scenario: Private credential overrides

- **WHEN** `S3_PRIVATE_BUCKET` and one or more of `S3_PRIVATE_ENDPOINT`, `S3_PRIVATE_REGION`, `S3_PRIVATE_ACCESS_KEY_ID`, or `S3_PRIVATE_SECRET_ACCESS_KEY` are set
- **THEN** private helpers use each provided private override and fall back to the matching public `S3_*` value only for unset override fields

#### Scenario: No public CDN for private objects

- **WHEN** private object helpers are configured
- **THEN** the package MUST NOT require or construct a public base URL for the private bucket

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

### Requirement: Private bucket operator documentation

Operator and agent documentation SHALL list `S3_PRIVATE_BUCKET` and optional `S3_PRIVATE_*` overrides alongside the public image bucket variables. Docs SHALL state that voucher PDFs and other private files are stored in the private bucket, are not served via `IMAGE_PUBLIC_BASE_URL`, and are delivered only through authorization-checked backend routes. Staging deploy docs SHALL include setting the private bucket secret on Cloudflare Workers and verifying that a voucher object URL under the public image base returns 404/denied while the member download route succeeds for the owner.

#### Scenario: Env example lists private bucket

- **WHEN** an operator opens `.env.example` after this change
- **THEN** `S3_PRIVATE_BUCKET` (and optional private overrides) are documented

#### Scenario: Deploy and integrations docs name private bucket

- **WHEN** an operator reads `apps/web/DEPLOYMENT.md` and `docs/product/extras/integrations-and-config.md`
- **THEN** those docs list `S3_PRIVATE_BUCKET` (and optional overrides)
- **AND** they state the private bucket must not use a public r2.dev/custom domain binding used by the app
- **AND** they describe BE-only delivery for voucher PDFs

#### Scenario: E2E skip names private bucket

- **WHEN** private bucket env is missing
- **THEN** voucher PDF Playwright tests skip with a reason that mentions the private bucket requirement

#### Scenario: Staging smoke checklist covers public URL denial

- **WHEN** an operator follows the DEPLOYMENT smoke checklist for private vouchers
- **THEN** the checklist includes admin upload, member download success, and confirmation that the object is not fetchable via `IMAGE_PUBLIC_BASE_URL`
