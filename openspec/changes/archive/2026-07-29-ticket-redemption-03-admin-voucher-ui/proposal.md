## Why

Allocation (step 02) can book voucher inventory, but admins still cannot stock `VOUCHER_PROMO` / `VOUCHER_PDF` events through the product UI — create/edit only collects a website URL for promo and has no CSV/PDF inventory path. Without admin stock + preview, voucher events remain unbookable in practice and step 04 has nothing realistic to demo.

## What Changes

- Remove any remaining `secret_code_mode` UI/copy/parser acceptance from admin event create/edit/series (SECRET_CODE = manual code field only).
- Expose ticket types `SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF` with conditional redemption fields.
- **VOUCHER_PROMO:** client island parses `.txt`/`.csv` (one non-empty trimmed code per line), previews count + samples, SSR form POST appends `AVAILABLE` inventory rows (optional low-cost “replace unused” on edit; never delete `ALLOCATED`).
- **VOUCHER_PDF:** client island uploads one master PDF, configures pages-to-skip + pages-per-ticket, previews derived tickets, slices per-ticket PDFs (pdf-lib or equivalent), uploads to R2, SSR persists `AVAILABLE` PDF inventory rows.
- Keep `event_website_url` required for `VOUCHER_PROMO`.
- Show available/allocated inventory counts on event edit; reject bookable create when voucher inventory payload is empty.
- Catalog helpers to append/list inventory counts; thin R2 uploader reuse from `@unveiled/images` S3 client (no new package unless forced).
- Out of scope: member reveal/download (04); full BDD / product-doc rewrite (05); booking transaction changes (02 done).

## Capabilities

### New Capabilities

- _(none)_ — admin stocking extends existing `ticket-redemption` and `admin-events` capabilities.

### Modified Capabilities

- `ticket-redemption`: Admin promo CSV/text upload with preview then SSR persist; admin PDF split/preview then SSR persist; create validation requires inventory payloads by ticket type (no secret-code mode).
- `admin-events`: Event create/edit/series base fields wire the three ticket types and inventory islands; edit shows inventory summary; DE/EN admin copy updated; SSR-only persistence.

## Impact

- **UI:** `EventAdminBaseFields.tsx`, `EventAdminForm` / series forms, `admin-event-form.ts` (+ tests), admin create/edit/series routes, DE/EN admin copy modules.
- **Islands:** `PromoCodeInventoryIsland`, `PdfVoucherInventoryIsland` under `apps/web/app/islands/` (names flexible); PDF lib dependency in `apps/web` only.
- **Domain:** new catalog helpers in `@unveiled/db` to append promo/PDF inventory and list available/allocated counts; wire after create/update event.
- **Storage:** voucher PDF objects via existing S3/R2 env (`packages/images` client helpers); document key/prefix convention in `DEPLOYMENT.md` only if ops-relevant.
- **Source brief:** `.dev-plan/current-iteration/ticket-redemption-03-admin-voucher-ui.md`
- **Parent:** `.dev-plan/current-iteration/ticket-redemption-parent-guide.md`
- **Depends on:** `ticket-redemption-02-allocation-domain` (done / archived)
- **Consumed by:** `ticket-redemption-04-member-bookings-ui`, `ticket-redemption-05-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; manual admin smoke (5-line txt → 5 AVAILABLE; PDF skip/pages-per-ticket → N PDF rows); SECRET_CODE create without mode field still books
