## Why

Private-bucket helpers exist from step 01, but voucher PDF staging upload, demo seed, e2e inventory helpers, and member download still call public-bucket `uploadObject` / `getObject`. New voucher bytes therefore still land in the publicly readable catalog bucket (and remain guessable via `IMAGE_PUBLIC_BASE_URL`). This slice retargets those create/read paths so voucher I/O uses the private bucket while ownership gates and key layout stay the same.

## What Changes

- Switch admin voucher PDF staging (`/:locale/admin/uploads/voucher-pdf`) from `uploadObject` to `uploadPrivateObject` (same `vouchers/...` key layout).
- Switch member download (`/:locale/bookings/:bookingId/tickets/:ticketId/voucher.pdf`) from `getObject` to `getPrivateObject`.
- Switch demo seed and e2e voucher PDF upload helpers to `uploadPrivateObject`.
- Audit remaining `vouchers/` PutObject / public-bucket download paths; do not retarget image variant uploads.
- Ensure no member/admin path builds `IMAGE_PUBLIC_BASE_URL` + voucher `object_key` for PDF download.
- Map missing/misconfigured private bucket to clear failures (member 404 already acceptable; admin upload returns actionable 500/config error).
- Update tests/mocks that reference the public helpers for voucher I/O.
- Do **not** backfill existing public-bucket objects or expand DEPLOYMENT/operator docs (step 03).

## Capabilities

### New Capabilities
- _(none)_ — `private-assets` already exists from step 01.

### Modified Capabilities
- `ticket-redemption`: PDF voucher inventory objects and ownership-gated member download MUST use the private bucket; MUST NOT expose vouchers via `IMAGE_PUBLIC_BASE_URL` or any public object URL.
- `private-assets`: Create-path writes and member reads of voucher PDF bytes MUST use private-bucket helpers; catalog image variants stay on public helpers.

## Impact

- **Code:** `apps/web/app/routes/[locale]/admin/uploads/voucher-pdf.tsx`; `apps/web/app/routes/[locale]/bookings/.../voucher.pdf.ts`; `packages/db/src/catalog/seed.ts`; `packages/db/src/catalog/voucher-inventory.ts` (e2e restock helper); any tests/mocks naming `uploadObject`/`getObject` for voucher paths.
- **Runtime:** New voucher uploads require `S3_PRIVATE_BUCKET` (and resolved credentials). Existing public-bucket voucher keys remain unread until step 03 backfill — downloads for those keys will 404 after this switch (flagged for step 03).
- **Schema:** No change to `event_voucher_pdfs.object_key` (bucket implied by asset class).
- **Product UX:** Download UX, auth gates, and Gherkin copy unchanged unless failure strings change.
- **Out of scope:** Object migration, DEPLOYMENT.md full operator guide, non-voucher private file product features, signed browser URLs.
