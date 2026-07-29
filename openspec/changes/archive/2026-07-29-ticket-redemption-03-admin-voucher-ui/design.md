## Context

Parent feature: Ticket Redemption (`.dev-plan/current-iteration/ticket-redemption-parent-guide.md`). Steps 01–02 shipped inventory tables, atomic allocation, and cancel restock. Admin create/edit already exposes ticket types `SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF` and `event_website_url` for promo, but **no inventory upload/preview**. `validateRedemptionConfig` only requires secret code / website URL — voucher create can succeed with zero inventory (bookings then fail with `INSUFFICIENT_VOUCHER_INVENTORY`).

Constraints:

- SSR-only mutations; preview islands MUST NOT write inventory alone (AGENTS.md §1).
- HeroUI chrome + native `input type="file"` / number fields (AGENTS.md §8/§14); no HeroUI Select for numbers.
- Prefer client-side PDF slice/preview (Workers PDF limits — parent risk).
- Reuse existing S3 client from `@unveiled/images`; no new package unless forced.
- Yellow page backdrop / theme-only visuals unchanged.

## Goals / Non-Goals

**Goals:**

- Admin can stock promo codes (text/CSV parse + preview + SSR persist) and PDF vouchers (skip / pages-per-ticket + preview + slice + R2 + SSR persist).
- Strip any remaining `secret_code_mode` from admin UI/copy/parser tests.
- Catalog APIs: append inventory rows, list available/allocated counts, optional replace-unused (never delete `ALLOCATED`).
- Reject create (and series create) of voucher events with empty inventory payload; on edit, allow save without new upload if inventory already exists.
- Show inventory summary on event edit; update DE/EN admin copy.
- Lint + typecheck green; manual smoke paths from the step brief.

**Non-Goals:**

- Member masked reveal / PDF download UI (04).
- Product Gherkin / schema-overview / full BDD (05).
- Booking allocation changes (02 done).
- Dedicated destructive replace confirm page unless replace-unused proves unsafe inline (prefer inline POST + warning).
- Auto-emailing PDF attachments.

## Decisions

1. **Promo parse rule**
   - **Choice:** One code per non-empty trimmed line. Ignore blank lines. Do **not** split CSV columns — if a line contains commas, treat the **whole line** as the code (document in copy/helper). Optional paste textarea mirrors the same rule.
   - **Rationale:** Ticket brief “one code per non-empty line”; avoids ambiguous CSV column picking.
   - **Alternatives:** First CSV column only (rejected for v1 — more edge cases).

2. **Promo payload transport**
   - **Choice:** Island writes a hidden form field `promo_codes_json` (JSON string array) on the existing create/edit/series SSR form. Server parses JSON, validates non-empty for create, uniqueness within upload, then calls catalog append after event insert/update.
   - **Rationale:** Keeps one form POST; no separate inventory-only mutation API required for promo.
   - **Alternatives:** Multipart file re-upload server-side (duplicates client parse); separate POST to `/admin/events/:id/vouchers` (extra route; OK later if form size limits bite).

3. **PDF flow (client slice → R2 → SSR associate)**
   - **Choice:** Island uses **pdf-lib** in `apps/web` to: (a) load master PDF, (b) compute ticket ranges from `skip` (default 0) and `pagesPerTicket` (default 1), (c) preview each ticket (page-range label; thumbnail via pdf.js **or** text label-only if thumbnail cost is high — prefer label + page numbers for MVP, add canvas thumb if cheap), (d) on form submit prep, slice each ticket to a PDF blob and upload via an **authenticated admin upload endpoint** that returns `{ objectKey, originalFilename?, pageLabel }` per file. Hidden field `voucher_pdfs_json` carries the staged keys for the SSR create/edit POST. Catalog inserts `event_voucher_pdfs` rows with those keys as `AVAILABLE`.
   - **Rationale:** Parent guide: avoid large PDF work on Workers; mirrors EventImageUpload (client process → upload → SSR associate).
   - **Alternatives:** Multipart all sliced PDFs on the event form POST (Worker body size risk); server-side split (rejected).

4. **Admin PDF upload endpoint**
   - **Choice:** Add a small ADMIN-only route/handler (e.g. `POST /:locale/admin/uploads/voucher-pdf` or `/api/admin/voucher-pdf`) that accepts one PDF blob (multipart or raw), writes to R2 under a stable prefix such as `vouchers/{eventIdOrTemp}/{uuid}.pdf` using `createS3Client` / PutObject from `@unveiled/images` (export a thin `uploadObject` if missing). For **create** (no event id yet), use a staging prefix `vouchers/staging/{adminUserId}/{uuid}.pdf` and pass keys through create; optionally re-key on associate (nice-to-have — not required if staging keys are stable and unique).
   - **Rationale:** Auth gate + size check without inventing a package; reuse S3 env.
   - **Alternatives:** Public R2 direct upload with presign (more infra); embed base64 in form (too large).

5. **Create vs edit inventory rules**
   - **Choice:**
     - **Create / series create:** `VOUCHER_PROMO` requires non-empty promo codes payload + `eventWebsiteUrl`; `VOUCHER_PDF` requires non-empty PDF inventory payload. Reject with admin-visible validation error if empty.
     - **Edit:** New upload **appends** by default. Optional checkbox `replace_unused_inventory` deletes only `AVAILABLE` rows for that type before append (never `ALLOCATED`). Saving without a new payload leaves existing inventory unchanged.
   - **Rationale:** Ticket brief; bookable create must not ship empty stock.
   - **Alternatives:** Allow draft create with zero inventory (rejected — prefer reject bookable create).

