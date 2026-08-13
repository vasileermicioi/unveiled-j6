## Why

Admin create and edit still dump every event field into one long `EventAdminForm` / `EventAdminBaseFields` POST (partner, copy, address, dates, tickets, languages, image). Admins need a three-step flow with visible progress so they can author general info, schedule/tickets, then image without hunting the whole page. This is step 01 of 02 for parent feature `03-event-form-wizard`.

## What Changes

- `/admin/events/new` and `/admin/events/:id/edit` present fields in three steps with progress: (1) General, (2) Date & tickets, (3) Image.
- All fields stay in one SSR `POST` form (`encType="multipart/form-data"`, existing `name`s). Inactive steps stay mounted (`hidden`/`inert`, never unmount) so values submit.
- Create: Back / Next; Next blocked until the current step’s required fields are present (HTML `required` + client check). Primary submit only on step 3. Image still required on create.
- Edit: steps 1–3 reachable by click; Save available on every step; POST always includes the full form.
- Server error re-render opens the step that owns the first failing field (image missing → step 3).
- DE/EN step copy in `admin-content.ts` (Allgemein / General, Datum & Tickets / Date & tickets, Bild / Image).
- Out of scope: clone route; new URLs; draft schema; gallery; validation/inventory/image-pipeline changes; Gherkin/e2e (step 02). A Ladle story for the stepper shell MAY ship here if cheap.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Admin create (`/:locale/admin/events/new`) and edit (`/:locale/admin/events/:id/edit`) SHALL present fields in three steps with visible progress (general → datetimes/tickets → image) while keeping a single SSR POST. Inactive steps SHALL remain in the document. Clone SHALL remain a separate dates/inventory form.

## Impact

- **UI:** `EventAdminForm.tsx` (stepper chrome + Back/Next/Save), `EventAdminBaseFields.tsx` (split into step sections without renaming fields), `EventAdminDateFields.tsx` / `EventImageUpload.tsx` (placement only). Routes `admin/events/new.tsx` and `admin/events/[id]/edit.tsx` pass error-step restore. Clone (`CloneEventForm`) unchanged.
- **Copy:** `getAdminCopy` — step titles, progress label, Back/Next.
- **Helpers:** map known catalog/postal/image errors → step 1|2|3; pass `initialStep` into the form island. Parsers and field `name`s unchanged.
- **Tests:** existing `admin-event-form` / route-helper unit tests still pass with the same field names; add a small helper test for error→step mapping.
- **Source brief:** `.dev-plan/current-iteration/03-event-form-wizard-01-stepper-ui.md`
- **Parent:** `.dev-plan/current-iteration/03-event-form-wizard-parent-guide.md`
- **Depends on:** none (prefer `01-partner-barrier-free` and `02-image-credit` already merged so general has no barrier-free control and step 3 already has credit)
- **Consumed by:** `event-form-wizard-02-hardening`
- **Verification:** `bun run typecheck`; `bun run lint`; `cd apps/web && bun test` (admin-event-form unit tests)
