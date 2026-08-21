## Context

Parent feature: unsaved form draft persistence (`.dev-plan/current-iteration/02-form-draft-persistence-parent-guide.md`), step 02 — remaining catalog add/edit forms. See proposal.md for motivation. Step 01 is merged: `apps/web/app/lib/form-draft.ts`, `FormDraftPersistence`, events `unveiled:form-draft-flush` / `unveiled:form-draft-applied`, copy keys `draftRestored` / `discardDraft`, ids `admin-event:new` / `admin-event:{eventId}`.

Current state:

- **Partner** (`PartnerForm` island, `/admin/partners/new` and `/admin/partners/:id/edit`): native text fields plus React `hasOpeningHours` that unmounts day rows; each `OpeningHoursDayRow` keeps `closed` in React (`disabled` on time inputs). `PartnerLogoUpload` mounts `AdminImageVariantFields` only after Pica processing (`imageId`, `claimedWidth`/`claimedHeight`, `{filename}__b64` hidden; variant `type=file` skipped). No geo picker on partner.
- **Clone** (`CloneEventForm` island, `/admin/events/:id/clone`): native `timing_mode` / `capacity_mode` selects with `onSelectionChange`; **controlled** `total_capacity` number. `EventAdminDateTimeList` already rebuilds from applied drafts (step 01). Voucher clone mounts `PromoCodeInventoryFields` (`promo_codes_paste`, `promo_codes_json`) or `PdfVoucherInventoryFields` (`voucher_pdfs_json` after upload; PDF `type=file` skipped).
- **Gallery add** (`AdminEventGalleryAddPage` is SSR; `EventImageUpload` island with `multiple`): form class is layout-only (no `admin-form` / `data-form-draft-id`). After processing, `galleryCount` + `gallery[i].*` hidden sets and `image_credit_{index}` exist only while `processedList` is non-empty.
- Helper already finds `form[data-form-draft-id="…"]` then falls back to `form.admin-form`. Persist submit with no `wizard_intent` already clears the key. `seedIfEmpty` re-snapshots failed POST re-renders.

Constraints: reuse the helper (no second storage format); HeroUI banner copy from step 01; skip `type=file`; mutations remain SSR POST; no AGENTS.md/Gherkin (step 03); do not attach to search/delete/freeze/refund/credits/comp-ticket/featured-search/onboarding.

## Goals / Non-Goals

**Goals:**

- Mount the existing island/component on partner create/edit, clone, and gallery add with the locked form ids.
- Flush/resync islands whose React state would otherwise ignore native restore: opening-hours mount, clone capacity/timing, datetime list (already hooked), voucher inventory JSON/paste, Pica staged hidden sets.
- Clear drafts on persist submit; `seedIfEmpty` on error re-renders; Discard reuses step-01 behavior.

**Non-Goals:**

- Changing `form-draft.ts` payload shape, key prefix, TTL, or skip-file rules (regression-only if a tiny helper is needed to reconstruct processed uploads from named hidden fields).
- Event wizard behavior, geo picker (already on the wizard; these three forms have no map).
- Encrypting drafts, cookie-consent gating, server-side draft tables.
- AGENTS.md, product Gherkin, Playwright (step 03).
- Member profile / onboarding / booking / delete confirms.

## Decisions

1. **Locked form ids and mount pattern (no second storage format)**
   - **Choice:**
     | Surface | `formId` |
     |---|---|
     | Partner create | `admin-partner:new` |
     | Partner edit | `admin-partner:{partnerId}` |
     | Clone | `admin-event-clone:{sourceEventId}` |
     | Gallery add | `admin-event-gallery-add:{eventId}` |
     Set `data-form-draft-id={formId}` on the HeroUI `Form`. Partner and clone are already `"use client"` — import `FormDraftPersistence` from `components/admin` (do not nest a second island). Gallery add is SSR — render the `islands/FormDraftPersistence` default export inside the form. Add `admin-form` to the gallery form class list so the helper fallback still works. Pass `seedIfEmpty={Boolean(error)}` wherever the route re-renders on validation/catalog errors (partner new/edit, clone, gallery add).
   - **Rationale:** Step-plan ids; step-01 locator contract; one key namespace `unveiled:form-draft:v1:{formId}`.
   - **Alternatives:** Nested island inside PartnerForm (waste); one global `admin-partner` key (create/edit would clobber).

2. **Partner opening hours: remount day rows from applied fields**
   - **Choice:** On `unveiled:form-draft-applied`, `PartnerForm` sets `hasOpeningHours` from `has_opening_hours` (`"on"` present). Lift day defaults into state (or remount `OpeningHoursDayRow` with a restore key) from `closed_{day}`, `open_{day}`, `close_{day}`. After rows commit, native apply already wrote checkboxes/times for fields that existed; remounted rows must receive restored `defaults` because they use `defaultChecked` / `defaultValue`. Native `change` on `has_opening_hours` already calls `setHasOpeningHours` during apply when the checkbox is in the DOM.
   - **Rationale:** Unmounted day fields cannot be restored; same remount pattern as datetime rows.
   - **Alternatives:** Keep all seven day rows always mounted/`hidden` (larger markup change, out of step scope).

