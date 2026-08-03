## ADDED Requirements

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
