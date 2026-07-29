## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/ticket-redemption-03-admin-voucher-ui.md`, parent guide, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm prerequisites from step 02: inventory tables, `append`-ready schema, allocation working; locate `EventAdminBaseFields`, `admin-event-form.ts`, create/edit/series routes, `@unveiled/images` S3 helpers
- [x] 1.3 Add `pdf-lib` (and `pdfjs-dist` only if implementing thumbnails) as a dependency of `apps/web`

## 2. Catalog inventory APIs

- [x] 2.1 Add `packages/db/src/catalog/voucher-inventory.ts` with `appendPromoCodes`, `appendVoucherPdfs`, optional `replaceUnused*` (delete `AVAILABLE` only), and `getVoucherInventoryCounts`; export from catalog index
- [x] 2.2 Enforce create-time non-empty inventory for `VOUCHER_PROMO` / `VOUCHER_PDF` in admin orchestration (keep `validateRedemptionConfig` for secret/website); update catalog validation unit tests accordingly
- [x] 2.3 Add unit tests for append uniqueness / replace-unused never touching `ALLOCATED`

## 3. R2 upload path

- [x] 3.1 Export or add a thin `uploadObject` (or equivalent) using existing `createS3Client` / `readS3Env` in `@unveiled/images` for voucher PDF bytes + content-type
- [x] 3.2 Add ADMIN-only upload handler/route that stores one PDF and returns `{ objectKey, originalFilename?, pageLabel? }` under a `vouchers/` (or staging) key prefix
- [x] 3.3 Document key/prefix convention in `apps/web/DEPLOYMENT.md` only if ops-relevant (no new env vars expected)

## 4. Admin form islands and parsers

- [x] 4.1 Strip remaining `secret_code_mode` from form tests, copy, and any parser acceptance; confirm SECRET_CODE UI is code-only
- [x] 4.2 Build `PromoCodeInventoryIsland` (file + optional paste; one code per non-empty line; preview count/samples; hidden `promo_codes_json`)
- [x] 4.3 Build `PdfVoucherInventoryIsland` (native file + skip/pages-per-ticket numbers; preview; block submit when zero tickets; slice with pdf-lib; upload then hidden `voucher_pdfs_json`)
- [x] 4.4 Wire islands into `EventAdminBaseFields` / event + series forms; keep `event_website_url` required for `VOUCHER_PROMO`
- [x] 4.5 Extend `admin-event-form` (+ route helpers) to parse inventory payloads; on create/edit/series POST append (or replace-unused) after event write; series clones inventory to each slot
- [x] 4.6 Load and display available/allocated counts on event edit; optional replace-unused checkbox with clear warning
- [x] 4.7 Update DE/EN admin copy modules for ticket types, inventory helpers, and errors

## 5. Tests and verification

- [x] 5.1 Update `admin-event-form` / route helper unit tests for inventory payloads and removed `secret_code_mode`
- [x] 5.2 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.3 Manual admin smoke: 5-line txt → preview 5 → save → 5 `AVAILABLE` codes; multi-page PDF skip=1, pagesPerTicket=1 → preview N → save → N PDF inventory rows in R2/DB
- [x] 5.4 Smoke SECRET_CODE create without mode field → existing book flow still works
- [x] 5.5 Mark step 03 done in `.dev-plan/current-iteration/ticket-redemption-parent-guide.md`; leave member masking to step 04 and product BDD to step 05
