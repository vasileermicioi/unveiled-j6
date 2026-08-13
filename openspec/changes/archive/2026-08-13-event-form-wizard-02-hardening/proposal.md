## Why

Step 01 shipped the three-step create/edit stepper, but Gherkin, Playwright, and product docs still describe a flat form. Helpers fill datetime and image fields while those sections are `hidden`/`inert`, so existing admin-events e2e will break or silently miss the wizard. This step closes parent feature `03-event-form-wizard` (step 02 of 02): BDD titles match the UI, docs describe the three steps, and clone stays an explicit non-wizard page.

## What Changes

- Add Gherkin in `docs/product/features/admin-events.feature` with locked titles: `Create walks three steps`, `Create submit is on the image step`, `Edit can jump to image`, `Missing image returns to step 3`, plus `Clone is not a wizard`.
- Playwright in `e2e/specs/admin-events.spec.ts` uses those titles verbatim (`test("Scenario: …")`).
- Update `createEventViaUI` / `fillNewEventRequiredFields` (and other create/edit fillers) to Next through steps — do not fill step-2/3 fields while they are hidden. Prefer stepper clicks so tests match user behavior.
- Existing scenarios (datetimes, range builder, voucher inventory, languages, image required, failed-create keeps image, waitlist capacity bump) MUST still pass because helpers walk to the owning step.
- Assert clone has no three-step progress chrome (`ProgressBar` / “Schritt n von 3” / numbered General–Image buttons).
- Docs: Events row in `ui-component-map.md` mentions the three-step create/edit stepper; sitemap notes on `/admin/events/new` and `/admin/events/:id/edit` (paths unchanged); clone documented as not using the stepper; coverage-matrix rows for the new titles.
- Confirm Ladle `EventAdminForm / Create stepper` and `Edit stepper` stories from step 01; add only if missing.
- Out of scope: redesigning clone; new routes; draft events; partner form stepper; changing validation, inventory, or image pipeline.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Canonical admin-events Gherkin SHALL include the four wizard scenario titles plus clone-unchanged. Playwright SHALL use those titles verbatim. The Events UI-map entry SHALL mention the three-step create/edit stepper. Sitemap paths SHALL remain `/admin/events/new` and `/admin/events/:id/edit`. Clone SHALL be documented and tested as not using the stepper.

## Impact

- **E2E:** `e2e/fixtures/admin.ts` (`createEventViaUI`, `adminLabels` wizard keys, step-advance helpers); `e2e/specs/admin-events.spec.ts` (new scenarios + existing create/edit fillers); `e2e/fixtures/waitlist.ts` (`increaseEventCapacityViaUI` must jump to Date & tickets on edit); `e2e/specs/admin-events.spec.ts` local helpers `fillNewEventRequiredFields` / `createVoucherPromoViaUI`.
- **Docs (canonical SoT):** `docs/product/features/admin-events.feature`, `docs/product/ui/ui-component-map.md`, `docs/product/sitemap/sitemap.md`, `docs/product/testing/coverage-matrix.md`.
- **Stories:** confirm `apps/web/app/components/admin/EventAdminForm.stories.tsx` (already present from step 01).
- **Runtime UI:** no intended product-behavior change; stepper already shipped. Fix a11y names only if a scenario cannot be asserted with proximity selectors.
- **Source brief:** `.dev-plan/current-iteration/03-event-form-wizard-02-hardening.md`
- **Parent:** `.dev-plan/current-iteration/03-event-form-wizard-parent-guide.md`
- **Depends on:** `event-form-wizard-01-stepper-ui` (archived / done)
- **Consumed by:** closes the Event form wizard feature
- **Verification:** `bun run typecheck`; `bun run lint`; Playwright titles match new Gherkin (R2 skip unchanged for image specs)
