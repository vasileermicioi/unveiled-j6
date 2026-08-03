## Why

Voucher PDFs and other non-public files currently share the public catalog S3 bucket (`S3_BUCKET` + `IMAGE_PUBLIC_BASE_URL`). Guessable object keys can leak tickets via the public CDN. This first slice adds a dedicated private-bucket configuration and package helpers so later steps can move voucher I/O off the public bucket without changing call sites yet.

## What Changes

- Add private S3 env contract: required `S3_PRIVATE_BUCKET`; optional `S3_PRIVATE_ENDPOINT`, `S3_PRIVATE_REGION`, `S3_PRIVATE_ACCESS_KEY_ID`, `S3_PRIVATE_SECRET_ACCESS_KEY` (fallback to public `S3_*` when unset).
- Add `readPrivateS3Env` / `createPrivateS3Client` (or equivalent) with the same endpoint normalization as public.
- Add `uploadPrivateObject` / `getPrivateObject` that always target the private bucket.
- Keep existing `uploadObject` / `getObject` on the public bucket for images and transitional callers.
- Export new helpers from `@unveiled/images`; document private env vars in `packages/images/README.md`.
- Add unit tests for env merge and missing-bucket error cases (no live R2).
- Do **not** wire voucher routes/seed, DEPLOYMENT docs, or object migration (steps 02–03).

## Capabilities

### New Capabilities
- `private-assets`: Dedicated private S3-compatible bucket configuration and package helpers for non-public object upload/download, separate from the public catalog image pipeline.

### Modified Capabilities
- _(none)_ — public image helpers and `image-uploads` requirements stay unchanged; this step only adds private-bucket APIs.

## Impact

- **Code:** `packages/images/src/s3.ts`, `packages/images/src/index.ts`, `packages/images/src/s3.test.ts`, `packages/images/README.md`; optionally `.env.example` keys if documented as package contract (full operator docs deferred to step 03).
- **Runtime:** No behavior change for existing callers until step 02 wires vouchers.
- **Ops:** Operators will eventually need a non-public R2 bucket and `S3_PRIVATE_BUCKET` (handoff for step 03); not required for this package-only slice to pass unit tests.
- **Dependencies:** Reuses existing `@aws-sdk/client-s3` Workers-compatible usage; no new packages.
