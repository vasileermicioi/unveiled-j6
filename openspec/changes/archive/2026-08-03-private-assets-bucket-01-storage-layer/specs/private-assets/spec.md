## ADDED Requirements

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
