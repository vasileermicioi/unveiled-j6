## Context

Parent feature: admin event create/edit three-step wizard (`.dev-plan/current-iteration/03-event-form-wizard-parent-guide.md`), step 02 of 02 — Gherkin, Playwright, docs, empty/error coverage. Closes the feature.

Step 01 is merged (`event-form-wizard-01-stepper-ui`, archived 2026-08-13):

- `EventAdminForm` owns `ProgressBar` (`aria-label` = `Schritt n von 3` / `Step n of 3`) plus numbered `Button type="button"` 1–3 with `aria-label` = `Allgemein` / `General`, `Datum & Tickets` / `Date & tickets`, `Bild` / `Image`. Current step: `button--primary` + `aria-current="step"`.
- Create: Back / Next; Next gated by current-section HTML `required`; primary submit (`Anlegen` / `Create`) **only on step 3**. Numbered buttons only to `step <= maxReached`.
- Edit: jump to any numbered step; Save on every step; no Next/Back.
- Inactive sections: `hidden` + `inert` on `[data-event-form-step]`; never unmounted; never `disabled`.
- Server errors pass `initialStep={eventFormErrorStep(error)}` (missing image → 3).
- Ladle: `EventAdminForm / Create stepper` and `EventAdminForm / Edit stepper` already exist.
- Clone still uses `CloneEventForm` on `/:locale/admin/events/:id/clone` — no stepper chrome.

Stale surfaces this step owns:

| Area | Current drift |
|---|---|
| `docs/product/features/admin-events.feature` | No wizard scenario titles. |
| `e2e/fixtures/admin.ts` `createEventViaUI` | Fills dates/tickets/image as a flat form. Step-2/3 fields are not visible on step 1 (`toBeVisible` will fail). Languages/subtitles are filled after dates (wrong step). Create submit is not in the DOM until step 3. |
| `e2e/specs/admin-events.spec.ts` | `fillNewEventRequiredFields`, `createVoucherPromoViaUI`, image-required, redemption-validation, datetime/range tests fill dates or click Anlegen without Next. Edit capacity / image-credit tests fill step-2/3 fields from step 1. |
| `e2e/fixtures/waitlist.ts` `increaseEventCapacityViaUI` | Fills Kapazität on edit while still on step 1. |
| `ui-component-map.md` Events row | No three-step stepper; clone not called out as non-wizard. |
| `sitemap.md` | `/admin/events/new` and `/:id/edit` notes do not mention the stepper; clone does not say “not this wizard”. |
| `coverage-matrix.md` | No rows for the four wizard titles or clone-unchanged. |

Constraints: product SoT is `docs/product/` (`AGENTS.md`). BDD contract — proximity/layout selectors only; `test("Scenario: <exact Gherkin title>")`; no `data-testid`; no CSS-color assertions. Native file input keeps the existing `// BDD exception: file-input` comment. R2 skip unchanged for image specs. Do not change field `name`s, validation, inventory islands, or clone UX. HeroUI-only markup if any a11y fix is required for a selector.

## Goals / Non-Goals

**Goals:**

- Canonical Gherkin matches shipped wizard UI; Playwright titles match those `Scenario:` lines verbatim.
- Create/edit e2e helpers walk the stepper (Next on create; numbered step buttons on edit) so hidden/`inert` fields are filled only when that step is active.
- Existing admin-events scenarios (datetimes, range builder, voucher inventory, languages, image required, failed-create keeps image, credits) still pass.
- Clone page is asserted to have no three-step progress chrome.
- ui-component-map, sitemap notes, and coverage-matrix describe the three steps; paths unchanged.
- Confirm Ladle stepper stories from step 01 (add only if missing).
- Mark step 02 and the parent feature released.

**Non-Goals:**

- Redesigning clone; converting clone to the wizard.
- New routes, draft/unpublished events, per-step URLs.
- Partner form stepper or a shared `AdminStepper`.
- Changing validation rules, range builder, voucher islands, or image pipeline.
- Theme / design-token changes; CSS-color assertions.
- New AGENTS.md convention.

## Decisions

