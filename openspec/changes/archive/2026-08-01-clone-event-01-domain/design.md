## Context

Parent feature: Clone Event (`.dev-plan/current-iteration/clone-event-parent-guide.md`). Step 01 is catalog domain only.

Today:

- `createEvent` inserts one row via `insertEventRow` (capacity defaults, redemption validation, postal validation, derived Berlin datetime fields).
- `createEventSeries` validates unique slots then loops `insertEventRow`, sharing one resolved primary `imageId`.
- Gallery is separate (`listEventGalleryImageIds` / `addEventGalleryImages`).
- Voucher inventory is asserted/applied at the admin create call site (`assertVoucherInventoryPresent` mode `"create"` + append helpers), not inside `createEvent`.
- Series UI at `apps/web/.../admin/events/series/new.tsx` imports `createEventSeries` (step 02 deletes that surface).
- Featured membership is a separate table/API — not written by create/series.

Constraints: catalog owns event rows; Booking remains sole booking writer; packages never depend on `apps/web`; no SQL migration; admin clone UI and product-doc/Gherkin updates are later steps.

## Goals / Non-Goals

**Goals:**

- Export `cloneEvent` that loads a source event, applies clone rules, inserts a new row with fresh capacity and caller `dateTime`.
- Copy gallery join rows; reuse primary `imageId`.
- Enforce create-mode voucher inventory for `VOUCHER_PROMO` / `VOUCHER_PDF`; never copy source inventory rows.
- Never copy bookings, waitlist, or featured membership.
- Remove `createEventSeries`, `validateUniqueSeriesSlots`, and series-only package tests; keep `createEvent`.
- Lint/typecheck green via minimal web compile shims.

**Non-Goals:**

- Admin SSR clone page, list/edit entry points, series route/nav deletion beyond compile safety (02).
- Sitemap, Gherkin, Playwright, component-map, DEPLOYMENT product copy (03).
- Recurring RRULE / multi-slot builders / bulk clone.
- Changing public discovery or booking behavior.
- Fixing primary-image delete reference-counting if already unsafe (document gap for 03; do not expand into image GC rewrite).

## Decisions

1. **API shape: `cloneEvent(db, sourceEventId, input)`**
   - **Choice:** `CloneEventInput` requires `dateTime: Date`. Optional narrow overrides only if cheap and useful for tests (e.g. none beyond inventory for this step). Copy remaining catalog fields from the source row. Reject missing source with `CatalogValidationError("EVENT_NOT_FOUND", ...)`.
   - **Rationale:** Parent/step plan; UI will collect date/time (+ inventory) while reusing source metadata.
   - **Alternatives:** Full `CreateEventInput` rebuild (rejected — duplicates source unnecessarily); allow omitting `dateTime` to copy source (rejected — parent requires explicit dateTime on clone).

2. **Insert path: reuse `insertEventRow` with mapped create input**
   - **Choice:** Map source fields + `dateTime` into the shape `insertEventRow` expects (partnerId, title, description, address, location, imageId from source, category/type/tags, timingMode, creditPrice, totalCapacity, ticketType, secretCode, website, accessibility/language/age, lat/lng). Skip image upload resolution — pass existing `imageId` the same way staged/create already can (mirror series shared-image pattern without going through upload validators that require a new source).
   - **Rationale:** Keeps defaults/redemption/postal/derived-field behavior consistent with create.
   - **Alternatives:** Raw `db.insert(events)` (duplicates validation); call `createEvent` with fake upload (rejected — would re-upload or fail).

3. **Capacity: always `remaining_capacity = total_capacity`**
   - **Choice:** Use source `totalCapacity` (via defaults path) so the clone starts unsold even if source was partially sold.
   - **Rationale:** Spec + parent clone rules.
   - **Alternatives:** Copy remaining capacity (rejected — would understate sellable seats).

4. **Gallery: copy join rows after insert**
   - **Choice:** `listEventGalleryImageIds(db, sourceId)` then `addEventGalleryImages(db, newEventId, ids)` when non-empty. Same image ids, new event id.
   - **Rationale:** Parent default; matches existing gallery helpers and caps.
   - **Alternatives:** Leave gallery empty (rejected — loses admin intent); deep-copy image blobs (rejected — series reused ids).

5. **Voucher inventory: create-mode assert + apply inside `cloneEvent`**
   - **Choice:** `CloneEventInput` accepts optional `voucherInventory` (same payload type as create helpers). For voucher ticket types, call `assertVoucherInventoryPresent(..., { mode: "create" })` before/around insert; on success append inventory to the **new** event id via existing catalog append helpers. Do not read or copy source `event_voucher_*` rows. `SECRET_CODE` copies `secretCode` from source; no inventory required.
   - **Rationale:** Step plan requires inventory on clone input or rejection; putting assert+apply in domain makes package tests self-contained without web. Slightly stronger than bare `createEvent` (which leaves apply to web) but matches “clone operation” as one domain call.
   - **Alternatives:** Assert-only and leave append to step 02 web (weaker package tests); silent empty inventory (rejected).

6. **Explicit non-copies**
   - **Choice:** Do not touch `featured_events`, bookings, waitlist, or voucher tables for the source. No featured insert for the clone.
   - **Rationale:** Parent safety rules; featured is opt-in admin action.
   - **Alternatives:** Copy featured flag (rejected).

7. **Remove series APIs completely**
   - **Choice:** Delete `createEventSeries` and `validateUniqueSeriesSlots`; remove series unit tests; update `packages/db/README.md` exports list.
   - **Rationale:** Step deliverable; UI step must not keep calling dead APIs.
   - **Alternatives:** Deprecate stub that throws (unnecessary once web shim lands).

8. **Web compile shim (minimal)**
   - **Choice:** Update `series/new.tsx` (and any other `createEventSeries` imports) so typecheck passes — prefer redirect/410 stub or remove the POST path that calls the API without building the clone UI. Do not implement `/admin/events/:id/clone` here.
   - **Rationale:** Same pattern as travel-distance step 01 (fail closed / shim for green build). Full series deletion + clone UI is step 02.
   - **Alternatives:** Leave broken imports (fails verification); move all UI into this step (scope creep).

9. **Image delete reference safety**
   - **Choice:** Verify whether `deleteEvent` deletes shared primary/gallery image ids still referenced by other events; document outcome. If unsafe, note as follow-up for step 03 gaps log — do not rewrite image GC in this step unless a tiny shared-ref guard already fits.
   - **Rationale:** Parent risk; out of scope to expand into full image lifecycle redesign.

## Risks / Trade-offs

- **[Risk] Shared `imageId` delete orphans or breaks other events** → Mitigation: verify delete path; document gap for 03 if primary image is deleted while still referenced.
- **[Risk] Series admin route broken or stubbed until step 02** → Mitigation: land 02 promptly; stub redirects away from dead create path; do not reintroduce `createEventSeries`.
- **[Risk] Inventory apply inside `cloneEvent` differs from create’s web-layer apply** → Mitigation: reuse the same assert/append helpers; document that create path may stay web-applied until a later cleanup.
- **[Risk] Gallery add hits max-image cap mid-copy** → Mitigation: source already respected caps; copy same ids; surface `CatalogValidationError` if add fails.

## Migration Plan

1. Implement `cloneEvent` + tests; remove series APIs/tests; update README.
2. Minimal web shim for series route imports.
3. Deploy — no DB migrate. Existing series-created rows remain normal events. Rollback: revert package commit.

## Open Questions

- None blocking step 01. Whether clone UI allows `dateTime` equal to source is a form/product detail for step 02 (domain accepts any valid Date).
