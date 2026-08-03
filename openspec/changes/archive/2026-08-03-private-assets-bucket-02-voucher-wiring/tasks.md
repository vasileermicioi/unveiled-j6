## 1. Setup

- [x] 1.1 Confirm prerequisites: `uploadPrivateObject` / `getPrivateObject` exported from `@unveiled/images`; admin `voucher-pdf` staging route; member `voucher.pdf` route; seed + e2e voucher upload helpers still on public helpers
- [x] 1.2 Skim parent guide release criteria / non-goals; keep backfill and DEPLOYMENT operator docs out of this change

## 2. Wire voucher write/read call sites

- [x] 2.1 Switch admin staging route `apps/web/app/routes/[locale]/admin/uploads/voucher-pdf.tsx` from `uploadObject` to `uploadPrivateObject` (keep `vouchers/...` key layout; keep actionable 500 on upload/config failure)
- [x] 2.2 Switch member download route `apps/web/app/routes/[locale]/bookings/.../voucher.pdf.ts` from `getObject` to `getPrivateObject` (ownership gates unchanged; missing object/config → 404)
- [x] 2.3 Switch `packages/db/src/catalog/seed.ts` voucher PDF uploads to `uploadPrivateObject`
- [x] 2.4 Switch e2e inventory helper in `packages/db/src/catalog/voucher-inventory.ts` to `uploadPrivateObject`
- [x] 2.5 Grep for other `vouchers/` PutObject / public `uploadObject`/`getObject` voucher paths; update or document exceptions (do not retarget image variants)

## 3. Tests and verification

- [x] 3.1 Adjust any tests/mocks that assert public helpers for voucher I/O to the private helper names (DB-only fake-key tests unchanged)
- [x] 3.2 Confirm no code builds `IMAGE_PUBLIC_BASE_URL` + voucher `object_key` for member download
- [x] 3.3 Run `bun run typecheck` and `bun run lint` — exit 0
- [x] 3.4 Run relevant package/app tests for voucher upload/download — exit 0 (skip or mock when S3 unavailable, consistent with today)

## 4. Handoff

- [x] 4.1 Mark step 02 done in `private-assets-bucket-parent-guide.md`
- [x] 4.2 Flag existing public-bucket voucher keys for step 03 backfill (no dual-read in this slice)
- [x] 4.3 Prepare PR/handoff linking this change ID and parent guide; note no product Gherkin change required if download UX unchanged