1. **Gherkin titles are locked here so Playwright can match them verbatim**
   - **Choice:** Use these `Scenario:` titles (punctuation and casing as written). Implementers MUST copy them into both `admin-events.feature` and `test("Scenario: …")`.

   | Title | Intent |
   |---|---|
   | `Create walks three steps` | Open `/admin/events/new`. See progress `Schritt 1 von 3` / `Step 1 of 3` and current step named General (`Allgemein` / `General`). Datetime list (`Termin hinzufügen` / `Add datetime` or a visible Datum/Date field) and image section (`Event-Bild` / `Event image`) are **not visible**. Fill required general fields, click Next (`Weiter` / `Next`), then datetime list is visible and image still is not. Next again → image section visible. |
   | `Create submit is on the image step` | On create step 1 and 2, Anlegen/Create is not shown. On step 3 it is. Completing all three steps and submitting persists title (and other step-1 values) — proves hidden steps POST. R2 skip (image upload). |
   | `Edit can jump to image` | Open edit. Click the numbered button named `Bild` / `Image` (aria-label). URL stays `/edit` (no POST). Image section visible. Save from that step succeeds; dates/image id unchanged if not edited. R2 skip (create source). |
   | `Missing image returns to step 3` | Walk create 1→2→3 without attaching a file; submit. Stay on `/new`; error copy `Event-Bild ist erforderlich` / `Event image is required`; progress shows step 3 of 3 and the image section is visible. Distinct from existing `Event image is required` (that one keeps its title; this one asserts **which step** reopens). R2 skip (partner logo). |
   | `Clone is not a wizard` | Open clone for an existing event. No progress text `Schritt n von 3` / `Step n of 3`; no buttons named `Allgemein`/`General`, `Datum & Tickets`/`Date & tickets`, or `Bild`/`Image` as stepper chrome. Datetime fields are visible without Next. R2 skip (create source). |

   Do **not** add a Playwright test for `Coverage lists wizard scenarios` — that is a docs/coverage-matrix check only.

   - **Rationale:** Step-plan titles plus clone-unchanged. Separate from `Event image is required` so the old scenario stays a validation test and the new one is the error-step restore.
   - **Alternatives:** One mega-scenario (weaker matching); retitle `Event image is required` (breaks existing matrix row).

2. **Stepper helpers in `e2e/fixtures/admin.ts`; create fills by walking Next**
   - **Choice:** Add labels and helpers (proximity/`getByRole` only):

     ```ts
     wizardStepGeneral: /^(allgemein|general)$/i,
     wizardStepDateTickets: /^(datum & tickets|date & tickets)$/i,
     wizardStepImage: /^(bild|image)$/i,
     wizardNext: /^(weiter|next)$/i,
     wizardBack: /^(zurück|back)$/i,
     wizardProgress: /schritt \d+ von \d+|step \d+ of \d+/i,
     addDateTime: /termin hinzufügen|add datetime/i,
     imageSection: /event-bild|event image/i,
     ```

     - `expectEventFormStep(page, n)` — `getByText` / progressbar name matching `Schritt n von 3` / `Step n of 3`; current numbered button `getByRole("button", { name: wizardStep… })` has `aria-current="step"`.
     - `clickEventFormNext(page)` — `getByRole("button", { name: wizardNext })`.
     - `goToEventFormStep(page, 1|2|3)` — click the numbered button by **accessible name** (aria-label = step title). Use this on **edit**. On **create**, do not use it to skip ahead of `maxReached` (those buttons are disabled); use Next after filling the current step.
     - Reorder `createEventViaUI`: fill **all step-1 fields** (partner, title, description, location, category, type, language, subtitles) → Next → step-2 (dates, credits, capacity, ticket type / secret / voucher) → Next → step-3 (file + optional credit) → Anlegen/Create.
     - `attachEventImageFile` / `setInputFiles` only after step 3 is active — even if the hidden `input[name="image"]` would accept files from step 1.

   - **Rationale:** Step plan: do not rely on visibility of hidden step-2 fields; prefer the stepper so tests match user behavior. Playwright `getByRole` / `toBeVisible` skip `hidden`/`inert` nodes. Languages live on step 1 today but are filled after dates in the helper — that would click Next with an empty language UI still on a later step.
   - **Alternatives:** `{ force: true }` fills on hidden nodes (rejected — fights the wizard); `data-testid` on sections (forbidden).

