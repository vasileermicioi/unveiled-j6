## Why

Step 01 shipped a reusable `localStorage` draft helper on the event wizard. Admin partner create/edit, event clone, and event gallery add still drop in-progress values on refresh. This step mounts the same helper on those catalog add/edit forms so unsaved work survives reload without a second storage format.

## What Changes

- Mount `FormDraftPersistence` on partner create (`admin-partner:new`), partner edit (`admin-partner:{id}`), event clone (`admin-event-clone:{sourceEventId}`), and gallery add (`admin-event-gallery-add:{eventId}`).
- Reuse the step-01 helper API, key prefix, 7-day TTL, restore banner + Discard copy (`getAdminCopy`), skip `type=file`, and clear-on-persist-submit (these forms have no `wizard_intent`).
- Persist named hidden fields that already exist in the DOM (staged logo/image ids, image credits, `promo_codes_paste` / `promo_codes_json`, `voucher_pdfs_json`). Do not persist raw `File` bytes.
- Flush/resync client-only islands before snapshot and after restore: partner opening-hours checkboxes (and day-row mount), clone datetime list (already hooked), clone capacity number, clone voucher inventory, Pica staged-id hidden fields on logo and gallery add.
- Failed persist re-renders use `seedIfEmpty` so posted values are re-snapshotted. Successful POST redirects already leave the draft cleared.
- Out of scope: AdminSearchForm, delete confirms, freeze/refund/adjust-credits, comp-ticket, featured add search, member profile/onboarding; AGENTS.md / Gherkin / Playwright (step 03); event wizard behavior; a second storage format.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Admin partner create/edit, event clone, and event gallery add SHALL use the same `localStorage` draft helper as the event wizard: restore after refresh, skip raw `File` inputs, show Discard, and clear on successful save POST. Form ids SHALL be unique per resource and intent (`admin-partner:new`, `admin-partner:{id}`, `admin-event-clone:{sourceId}`, `admin-event-gallery-add:{eventId}`).

## Impact

- **Partner:** `PartnerForm` (already an island) mounts `FormDraftPersistence` with create/edit ids; opening-hours React state resyncs so day rows remount; `PartnerLogoUpload` restores staged hidden ids/credits/`__b64` (not file inputs).
- **Clone:** `CloneEventForm` mounts the helper; `EventAdminDateTimeList` reuse of step-01 applied hooks; controlled `total_capacity` and voucher inventory (`promo_codes_*`, `voucher_pdfs_json`) resync on applied.
- **Gallery add:** SSR `AdminEventGalleryAddPage` form gets `data-form-draft-id` + island mount; `EventImageUpload` (multiple) restores gallery hidden sets and `image_credit_{index}`.
- **Copy:** reuse step-01 `draftRestored` / `discardDraft` strings. No new storage key prefix.
- **Source brief:** `.dev-plan/current-iteration/02-form-draft-persistence-02-remaining-admin-forms.md`
- **Parent:** `.dev-plan/current-iteration/02-form-draft-persistence-parent-guide.md`
- **Depends on:** `02-form-draft-persistence-01-shared-helper-and-event-wizard` (merged)
- **Consumed by:** `02-form-draft-persistence-03-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/form-draft.test.ts` (no regression)
