## Context

Parent feature: admin event create/edit three-step wizard (`.dev-plan/current-iteration/03-event-form-wizard-parent-guide.md`), step 01 of 02 — stepper UI only. Canonical Gherkin / Playwright / sitemap notes wait for `event-form-wizard-02-hardening`.

Current state:

- Create (`apps/web/app/routes/[locale]/admin/events/new.tsx`) and edit (`…/[id]/edit.tsx`) render the `EventAdminForm` island. One `<Form method="post" encType="multipart/form-data">` wraps `EventAdminBaseFields`, then a primary submit (`copy.create` / `copy.save`) and cancel.
- `EventAdminBaseFields` is a single linear client tree: partner, title, MDX description, structured address + `EventGeoPicker`, category/type, tags, `EventAdminDateTimeList` (gated by `includeDateTime`), timing mode, capacity / ticket type / secret code / voucher islands, language metadata, then `EventImageUpload` (already has optional `image_credit` from `02-image-credit`).
- Shared React state in that file: `selectedPartnerId` (create prefill + opening-hours for the datetime list), `ticketType`, `timingMode`, address geocode, `languageIndependent`, `hasSubtitles`.
- Clone uses `CloneEventForm` on `…/[id]/clone.tsx` — dates/inventory only. Do not convert it.
- Failed POST re-renders the same form with `error={mapCatalogError(...)}` and `defaults` from `formValuesToDefaults`. No step index is passed today.
- HeroUI v3 has `ProgressBar` (compound `Label` / `Track` / `Fill`) and `Tabs`. Parent lock: if inactive `Tabs.Panel` unmounts, **do not use Tabs** to hide steps.

Constraints: SSR-only mutation (one POST); HeroUI-only markup (`AGENTS.md` §8–9); Tailwind layout only; native controls unchanged (`§14`); field `name`s and parsers unchanged; client island is OK (MDX + Pica already require JS); Europe/Berlin datetime logic unchanged.

## Goals / Non-Goals

**Goals:**

- Create and edit show three steps with visible progress (index 1–3 + `ProgressBar`).
- Step 1 General, step 2 Date & tickets, step 3 Image — grouping per the step plan.
- Inactive step fields stay in the DOM (`hidden`/`inert`); POST includes them.
- Create: Back / Next; Next blocked until current-step HTML-required fields are present; submit only on step 3; image still required on create.
- Edit: jump to any step; Save on every step; full-form POST (existing update path).
- Error re-render opens the step that owns the first failing field.
- DE/EN step copy. Existing admin-event-form unit tests still pass.

**Non-Goals:**

- Clone wizard; new URLs; draft / unpublished events; gallery manage/add.
- Changing validation rules, range builder, voucher islands, or image pipeline.
- Gherkin, Playwright, ui-component-map / sitemap (step 02).
- A reusable `AdminStepper` extracted for partners or other admin forms (keep chrome event-form-specific so no new AGENTS.md / design-system convention).
- Partner form stepper.

## Decisions

1. **ProgressBar + numbered Buttons — never Tabs**
   - **Choice:** Stepper chrome lives in `EventAdminForm`: HeroUI `ProgressBar` (`value={step}` `minValue={0}` `maxValue={3}`, `ProgressBar.Label` + `Track`/`Fill`) plus three numbered `Button type="button"` (1–3) with the step title as accessible name (`copy.wizardStepGeneral` etc.). Current step: `className="button button--primary …"` and `aria-current="step"`. Other steps: `button button--secondary`. No ad-hoc colors, borders, or hex. Do **not** use `Tabs` / `Tabs.Panel` to show/hide fields (unmount risk; parent lock).
   - **Rationale:** Step plan + parent guide. `ProgressBar` value 1/2/3 of max 3 is the allowed equivalent of 33/66/100. Theme tokens only.
   - **Alternatives:** `Tabs` with a keep-mounted hack (rejected — undocumented and easy to regress); raw `<ol>` stepper (forbidden raw HTML); Chip-only steps without ProgressBar (weaker progress).

2. **Keep `EventAdminBaseFields` as state owner; wrap three mounted sections**
   - **Choice:** Do not split partner/ticket/timing state across islands. `EventAdminForm` owns `step` (1 | 2 | 3) and chrome. Pass `activeStep` into `EventAdminBaseFields`. Inside it, wrap existing JSX in three HeroUI `Surface` sections (`data-event-form-step="1|2|3"`) with `hidden={activeStep !== n}` and `inert={activeStep !== n}` (React boolean `inert` if available; otherwise `inert=""`). **Never** `{activeStep === n && <Section />}` and **never** `disabled` on inactive fields (disabled controls are omitted from FormData).
   - Field grouping:
     | Step | Contents |
     |---|---|
     | 1 General | partner, title, description, structured address + geo, category, event type, tags, language-independent, languages, subtitles / subtitle language |
     | 2 Date & tickets | `EventAdminDateTimeList` (when `includeDateTime`), timing mode, capacity (SECRET_CODE), ticket type, secret code / voucher promo+PDF inventory / website URL |
     | 3 Image | `EventImageUpload` (credit field already on the component) |
   - Extracting `EventAdminGeneralFields` / `EventAdminScheduleFields` as local child components in the same file (or sibling files) is optional if it keeps the file readable; field `name`s stay identical. `includeDateTime={false}` (Ladle collapsed preview) still hides only the datetime list, not the whole step-2 block, and does **not** show stepper chrome (`activeStep` omitted).
   - **Rationale:** Partner selection on step 1 must still drive opening-hours defaults on the datetime list (step 2). One POST, one island.
   - **Alternatives:** Three route URLs (parent non-goal); unmount inactive steps (POST would drop values); lift all state to `EventAdminForm` (larger diff, no benefit).