3. **Spec-local create helpers and every create/edit filler that touches step 2/3 must advance**
   - **Choice:** Update in place (no parallel “flat” helper):

     | Caller | Change |
     |---|---|
     | `fillNewEventRequiredFields` | Keep as **step 1 only**. After it returns, callers that need dates MUST `clickEventFormNext` before `fillLabeledDateOrTime`. Optionally rename in a comment, not the export, to avoid churn. |
     | `createVoucherPromoViaUI` | Same walk as `createEventViaUI` (general → Next → ticket/inventory → Next → image → submit). |
     | Image-required / redemption-validation tests | Fill general → Next → dates/tickets → Next → (image or skip) → submit. |
     | Datetime / range-builder tests | After general, Next, then interact with the list/builder. Image attach after a second Next. |
     | `Update an event's capacity` | After opening edit, `goToEventFormStep(page, 2)` then fill Kapazität. Save is already on every edit step. |
     | `Keep existing image and edit credit` / gallery-unrelated image credit on edit | `goToEventFormStep(page, 3)` before the credit field. |
     | `increaseEventCapacityViaUI` (`waitlist.ts`) | `goToEventFormStep(page, 2)` before Kapazität. |
     | Step-1-only tests (location prefill, languages, subtitles, country/city on create) | Stay on step 1; they already assert general fields. Country/city on **clone** is unchanged (no stepper). Country/city on **edit** stays step 1. |

   - **Rationale:** Existing scenarios MUST still pass (step-plan scope). One helper API, not a fork.
   - **Alternatives:** Duplicate create helpers (drift); only fix `createEventViaUI` and leave inline tests (they will fail).

4. **Clone assertion is absence of create/edit progress chrome, not a screenshot**
   - **Choice:** On `/:locale/admin/events/:id/clone`, assert:
     - `getByText(adminLabels.wizardProgress)` count 0
     - `getByRole("button", { name: adminLabels.wizardStepGeneral })` count 0 (and Date & tickets / Image)
     - A datetime field **is** visible without clicking Next
     Do not assert CSS. Do not reuse `EventAdminForm` on clone.
   - **Rationale:** Step plan: “clone page has no three-step progress chrome”. Accessible names beat class selectors.
   - **Alternatives:** `getByRole("progressbar")` only (HeroUI ProgressBar mapping may vary; combine with the progress label text).

5. **Canonical docs — notes only; paths unchanged**
   - **Choice:**
     - `admin-events.feature`: add the five scenarios (table in decision 1) near other create/edit/clone scenarios. Keep `Event image is required`.
     - `ui-component-map.md` Events row: create/edit use a **three-step** `EventAdminForm` (General → Date & tickets → Image; HeroUI `ProgressBar` + numbered steps; one multipart POST; inactive steps stay mounted). **Clone is not this wizard** (`CloneEventForm`, dates/inventory only).
     - `sitemap.md`: `/admin/events/new` note “three-step create wizard (general → date & tickets → image; one POST)”; `/admin/events/:id/edit` “same stepper; Save from any step”; `/admin/events/:id/clone` add “not the create/edit stepper”. Paths stay exactly `/admin/events/new` and `/admin/events/:id/edit`.
     - `coverage-matrix.md`: rows for the five titles. Image-walk scenarios: R2 env-skip like other create tests. `Clone is not a wizard`: R2 skip because creating the source needs an image. `Coverage lists wizard scenarios` is satisfied by these rows existing (pass or explicit environment skip) — no extra Playwright test.
   - **Rationale:** Parent release criteria. Canonical SoT is `docs/product/`, not OpenSpec main specs alone.
   - **Alternatives:** New sitemap routes (forbidden).

6. **Ladle story: confirm step 01; do not duplicate**
   - **Choice:** `EventAdminForm.stories.tsx` already has Create stepper and Edit stepper. This step only adds a story if those exports are missing at apply time. Keep `EventAdminBaseFields / Collapsed preview` as the non-stepper story.
   - **Rationale:** Step plan: “Add Ladle story if step 01 did not.”
   - **Alternatives:** New story per step (noise).

