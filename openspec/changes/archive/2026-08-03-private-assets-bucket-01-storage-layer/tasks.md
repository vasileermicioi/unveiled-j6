## 1. Setup

- [x] 1.1 Confirm prerequisites: `packages/images/src/s3.ts` (`readS3Env`, `createS3Client`, `uploadObject`, `getObject`), `packages/images/README.md`, `.env.example` public S3 vars
- [x] 1.2 Skim parent guide release criteria / non-goals; keep voucher wiring and DEPLOYMENT docs out of this change

## 2. Private S3 env and helpers

- [x] 2.1 Implement `readPrivateS3Env` requiring `S3_PRIVATE_BUCKET`, falling back unset `S3_PRIVATE_ENDPOINT` / `S3_PRIVATE_REGION` / `S3_PRIVATE_ACCESS_KEY_ID` / `S3_PRIVATE_SECRET_ACCESS_KEY` to public `S3_*`, reusing `normalizeS3Endpoint`
- [x] 2.2 Add `createPrivateS3Client` (or equivalent) using the same client config as public
- [x] 2.3 Add `uploadPrivateObject` / `getPrivateObject` mirroring public input shapes but always targeting the private bucket (no public-bucket override)
- [x] 2.4 Export new helpers/types from `packages/images/src/index.ts`

## 3. Docs and env discoverability

- [x] 3.1 Document private env vars in `packages/images/README.md` (env table + public API); state there is no public CDN base URL for the private bucket
- [x] 3.2 Add private S3 keys to `.env.example` (comments OK) without claiming vouchers are private-only yet

## 4. Tests and verification

- [x] 4.1 Add unit tests for shared credentials + distinct bucket, per-field overrides, and missing `S3_PRIVATE_BUCKET` clear error (no live R2)
- [x] 4.2 Run `cd packages/images && bun test` — exit 0
- [x] 4.3 Run `bun run typecheck` and `bun run lint` — exit 0

## 5. Handoff

- [x] 5.1 Mark step 01 done in `private-assets-bucket-parent-guide.md`; note operator need for a non-public R2 bucket for step 03 docs
- [x] 5.2 Prepare PR/handoff linking this change ID and parent guide; do not claim vouchers are private-only until step 02
