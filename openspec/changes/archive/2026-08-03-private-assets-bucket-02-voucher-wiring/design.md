## Context

Step 01 shipped `uploadPrivateObject` / `getPrivateObject` and `S3_PRIVATE_BUCKET` resolution in `@unveiled/images`. Call sites still use public `uploadObject` / `getObject`:

| Call site | Current helper | Role |
|---|---|---|
| `apps/web/.../admin/uploads/voucher-pdf.tsx` | `uploadObject` | Admin staging upload → returns `objectKey` |
| `apps/web/.../tickets/[ticketId]/voucher.pdf.ts` | `getObject` | Ownership-gated member PDF stream |
| `packages/db/src/catalog/seed.ts` | `uploadObject` | Demo `VOUCHER_PDF` inventory bytes |
| `packages/db/src/catalog/voucher-inventory.ts` (`ensureE2e…`) | dynamic `uploadObject` | E2E restock of PDF inventory |

Ownership checks (`getOwnedBookingTicketPdf`, admin/member route guards) and `event_voucher_pdfs.object_key` layout (`vouchers/...`) stay unchanged. Parent non-goals: keep BE proxy streaming (no signed URLs); no schema change for bucket name.

## Goals / Non-Goals

**Goals:**

- All create-path voucher PDF writes and the member download read use private-bucket helpers.
- Key layout and JSON/DB contracts (`objectKey`) unchanged.
- Image variant / public catalog pipeline stays on `uploadObject` / `getObject` + `IMAGE_PUBLIC_BASE_URL`.
- Clear admin failure when private bucket config is missing; members keep 404 on missing object/config after ownership pass.
- Tests/mocks updated for the new helper names where they assert voucher I/O.

**Non-Goals:**

- Backfill or dual-read of existing public-bucket voucher objects (step 03).
- Full `DEPLOYMENT.md` / integrations operator guide (step 03 may draft notes).
- New private-file product features beyond vouchers.
- Changing booking ownership rules or download UX copy.
- Product Gherkin changes unless failure strings change (expected: none).

## Decisions

1. **Mechanical helper swap at known call sites**  
   Replace imports/calls only — no new storage abstraction in `apps/web` or `@unveiled/db`. Storage remains in `@unveiled/images`; ownership remains in `@unveiled/db` + route guards.  
   _Alternative:_ introduce a `voucherStorage` façade — rejected for this slice; two helpers already encode the split.

2. **Keep `vouchers/...` key prefixes**  
   Same keys work across buckets; DB rows stay valid after backfill copies objects under the same key into the private bucket in step 03.  
   _Alternative:_ prefix with `private/` or include bucket in schema — rejected; parent guide says bucket is implied by asset class.

3. **Private-only read after this merge (no public fallback)**  
   Member download calls `getPrivateObject` only. Pre-existing public-bucket keys will 404 until step 03 backfill. Parent guide prefers backfill then private-only over long-lived dual-read.  
   _Alternative:_ try private then public — rejected for this step to avoid masking incomplete migration.

4. **Error mapping stays route-local**  
   - Admin staging: catch upload errors; return JSON 500 with the error message (config errors from `readPrivateS3Env` already clear).  
   - Member download: catch get errors → 404 (unchanged). Do not leak bucket/config details to members.  
   _Alternative:_ special-case config errors as 503 for members — unnecessary; 404 already matches “not available.”

5. **Audit scope = voucher uploads only**  
   Grep for `vouchers/` and `uploadObject`/`getObject` voucher callers. Leave `scripts/migrate-r2-jpeg-to-webp.ts` and image pipelines alone (they use their own S3 client / public helpers).

6. **E2E helper and seed follow the same private write path**  
   `ensureE2eVoucherInventory` (or equivalent) and demo seed must upload to the private bucket when `skipUpload`/`skipBucket` is false so local/CI inventory matches production create paths. Tests that only insert DB rows with fake keys stay unchanged.

## Risks / Trade-offs

- **[Risk] Existing staging/prod voucher keys remain in the public bucket and become undownloadable after switch** → Mitigation: flag explicitly for step 03 backfill in parent guide / handoff; operators should not rely on old inventory download until backfilled or re-uploaded.
- **[Risk] Deploy without `S3_PRIVATE_BUCKET` breaks admin upload and seed** → Mitigation: `.env.example` already documents the var from step 01; admin gets actionable 500; step 03 expands DEPLOYMENT. Local/dev must set the private bucket before exercising voucher flows.
- **[Trade-off] No dual-read** → Short window of broken downloads for legacy keys in exchange for a clear private-only invariant.
- **[Risk] Missed call site still writes vouchers publicly** → Mitigation: repo-wide grep for `vouchers/` + `uploadObject` before handoff; document any intentional exception (none expected).

## Migration Plan

- Merge after step 01 is done (already). Ensure Workers/local env has `S3_PRIVATE_BUCKET` before relying on voucher flows in that environment.
- Rollback: revert call-site commits to public helpers (objects uploaded to private during the window stay in private bucket — re-download would need those objects copied back or keys re-uploaded; acceptable for short-lived staging).
- Step 03: copy or re-upload existing public `vouchers/...` keys into the private bucket; document operator procedure.

## Open Questions

- None blocking. Dual-read during backfill remains a step 03 decision (parent recommends backfill then private-only).