7. **`Event image is required` vs `Missing image returns to step 3`**
   - **Choice:** Keep both. The former may share the walk-to-step-3-and-submit-without-file path; it asserts rejection copy. The latter asserts progress is step 3 and the image section is visible after re-render (`initialStep` from `eventFormErrorStep`). Client-side image required may block submit before POST — if the island blocks with `imageRequiredError` **without** a round-trip, still assert the user is on step 3 with the image section visible (create submit lives there). If a native `invalid` event jumps to another step, that is a bug to fix in this step only if it prevents the scenario; do not change validation rules.
   - **Rationale:** Step 01 already maps `MISSING_EVENT_IMAGE` / `CLIENT_IMAGE_REQUIRED` → step 3.
   - **Alternatives:** Delete the old scenario (loses the generic required-image coverage row).

8. **No production markup for tests**
   - **Choice:** Do not add `data-testid`. `data-event-form-step` is implementation, not a selector. Use step titles, progress text, `Termin hinzufügen` / `Add datetime`, `Event-Bild` / `Event image`. If Image (`Bild`) collides with another button on edit (e.g. gallery), scope to the form / `getByRole("main")` and prefer `getByRole("button", { name: …, exact: true })`. Numbered buttons’ **accessible name is the aria-label** (step title), not the visible `1`/`2`/`3`.
   - **Rationale:** `bdd-and-e2e.md`. Step 01 set aria-labels for this.

## Risks / Trade-offs

- **[Risk] Hidden file input still accepts `setInputFiles` from step 1** → Mitigation: helpers MUST Next to step 3 before attaching; code-review the helper, not just green tests.
- **[Risk] `getByRole("button", { name: /^(bild|image)$/i })` matches gallery or other Image actions on edit** → Mitigation: scope to main/form; `exact: true`; assert `aria-current` / progress text as well.
- **[Risk] Next blocked because a required general field was not filled (MDX description, partner)** → Mitigation: `fillNewEventRequiredFields` / `createEventViaUI` already fill those; wait for MDX/networkidle as today before Next.
- **[Risk] Edit Save from step 1 with a hidden empty datetime triggers `invalid` and jumps to step 2** → Acceptable (step 01 decision 5). Capacity-only edits should still save from step 2 after `goToEventFormStep(2)`.
- **[Risk] Waitlist e2e fails because `increaseEventCapacityViaUI` was forgotten** → Mitigation: explicit task for `waitlist.ts`.
- **[Risk] Clone heading “Clone event” / “Event klonen” confused with stepper** → Mitigation: assert absence of progress pattern and step-title buttons, not absence of the word “event”.
- **[Trade-off] Two image-required scenarios** → Small duplication vs keeping matrix history. Share a local `submitCreateWithoutImage(page)` helper if it stays DRY.
- **[Trade-off] No new unit tests** → Error-step mapping is already unit-tested in step 01. This step is BDD/docs.

## Migration Plan

1. Confirm step 01 UI on create/edit only; clone untouched; Ladle stories present; field `name`s unchanged.
2. Add wizard labels + `expectEventFormStep` / `clickEventFormNext` / `goToEventFormStep` in `e2e/fixtures/admin.ts`. Reorder `createEventViaUI`.
3. Patch spec-local helpers and every create/edit filler listed in decision 3, including `waitlist.ts`.
4. Add Gherkin + Playwright for the five titles. R2 skip where an image upload or source event is required.
5. Update ui-component-map, sitemap notes, coverage-matrix. Confirm Ladle stories.
6. `bun run typecheck`; `bun run lint`; `bun run test:e2e` (admin-events project / wizard titles + existing admin-events). Image specs still R2-skip when unconfigured.
7. Mark step 02 done and the feature released in the parent guide.
8. **Rollback:** revert the PR. Stepper UI from 01 remains; docs/e2e go back to flat-form assumptions (those tests would be red against 01 UI).

## Open Questions

- None blocking. Whether `fillNewEventRequiredFields` should click Next at the end (so datetime tests stay shorter) is implementer preference — default **leave it on step 1** and make each caller Next, so step-1-only tests do not accidentally land on step 2.
