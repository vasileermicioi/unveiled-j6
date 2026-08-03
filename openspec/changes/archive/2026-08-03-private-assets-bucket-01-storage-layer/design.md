## Context

`@unveiled/images` already exposes generic `uploadObject` / `getObject` for non-image assets (voucher PDF inventory and member download). Those helpers always resolve the public catalog bucket via `readS3Env()` (`S3_BUCKET` + shared R2 credentials) and the same bucket is publicly readable through `IMAGE_PUBLIC_BASE_URL`. Member downloads are auth-gated in the app, but object keys in the public bucket remain guessable CDN leaks.

This change is the first child of **Private Assets Bucket**. It only adds configuration and helpers for a separate private bucket inside `packages/images`. Call sites stay on the public helpers until step 02.

Constraints from AGENTS / parent guide:

- Business logic stays out of `apps/web` for this slice.
- Secrets must never be logged.
- Workers-compatible AWS SDK usage already in the package (`forcePathStyle`, endpoint normalization).
- No public base URL for the private bucket.
- Prefer shared R2 credentials with a distinct bucket name; optional per-field overrides.

## Goals / Non-Goals

**Goals:**

- Resolve private bucket config: required `S3_PRIVATE_BUCKET`; optional `S3_PRIVATE_ENDPOINT` / `S3_PRIVATE_REGION` / `S3_PRIVATE_ACCESS_KEY_ID` / `S3_PRIVATE_SECRET_ACCESS_KEY` falling back to public `S3_*`.
- Expose `uploadPrivateObject` / `getPrivateObject` that always target the private bucket (same input shapes as public generics).
- Reuse `normalizeS3Endpoint` for private endpoint strings.
- Unit-test env merge and missing-bucket errors without live R2.
- Document private env vars in `packages/images/README.md` and export helpers from the package index.

**Non-Goals:**

- Wiring voucher upload/download/seed to private helpers (step 02).
- `DEPLOYMENT.md` / integrations docs / operator runbooks (step 03).
- Migrating or dual-reading existing public-bucket voucher keys (step 03).
- Signed/expiring browser URLs; encryption beyond bucket ACL defaults.
- Changing `event_voucher_pdfs` schema (still stores `object_key` only).
- Making the public image bucket private.
- Adding `deletePrivateObject` unless a public delete-generic already exists for vouchers (today only image-variant delete exists — skip private delete until a later need).

## Decisions

1. **Extend `s3.ts` rather than a new module**  
   Private helpers mirror public ones and share `S3Env`, `normalizeS3Endpoint`, and client construction. Keeping them in `s3.ts` avoids split env semantics.  
   _Alternative:_ `private-s3.ts` — clearer separation, but duplicates types and risks divergent endpoint rules.

2. **`readPrivateS3Env` merges private overrides onto public credentials**  
   - Always require `S3_PRIVATE_BUCKET` (clear error if missing).  
   - For endpoint/region/keys: use `S3_PRIVATE_*` when set, else corresponding `S3_*`.  
   - Still require a full resolved set (after fallback); if public vars are also missing, fail with a clear config error naming what is needed.  
   _Alternative:_ require all five private vars — rejected; parent guide prefers shared credentials + distinct bucket.

3. **`createPrivateS3Client` = `createS3Client(readPrivateS3Env(...))`**  
   Same client config (`forcePathStyle: true`). No separate client factory logic.

4. **Private upload/get force the private bucket**  
   Unlike public `uploadObject`/`getObject`, do **not** accept an optional `bucket` override that could silently write to the public bucket. Optional `client` injection for tests is fine if the bucket always comes from private env.  
   _Alternative:_ keep optional `bucket` param — rejected; too easy to misuse for private assets.

5. **No `IMAGE_PRIVATE_BASE_URL` (or any public CDN var)**  
   Private objects are only reachable via backend GetObject. Document that explicitly in the package README.

6. **Tests are pure env-resolution unit tests**  
   Mirror existing `s3.test.ts` style with injected `ProcessEnv` objects. Do not call live R2. Optionally assert private helpers reject missing bucket before any SDK call.

7. **Docs scope**  
   Update `packages/images/README.md` env table + public API list. Mention new keys in `.env.example` if that file is the package/runtime contract surface already used for public S3 (keeps local setup discoverable); full DEPLOYMENT/operator prose waits for step 03.

## Risks / Trade-offs

- **[Risk] Helpers exist but vouchers still land in the public bucket until step 02** → Mitigation: parent guide + proposal mark this explicitly; do not claim vouchers are private-only in this PR.
- **[Risk] Shared credentials without bucket IAM separation still allow the same keys to access both buckets** → Mitigation: security win is non-public bucket ACL / no CDN binding; IAM tightening is operator choice, documented in step 03.
- **[Risk] Partial private overrides (e.g. only private endpoint set) misconfigure the client** → Mitigation: document that overrides replace individual fields; tests cover shared-credentials and full-override cases.
- **[Trade-off] No `deletePrivateObject` in this slice** → Acceptable; voucher inventory today does not use a generic public delete helper. Add later if admin delete needs it.

## Migration Plan

- Deploy/merge package-only change: no runtime behavior change for production callers.
- Rollback: revert the package commit; no data migration.
- Step 02 will switch voucher call sites; step 03 handles existing object backfill and operator docs.

## Open Questions

- None blocking this slice. Whether download falls back to the public bucket during transition is owned by step 03 (parent guide recommends backfill then private-only read).