6. **Where validation lives**
   - **Choice:** Keep `validateRedemptionConfig` for event-level fields (secret / website). Add route/catalog orchestration that, after parsing form inventory payloads, rejects create when voucher inventory length is 0. Prefer a catalog helper `assertVoucherInventoryPresent(ticketType, { promoCodes, pdfItems }, { mode: 'create' | 'edit', existingCounts })` or inline checks in create/update wrappers used by admin routes — **not** bloating `validateRedemptionConfig` with optional arrays unless clean.
   - **Rationale:** Inventory is not an event column; keep redemption field validation separate from stock presence.
   - **Alternatives:** Extend `validateRedemptionConfig` with optional inventory arrays (acceptable if types stay clear).

7. **Catalog inventory APIs**
   - **Choice:** New module e.g. `packages/db/src/catalog/voucher-inventory.ts`:
     - `appendPromoCodes(db, eventId, codes: string[])` — insert `AVAILABLE`, skip or reject duplicates within event (unique index on `event_id+code`; prefer reject upload with clear error on conflict).
     - `appendVoucherPdfs(db, eventId, items: { objectKey, originalFilename?, pageLabel? }[])`.
     - `replaceUnusedPromoCodes` / `replaceUnusedVoucherPdfs` — delete `AVAILABLE` only, then append.
     - `getVoucherInventoryCounts(db, eventId)` → `{ promo: { available, allocated }, pdf: { available, allocated } }`.
   - Export from catalog index. Call from admin create/edit/series POST handlers after successful event write (same request).
   - **Rationale:** Domain boundary — routes parse/auth, packages own writes.
   - **Alternatives:** Put helpers only in `apps/web` (violates “business logic in packages”).

8. **Series create**
   - **Choice:** Same base-field islands; when series creates N events, **each** occurrence gets the same promo/PDF inventory payload appended (admin stocks identical pools per slot). Document in copy that upload applies to every generated slot.
   - **Rationale:** Series shares redemption config today; inventory must exist per event_id for allocation.
   - **Alternatives:** Stock only the first slot (broken for later slots).

9. **UI placement**
   - **Choice:** Mount islands inside `EventAdminBaseFields` (or `EventAdminForm` / series form) when ticket type is promo/PDF. Native file input + number inputs; HeroUI `Label` / `Surface` / `Paragraph` / `Button` chrome. Inventory counts chip/text on edit when `defaults.inventoryCounts` provided from route loader.
   - **Rationale:** Matches existing conditional secret/website fields.
   - **Alternatives:** Separate `/vouchers` manage page only (defer; edit summary is enough for MVP).

10. **secret_code_mode cleanup**
    - **Choice:** Grep-remove from form tests, copy modules, and any lingering parser keys. Ticket types already omit mode in `EventAdminBaseFields`.
    - **Rationale:** Step 01 schema dropped the column; UI tests still mention `secret_code_mode` in fixtures.

11. **PDF library**
    - **Choice:** Add `pdf-lib` to `apps/web` for slice/write. Optional `pdfjs-dist` only if thumbnail preview is implemented; otherwise page-range labels suffice for MVP preview list.
    - **Rationale:** Ticket allows pdf-lib / pdf.js; minimize deps.

## Risks / Trade-offs

- **[Risk] Large master PDF / many tickets blow Worker or browser memory** → Mitigation: client-side slice + sequential upload; document practical limits in admin helper copy; reject zero-ticket configs in island before submit.
- **[Risk] Staging PDF orphan objects if create fails after upload** → Mitigation: accept orphans (ops GC later) or best-effort delete on failed create; do not block MVP.
- **[Risk] Duplicate promo codes vs unique index** → Mitigation: validate uniqueness in upload; surface DB unique violation as admin error.
- **[Risk] Series multiplies inventory N times from one upload** → Mitigation: clear helper copy; expected for per-event pools.
- **[Risk] Form body size if JSON embeds PDFs** → Mitigation: Decision 3 — upload first, POST only keys.
- **[Trade-off] Thumbnail preview optional** → Labels are enough for smoke; thumbs nice-to-have.
- **[Trade-off] openspec ≠ product SoT** → Deltas here; `docs/product/` in step 05.

## Migration Plan

1. Add catalog voucher-inventory helpers + unit tests; export.
2. Add R2 object upload helper + admin upload route.
3. Build promo + PDF islands; wire into base fields / forms; parse payloads in `admin-event-form` + route helpers.
4. Enforce create inventory presence; edit append / optional replace-unused; show counts on edit.
5. Strip `secret_code_mode` leftovers; update DE/EN copy + form tests.
6. `bun run lint`, `bun run typecheck`; manual smoke (txt + PDF).
7. Mark step 03 done in parent guide; note R2 key prefix in `DEPLOYMENT.md` if new.
8. Rollback: revert deploy; orphan staging objects harmless; allocated bookings unaffected if inventory rows already sold.

## Open Questions

- None blocking. If series “clone inventory to every slot” is too surprising in QA, narrow to “stock on single-event create/edit only and leave series promo/PDF disabled until edit” — only if product asks; default remains Decision 8.
