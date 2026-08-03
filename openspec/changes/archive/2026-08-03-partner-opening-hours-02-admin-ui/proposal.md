## Why

Step 01 shipped validated `hasOpeningHours` + `openingHours` on partner create/update, but admin create/edit forms still omit those fields. Admins cannot author or clear a venue schedule until the SSR partner form exposes the toggle and weekday controls (parent feature step 02 of 03).

## What Changes

- Add a native `has_opening_hours` checkbox on `/admin/partners/new` and `/admin/partners/:id/edit`.
- When checked, reveal Mon–Sun rows: native “closed” checkbox plus native `input type="time"` open/close (disabled when closed).
- Parse POST body into domain input (`hasOpeningHours`, `openingHours`); when the toggle is off, clear stored hours per domain rules (no required time fields).
- Prefill edit from stored partner hours; re-render submitted values on validation error.
- Map `INVALID_OPENING_HOURS` (and related form parse errors) to DE/EN admin copy next to the hours block / flash.
- Pure-function unit tests for form ↔ domain mapping (no R2).
- Out of scope: public event detail display (step 03); partner list column; partner portal; overnight spans; product Gherkin/e2e unless a tiny admin unblocker is needed.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `partner-catalog`: Admin partner create/edit SHALL expose an opening-hours toggle and per-weekday native controls; SSR form POST wires validated hours into `createPartner` / `updatePartner`; unchecking clears public hours.

## Impact

- **UI:** `PartnerForm` (component + island), create/edit routes under `apps/web/app/routes/[locale]/admin/partners/`.
- **Parsers / mappers:** `parsePartnerFormBody` / `PartnerFormValues` / `PartnerFormDefaults` in `admin-route.ts` (or a small dedicated helper); map to `createPartner` / `updatePartner` inputs.
- **Copy / errors:** `admin-content.ts` — labels, hints, weekday names, `INVALID_OPENING_HOURS` via `mapCatalogErrorCode`.
- **Domain (unchanged):** `@unveiled/db` `parseOpeningHours` / `assertOpeningHoursForWrite` / `INVALID_OPENING_HOURS`.
- **Source brief:** `.dev-plan/current-iteration/partner-opening-hours-02-admin-ui.md`
- **Parent:** `.dev-plan/current-iteration/partner-opening-hours-parent-guide.md`
- **Depends on:** `partner-opening-hours-01-schema-and-domain` (done)
- **Consumed by:** `partner-opening-hours-03-event-detail-and-hardening`
- **Verification:** `bun run typecheck`; `bun run lint`; form→domain parse unit tests