3. **Create vs edit navigation**
   - **Choice:**
     - **Create (`isEdit` false):** start at step 1. Footer: Back (hidden/disabled on step 1), Next (`type="button"`) on steps 1–2, primary submit (`copy.create`, `type="submit"`) **only** on step 3. Track `maxReached` (starts 1). Numbered buttons may go to any step `<= maxReached`. Next runs the current-step required check; on success `step += 1` and `maxReached = max(maxReached, step)`. Cannot skip 1 → 3.
     - **Edit (`isEdit` true):** start at step 1 (or `initialStep` on error). All numbered buttons jump freely (no Next gate). Footer: primary Save (`copy.save`, `type="submit"`) on **every** step, plus Cancel. Back/Next MAY still be shown as convenience but must not replace Save.
   - Cancel `Link` stays on every step. `encType` and `action` unchanged.
   - **Rationale:** Step plan: Save on every step so editing a title does not force walking to image. Create submit stays on image so the required primary image is in view.
   - **Alternatives:** Save only on edit step 3 (rejected by the step plan); create numbered skip-ahead (bypasses Next’s required check).

4. **Next = HTML `required` + client check on the current section only**
   - **Choice:** Next queries the **active** `[data-event-form-step]` for empty `required` / `aria-required` controls (`input`, `select`, `textarea`, including HeroUI-wrapped natives and the description hidden field). If any fail, call `reportValidity()` on the first and do not advance. Do **not** replicate server voucher-inventory / secret-code / image-pipeline rules on Next — those fail on submit as today. Image required-on-create remains a submit/server rule (step 3).
   - **Rationale:** Step plan: HTML `required` + client check. Voucher islands already POST hidden staged fields; blocking Next on those would duplicate inventory logic.
   - **Alternatives:** `form.novalidate` and a full JS validator (more code, fights native `required`); block Next using every catalog rule (out of scope — do not change validation).

5. **Native submit vs hidden required fields**
   - **Choice:** Keep HTML `required` on all steps (do not strip it when hidden). On the form, capture `invalid`: if the invalid control’s section is not the active step, `preventDefault()` the native tooltip, set `step` to that section, and after paint call `reportValidity()` on the control. Same path covers edit-Save-from-step-1 when a hidden datetime is empty, and create-submit-from-step-3 when a general field is empty.
   - **Rationale:** Hidden `required` fields still participate in constraint validation; showing a tooltip on a `display:none` input is unusable. Switching to the owning step is the same idea as server error restore.
   - **Alternatives:** Remove `required` and validate only in JS (weaker, against the step plan); `disabled` inactive fields (they would not submit).

6. **Server error restore via `initialStep`**
   - **Choice:** Add `eventFormErrorStep(error: unknown): 1 | 2 | 3` (in `admin-event-form.ts` or a tiny sibling, unit-tested). Create/edit POST catch paths pass `initialStep={eventFormErrorStep(error)}` next to `error={mapCatalogError(...)}`. Default **1**. Mapping (first match):

     | Step | Signals |
     |---|---|
     | 3 | `MISSING_EVENT_IMAGE`, `CLIENT_IMAGE_REQUIRED`, `CONFLICTING_IMAGE_SOURCES`, `IMAGE_NOT_FOUND`, `IMAGE_CREDIT_TOO_LONG`, `ImageValidationError`, image-storage config errors |
     | 2 | `EMPTY_DATE_TIMES`, `DUPLICATE_OCCURRENCE_INSTANTS`, `TOO_MANY_OCCURRENCES`, `NEGATIVE_CREDIT_PRICE`, `OCCURRENCE_LENGTH_MISMATCH`, `INVALID_REDEMPTION_CONFIG`, `EMPTY_VOUCHER_INVENTORY`, `DUPLICATE_VOUCHER_CODE`; `REQUIRED_FIELD` whose stripped field is `eventDate` / `dateTimes` / `creditPrice` / `redemption` / `secret_code` / `total_capacity` / `event_website_url` |
     | 1 | `PostalValidationError`; `PARTNER_NOT_FOUND`; `INVALID_SUBTITLE_LANGUAGE`; other `REQUIRED_FIELD` (`title`, `partnerId`, `description`, `street`, `houseNumber`, `zipCode`, `category`, `eventType`, `subtitleLanguage`, …); anything unknown |

     Reuse the existing `REQUIRED_FIELD` field strip (`message.replace(/ is required$/, "")`). Do not parse localized `error` strings.
   - **Rationale:** Routes already catch the typed error; the island only needs a number. Matches “missing image returns to step 3”.
   - **Alternatives:** Encode step in a hidden POST field (user-controllable, not the error owner); infer from the translated error copy (fragile i18n).

