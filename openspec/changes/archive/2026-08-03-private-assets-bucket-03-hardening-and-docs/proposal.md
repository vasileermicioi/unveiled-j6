## Why

Steps 01–02 shipped private-bucket helpers and retargeted voucher PDF create/read paths, but operators still lack complete env/setup docs, e2e skip conditions may still mention only public R2 vars, and historical `vouchers/...` objects may still sit in the public catalog bucket (unread after the private-only switch). This final slice closes the Private Assets Bucket feature for staging/production release.

## What Changes

- Document `S3_PRIVATE_BUCKET` and optional `S3_PRIVATE_*` overrides in `.env.example`, `AGENTS.md` env table (if present), `apps/web/DEPLOYMENT.md` (Workers secrets), `docs/product/extras/integrations-and-config.md`, and voucher/image product docs — private bucket must **not** have a public r2.dev/custom domain binding used by the app.
- Align e2e: require `S3_PRIVATE_BUCKET` (and shared/override creds) for PDF voucher download/upload scenarios; keep existing public R2 skip for image/logo tests; document in `e2e/README.md`.
- Provide a one-shot script or documented AWS/R2 CLI procedure to copy `vouchers/` keys from public → private bucket (idempotent: skip if destination exists); after backfill, downloads remain private-only (no permanent dual-read).
- Add DEPLOYMENT smoke checklist: admin upload voucher → member book → download PDF → confirm object not fetchable via `IMAGE_PUBLIC_BASE_URL`.
- Add a `gaps-and-decisions.md` row for the private-bucket decision.
- Mark parent guide step 03 done (feature complete).
- Do **not** redesign voucher inventory UI, introduce signed URLs, or encrypt the images bucket.

## Capabilities

### New Capabilities
- _(none)_ — `private-assets` and `ticket-redemption` already exist.

### Modified Capabilities
- `private-assets`: ADD operator/agent documentation requirements for private-bucket env vars, BE-only delivery, Workers secrets, and e2e skip reasons that name the private bucket.
- `ticket-redemption`: MODIFY ownership-gated PDF voucher download docs/coverage so product and e2e documentation state bytes are read from the private assets bucket; tests MAY skip when private (or shared) S3 config is unavailable, with an explicit skip reason.

## Impact

- **Docs/config:** `.env.example`; `apps/web/DEPLOYMENT.md`; `AGENTS.md`; `docs/product/extras/integrations-and-config.md`; `docs/product/extras/image-uploads.md` (and related voucher notes); `docs/product/extras/gaps-and-decisions.md`; `e2e/README.md`; parent guide `private-assets-bucket-parent-guide.md`.
- **Scripts/ops:** Optional `scripts/` backfill (or operator runbook) reading repo-root `.env`; no secrets committed.
- **E2E:** Fixture skip helpers for voucher PDF scenarios; image/logo public-R2 skips unchanged.
- **Runtime:** No permanent dual-read; after backfill, private-only `getPrivateObject` remains the sole download path.
- **Schema / UX:** Unchanged — `event_voucher_pdfs.object_key` layout stays `vouchers/...`; member download UX unchanged.
- **Out of scope:** Signed URLs; encrypting public images bucket; voucher inventory UI redesign; partner private file types.