3. **Pica / gallery: restore staged ids, credits, and `__b64` — never File bytes**
   - **Choice:** Snapshot whatever named non-file fields exist (`imageId`, `image_credit`, `galleryCount`, `gallery[i].imageId`, `gallery[i].claimedWidth`/`claimedHeight`, `gallery[i].{filename}__b64`, `image_credit_{index}`). Skip `type=file` (source file + variant file inputs). On applied, `PartnerLogoUpload` / `EventImageUpload` reconstruct `ProcessedAdminUpload` from a complete hidden set (decode `__b64` → `Blob`s) and set `processed` / `processedList` so `AdminImageVariantFields` remounts. Then credits bind from `image_credit` / `image_credit_{index}`. Incomplete sets (missing b64) leave processed empty; text credits still restore if those inputs are in the DOM. Add a small pure helper next to `admin-image-variants.ts` if reconstruction is non-trivial; do not fork draft JSON.
   - **Rationale:** Parent non-goal is raw files; staged ids/credits/`__b64` already live in hidden fields and are required for gallery credits to exist after refresh.
   - **Alternatives:** Persist only `imageId` without variants (POST would fail after refresh); IndexedDB for blobs (new storage format).

4. **Clone: reuse datetime applied hook; sync controlled capacity and voucher islands**
   - **Choice:** `EventAdminDateTimeList` already rebuilds from `datetime_count` / `event_date_*` / range fields — no fork. `CloneEventForm` on applied: set `timingMode` / `capacityMode` / `totalCapacity` from those named fields (controlled number otherwise overwrites native restore). `PromoCodeInventoryFields`: flush is unnecessary if paste + `promo_codes_json` are named; on applied, `setCodes` from `promo_codes_json` or `parsePromoCodeLines(promo_codes_paste)`. `PdfVoucherInventoryFields`: persist `voucher_pdfs_json` (uploaded ticket metadata, not PDF bytes); on applied, write the hidden input and rebuild preview counts. Skip PDF `type=file`. Native selects already dispatch `change` during apply.
   - **Rationale:** Spec scenario is clone datetimes; voucher paste/JSON matches parent “already in form fields.”
   - **Alternatives:** Serialize React state per island (forks storage format).

5. **Clear on persist submit; error pages re-seed**
   - **Choice:** These forms have no `wizard_intent`. Existing `onSubmit` already `clearStoredDraft` when `isWizardAdvanceSubmit` is false. Successful partner/clone/gallery POSTs 302 away — draft is gone on reopen. On failed persist, pass `seedIfEmpty` so the error page snapshots posted `defaults` (banner stays off unless a prior draft differed). Discard: existing `removeItem` + `location.reload()`.
   - **Rationale:** Step plan: clear only on successful persist POSTs (redirect = success); do not keep a stale draft over the next GET of the same id.
   - **Alternatives:** Clear only after detecting the list URL (fragile).

6. **Explicit non-mounts**
   - **Choice:** Do not render `FormDraftPersistence` on AdminSearchForm, delete confirms, freeze/refund/adjust-credits, comp-ticket, featured add search, or member profile/onboarding.
   - **Rationale:** Parent + step non-goals.

7. **Tests this step**
   - **Choice:** `cd apps/web && bun test app/lib/form-draft.test.ts` must still pass (no payload-format change). Optional: unit-test processed-upload reconstruction from named fields if that helper is added. No Playwright (step 03).
   - **Rationale:** Step verification lock.

## Risks / Trade-offs

- **[Risk] Opening-hours rows missing on restore** → Mitigation: applied sets `hasOpeningHours` then remounts day rows from draft field names.
- **[Risk] Pica `processed` empty after refresh so hidden variant fields never remount** → Mitigation: reconstruct from `__b64` + ids; skip if incomplete.
- **[Risk] Controlled `total_capacity` overwrites native restore** → Mitigation: CloneEventForm applied handler `setTotalCapacity`.
- **[Risk] Hydration flash** → Mitigation: existing `useLayoutEffect` restore; banner only when values changed.
- **[Risk] QuotaExceededError on large gallery `__b64` sets** → Mitigation: existing swallow on write; form stays usable. Prefer restoring ids/credits even if some variant b64 is dropped.
- **[Trade-off] Logo/gallery source File not restored** → Accepted (spec). Staged hidden sets MAY restore.
- **[Trade-off] PDF file not restored; `voucher_pdfs_json` after successful client upload MAY restore** → Accepted.
- **[Trade-off] Failed persist then refresh without `seedIfEmpty` snapshot** → Mitigated by `seedIfEmpty` on error re-renders.

## Migration Plan

1. Confirm step-01 helper, island, copy keys, and `form-draft.test.ts` exist.
2. Wire `data-form-draft-id` + `FormDraftPersistence` on `PartnerForm` (create/edit ids from route props).
3. Opening-hours applied remount; `PartnerLogoUpload` reconstruct from hidden fields.
4. Wire `CloneEventForm` (`source.id`); applied sync for timing/capacity/total; voucher paste/JSON applied.
5. Wire gallery add page (SSR island) + `EventImageUpload` multiple reconstruct.
6. `bun run lint`, `bun run typecheck`, `cd apps/web && bun test app/lib/form-draft.test.ts`.
7. Mark step 02 done in the parent guide. Do not edit AGENTS.md or Gherkin.
8. Rollback: revert the PR; leftover keys expire in 7 days.

## Open Questions

- None blocking. Exact reconstruction helper location (`admin-image-variants.ts` vs inline in the upload islands) is an implementation detail as long as File inputs stay skipped and named hidden fields restore.