7. **Copy keys (locked DE/EN)**
   - **Choice:** Extend `AdminCopy` / `getAdminCopy`:

     | Key | DE | EN |
     |---|---|---|
     | `wizardStepGeneral` | Allgemein | General |
     | `wizardStepDateTickets` | Datum & Tickets | Date & tickets |
     | `wizardStepImage` | Bild | Image |
     | `wizardStepProgress(current, total)` | `Schritt ${current} von ${total}` | `Step ${current} of ${total}` |
     | `wizardNext` | Weiter | Next |
     | `wizardBack` | Zurück | Back |

     Reuse `create`, `save`, `cancel`. ProgressBar label = `wizardStepProgress(step, 3)`. Numbered buttons: visible `1`/`2`/`3` plus `aria-label` = step title (so step 02 e2e can use `getByRole('button', { name: 'General' })` without testids).
   - **Rationale:** Step-plan copy. Accessible names beat `data-testid` (`bdd-and-e2e.md`).
   - **Alternatives:** Visible titles only, no numbers (weaker “1 of 3”); English-only keys (violates i18n).

8. **Ladle story is in scope if cheap; no e2e**
   - **Choice:** Add `EventAdminForm.stories.tsx` (or extend base-fields stories) that renders the island with mock partners so the stepper chrome is visible in Ladle. Keep `EventAdminBaseFields / Collapsed preview` as a non-stepper story. No Gherkin, Playwright, ui-component-map, or sitemap edits.
   - **Rationale:** Step 02 will add a story only if missing; shipping a cheap one here closes that gap. Canonical docs wait for 02.
   - **Alternatives:** Skip the story (allowed); write Playwright now (out of scope).

## Risks / Trade-offs

- **[Risk] Inactive `required` fields block submit with an invisible tooltip** → Mitigation: capture `invalid` and switch to the owning step before `reportValidity` (decision 5).
- **[Risk] `inert` + `hidden` drops fields from FormData in some browsers** → Mitigation: do not `disabled`; verify with an existing parser unit test that a full FormData still includes `title`, `event_date_0`, and image hidden fields when those sections are inert. If a browser omits `hidden` controls (it must not per HTML), fall back to visually hiding via a layout class that is not the `hidden` attribute, keep `inert`, keep fields in the tree.
- **[Risk] Unmounting voucher / MDX / Pica islands resets staged inventory or processed variants** → Mitigation: never unmount step 2 or 3; that is the whole point of `hidden`/`inert`.
- **[Risk] Partner change on step 1 while the datetime list is inert still applies opening-hours** → Acceptable: existing `applyPartnerHours={!isEdit}` behavior; state lives in the parent. Do not skip partner-hours updates because step 2 is hidden.
- **[Risk] Create Next does not catch empty voucher inventory** → Acceptable: server still rejects on submit; error restore opens step 2. Do not change inventory validation.
- **[Risk] Clone accidentally picks up stepper chrome** → Mitigation: clone keeps `CloneEventForm`; do not reuse `EventAdminForm` there. Manual check in verification.
- **[Trade-off] No shared AdminStepper** → Event-form-only chrome. Extract later if another admin wizard appears; then one line in `docs/product/ui/design-system.md`.
- **[Trade-off] Playwright helpers still fill a “flat” form until step 02** → Hidden fields remain in the DOM, so existing e2e *may* still `fill` by label even on step 1. Do not rely on that; step 02 will walk Next. Do not unskip or rewrite e2e here.

## Migration Plan

1. Add copy keys + `eventFormErrorStep` + unit tests for the mapping.
2. Split `EventAdminBaseFields` into three mounted sections; wire `activeStep` / `hidden` / `inert`.
3. Add stepper chrome, create Next/Back gates, edit Save-on-every-step, `invalid` handler in `EventAdminForm`.
4. Pass `initialStep` from create/edit POST error paths.
5. Optional Ladle story. Confirm clone page file is untouched.
6. `bun run typecheck`; `bun run lint`; `cd apps/web && bun test` (admin-event-form / route-helper tests).
7. Mark step 01 done in the parent guide. Do not edit Gherkin.
8. **Rollback:** revert the PR. No migration. Create/edit become a single long form again; parsers unchanged.

## Open Questions

- None blocking. Whether Back/Next also appear on edit (in addition to Save) is implementer preference — default **omit Next/Back on edit** and use numbered steps + Save, to avoid two competing forward actions.
