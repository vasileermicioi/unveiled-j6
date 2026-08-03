## 1. Setup

- [x] 1.1 Confirm prerequisites: private helpers + voucher wiring merged; `.env.example` already lists private keys; `e2e/fixtures/admin.ts` `r2Configured()`; DEPLOYMENT / integrations / image-uploads docs exist
- [x] 1.2 Skim parent guide release criteria and dual-read non-goal

## 2. Docs and env SoT

- [x] 2.1 Verify/clarify `.env.example` comments: private bucket must not use public r2.dev/custom domain / `IMAGE_PUBLIC_BASE_URL`
- [x] 2.2 Update `AGENTS.md` Phase 4+ env table to include `S3_PRIVATE_BUCKET` and optional `S3_PRIVATE_*` overrides
- [x] 2.3 Update `apps/web/DEPLOYMENT.md`: Workers secrets for private bucket; fix stale “vouchers reuse public bucket / IMAGE_PUBLIC_BASE_URL” prose; add smoke checklist (admin upload → book → download → public URL denied)
- [x] 2.4 Update `docs/product/extras/integrations-and-config.md` with private bucket vars and BE-only delivery
- [x] 2.5 Align `docs/product/extras/image-uploads.md` (and any voucher/schema notes) so PDF storage is private-bucket, not public CDN
- [x] 2.6 Add `gaps-and-decisions.md` private-bucket decision row

## 3. Backfill

- [x] 3.1 Add idempotent `scripts/` backfill (or equivalent): load repo-root `.env`, `--dry-run`, copy `vouchers/` public → private, skip if destination exists; print copied/skipped/failed counts
- [x] 3.2 Document staging run order in DEPLOYMENT (provision bucket → secrets → dry-run → copy → smoke); note optional public-key cleanup after verify; no dual-read in app code

## 4. E2E alignment

- [x] 4.1 Add `privateR2Configured()` (or equivalent) requiring `S3_PRIVATE_BUCKET` + resolved shared/override credentials; keep `r2Configured()` for image/logo tests
- [x] 4.2 Gate voucher PDF download/upload Playwright scenarios on private helper; skip reason must name private bucket
- [x] 4.3 Update `e2e/README.md` env table + skip inventory for private vs public R2; update coverage notes if skip reasons change

## 5. Validation and closeout

- [x] 5.1 Run `bun run typecheck` and `bun run lint` (exit 0)
- [x] 5.2 Run voucher PDF Playwright scenario when private+public S3 env present; confirm skip reason when private absent
- [x] 5.3 Grep SoT files: every listed doc mentions `S3_PRIVATE_BUCKET` and BE-only access; confirm no permanent dual-read
- [x] 5.4 Mark `private-assets-bucket-03-hardening-and-docs` done in parent guide (feature complete)
