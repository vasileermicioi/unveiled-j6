## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/02-form-draft-persistence-02-remaining-admin-forms.md`, parent guide (non-goals, localStorage not cookies), and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step-01 artifacts exist: `form-draft.ts` + `form-draft.test.ts`, `FormDraftPersistence` component/island, `draftRestored` / `discardDraft` in `getAdminCopy`, `data-form-draft-id` on `EventAdminForm`, flush/applied events

## 2. Partner create/edit

- [x] 2.1 Pass `formId` into `PartnerForm`: create `admin-partner:new`; edit `admin-partner:{partnerId}` from the edit route. Set `data-form-draft-id` on the form. Import `FormDraftPersistence` from `components/admin` (do not nest a second island). `seedIfEmpty={Boolean(error)}`
- [x] 2.2 On `unveiled:form-draft-applied`, remount opening-hours UI from `has_opening_hours`, `closed_{day}`, `open_{day}`, `close_{day}` so day rows exist and `defaultChecked` / `defaultValue` match the draft
- [x] 2.3 `PartnerLogoUpload`: on applied, reconstruct staged `ProcessedAdminUpload` from named hidden fields (`imageId`, claimed size, `{filename}__b64`) and restore `image_credit`. Skip `type=file`. Incomplete sets leave processed empty

## 3. Clone

- [x] 3.1 Mount `FormDraftPersistence` on `CloneEventForm` with `formId` `admin-event-clone:{sourceEventId}` (`source.id`), `data-form-draft-id`, `seedIfEmpty={Boolean(error)}`. Import the component, not a nested island
- [x] 3.2 On applied, set `timingMode`, `capacityMode`, and controlled `totalCapacity` from named fields. Rely on existing `EventAdminDateTimeList` applied rebuild for datetime rows
- [x] 3.3 `PromoCodeInventoryFields`: on applied, restore `codes` from `promo_codes_json` or `promo_codes_paste`. `PdfVoucherInventoryFields`: restore `voucher_pdfs_json` into the hidden input and preview; do not persist PDF file bytes

## 4. Gallery add

- [x] 4.1 On `AdminEventGalleryAddPage`, add `admin-form` + `data-form-draft-id={admin-event-gallery-add:{eventId}}` and mount the `FormDraftPersistence` **island**. Pass `seedIfEmpty` when the add route re-renders with `error`
- [x] 4.2 `EventImageUpload` (`multiple`): on applied, reconstruct `processedList` from `galleryCount` + `gallery[i].*` hidden sets (including `__b64`) and restore `image_credit_{index}`. Skip `type=file`

## 5. Verification and handoff

- [x] 5.1 Run `bun run lint` — exits 0
- [x] 5.2 Run `bun run typecheck` — exits 0
- [x] 5.3 Run `cd apps/web && bun test app/lib/form-draft.test.ts` — still exits 0 (no storage-format regression)
- [x] 5.4 Mark step 02 done in `.dev-plan/current-iteration/02-form-draft-persistence-parent-guide.md`. Do not update AGENTS.md or product Gherkin (step 03). Do not mount search, delete, freeze/refund/credits, comp-ticket, featured search, or onboarding
