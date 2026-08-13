## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/03-event-form-wizard-02-hardening.md`, parent guide release criteria / non-goals, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step 01 is on create/edit only: `EventAdminForm` stepper chrome, field `name`s unchanged, clone still `CloneEventForm`, Ladle `EventAdminForm / Create stepper` and `Edit stepper` present

## 2. E2E stepper helpers

- [x] 2.1 Add `adminLabels` wizard keys per design.md decision 2 (`wizardStepGeneral`, `wizardStepDateTickets`, `wizardStepImage`, `wizardNext`, `wizardBack`, `wizardProgress`, `addDateTime`, `imageSection`)
- [x] 2.2 Add `expectEventFormStep(page, n)`, `clickEventFormNext(page)`, and `goToEventFormStep(page, n)` using `getByRole` / progress text only (no `data-testid`, no CSS-color assertions)
- [x] 2.3 Reorder `createEventViaUI`: all step-1 fields including language/subtitles → Next → dates/tickets → Next → image/credit → Anlegen/Create. Attach files only after step 3 is active

## 3. Existing create/edit fillers

- [x] 3.1 Keep `fillNewEventRequiredFields` on step 1; every caller that fills dates MUST `clickEventFormNext` first, then Next again before image
- [x] 3.2 Walk `createVoucherPromoViaUI` the same way as `createEventViaUI`
- [x] 3.3 Update inline create tests (image required, redemption validation, datetime/range builder) to Next between steps before filling hidden fields or clicking Anlegen
- [x] 3.4 Edit tests that touch capacity or image credit: `goToEventFormStep` 2 or 3 before filling. Update `increaseEventCapacityViaUI` in `e2e/fixtures/waitlist.ts` the same way

## 4. Gherkin and new Playwright

- [x] 4.1 Add exact `Scenario:` titles to `docs/product/features/admin-events.feature`: `Create walks three steps`, `Create submit is on the image step`, `Edit can jump to image`, `Missing image returns to step 3`, `Clone is not a wizard`. Keep `Event image is required`
- [x] 4.2 Playwright `test("Scenario: …")` verbatim for those five titles in `e2e/specs/admin-events.spec.ts`. Proximity selectors; R2 skip when create/source needs an image. Clone asserts no progress chrome (`Schritt n von 3` / step-title buttons) and visible datetimes without Next

## 5. Canonical docs and stories

- [x] 5.1 Update `docs/product/ui/ui-component-map.md` Events row: three-step create/edit stepper; clone is not that wizard
- [x] 5.2 Sitemap notes only — paths stay `/admin/events/new` and `/admin/events/:id/edit`; clone note “not the create/edit stepper”
- [x] 5.3 Add `coverage-matrix.md` rows for the five titles (pass or explicit R2/env skip). That satisfies `Coverage lists wizard scenarios` — no extra Playwright test
- [x] 5.4 Confirm Ladle stepper stories from step 01; add only if missing. Do not duplicate `EventAdminBaseFields / Collapsed preview`

## 6. Verification and handoff

- [x] 6.1 Run `bun run typecheck` and `bun run lint` — exit 0
- [x] 6.2 Run `bun run test:e2e` (or the admin-events project). New scenario titles pass; existing admin-events scenarios still pass; image specs still R2-skip when unconfigured. Playwright titles match Gherkin verbatim
- [x] 6.3 Mark step 02 done and the feature released in `.dev-plan/current-iteration/03-event-form-wizard-parent-guide.md`. Confirm canonical product specs match shipped behavior. No new AGENTS.md convention
