## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/03-event-form-wizard-01-stepper-ui.md`, parent guide (field grouping, Tabs unmount warning, non-goals), and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm create/edit still share `EventAdminForm` + one multipart POST; clone uses `CloneEventForm` and must stay untouched

## 2. Copy and error-step helper

- [x] 2.1 Add `getAdminCopy` keys: `wizardStepGeneral` (Allgemein / General), `wizardStepDateTickets` (Datum & Tickets / Date & tickets), `wizardStepImage` (Bild / Image), `wizardStepProgress(current, total)`, `wizardNext` (Weiter / Next), `wizardBack` (Zurück / Back)
- [x] 2.2 Add `eventFormErrorStep(error): 1 | 2 | 3` per design.md decision 6 (image codes → 3, datetime/redemption codes → 2, postal/required-general → 1, default 1)
- [x] 2.3 Unit-test the mapping (missing image → 3, empty dateTimes → 2, title/zip required → 1)

## 3. Three mounted step sections

- [x] 3.1 Split `EventAdminBaseFields` into step sections (or three child components) without changing field `name`s: (1) general, (2) datetimes + tickets, (3) `EventImageUpload`
- [x] 3.2 Accept `activeStep?: 1 | 2 | 3` from `EventAdminForm`. Inactive sections use `hidden` + `inert`; never unmount; never `disabled` on fields. Keep partner/ticket/timing state in this parent so opening-hours still apply when step 2 is inert
- [x] 3.3 `includeDateTime={false}` still hides only the datetime list (Ladle collapsed preview); no stepper chrome when `activeStep` is omitted

## 4. Stepper chrome and navigation

- [x] 4.1 In `EventAdminForm`, add HeroUI `ProgressBar` (`value={step}` `maxValue={3}`) plus numbered `Button type="button"` 1–3 (`button--primary` + `aria-current="step"` on current; `button--secondary` otherwise; `aria-label` = step title). Do not use `Tabs`
- [x] 4.2 Create: start at 1; Back/Next; Next blocked by current-section HTML `required` + `reportValidity`; submit (`copy.create`) only on step 3; numbered buttons only to `step <= maxReached`
- [x] 4.3 Edit: jump to any step; Save (`copy.save`) on every step; omit Next/Back; full form POST
- [x] 4.4 Capture form `invalid`: if the control is on an inactive step, switch to that step then `reportValidity`. Keep `encType="multipart/form-data"`
- [x] 4.5 Pass `initialStep={eventFormErrorStep(error)}` from create/edit POST error re-renders

## 5. Story and verification

- [x] 5.1 Add a cheap Ladle story for `EventAdminForm` stepper chrome (mock partners); leave `EventAdminBaseFields / Collapsed preview` as a non-stepper story
- [x] 5.2 Run existing `admin-event-form` / `admin-event-route-helpers` unit tests — same field names still parse. Confirm clone route/form files are unchanged
- [x] 5.3 Run `bun run typecheck` and `bun run lint` — exit 0. `cd apps/web && bun test` — exits 0
- [x] 5.4 Manual: create walks 1→2→3 and POSTs; edit can jump to image and save; failed submit without image returns to step 3
- [x] 5.5 Mark step 01 done in `.dev-plan/current-iteration/03-event-form-wizard-parent-guide.md`. Do not add Gherkin/Playwright/sitemap (step 02). No new AGENTS.md convention
