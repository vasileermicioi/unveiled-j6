## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/02-form-draft-persistence-01-shared-helper-and-event-wizard.md`, parent guide (localStorage not cookies, no File bytes, flush MDX, discard), and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm artifacts: `EventAdminForm.tsx` (edit `Link`s vs create `wizard_intent` POSTs); `getEventCreateWizard` step≠1 302 in `admin-event-wizard-http.tsx`; `EventDescriptionEditor`; `EventAdminDateTimeList`; `CheckboxMultiSelect`; cookie-consent key `unveiled:cookie-consent`; `isWizardAdvanceSubmit`

## 2. Pure snapshot helpers

- [x] 2.1 Add `apps/web/app/lib/form-draft.ts`: key `unveiled:form-draft:v1:{formId}`; payload `{ v: 1, savedAt, fields }`; serialize named fields (string / string[]); skip no-name, `type=file`, submit/button/reset/image, `name=wizard_intent`; 7-day TTL; malformed/wrong version/expired → null and delete key
- [x] 2.2 Add `apps/web/app/lib/form-draft.test.ts`: serialize string + string[] + checkbox on/off; restore map; skip file; skip `wizard_intent`; fresh vs expired TTL; malformed JSON → null. Prefer pure field-list helpers if jsdom is unavailable

## 3. Island and copy

- [x] 3.1 Add `getAdminCopy` strings: restore notice DE `Nicht gespeicherter Entwurf wiederhergestellt` / EN `Unsaved draft restored`; Discard DE `Entwurf verwerfen` / EN `Discard draft`
- [x] 3.2 Add `FormDraftPersistence` (`components/admin/FormDraftPersistence.tsx` + `islands/FormDraftPersistence.tsx` re-export): find closest `form`; debounce ~300ms `input`/`change`; `useLayoutEffect` restore; banner only when values changed; Discard clears key + `location.reload()`; persist submit (`isWizardAdvanceSubmit` false) removes key; Next/Back keep it; swallow QuotaExceededError
- [x] 3.3 Dispatch `unveiled:form-draft-flush` on `document` before serialize and `unveiled:form-draft-applied` on the form after apply (detail `{ form, fields }`)

## 4. Wizard island resync

- [x] 4.1 `EventDescriptionEditor`: on flush, write current Markdown into the named textarea; on applied, `setMarkdown` from `fields[name]` and remount MDX (`editorSeedRef` reset or new `key`)
- [x] 4.2 `EventAdminDateTimeList`: on applied, rebuild rows/slots from `datetime_count`, `event_date_*` / `event_time_*` / `event_credit_*` / `event_capacity_*`, `range_start` / `range_end` / `range_slot_count` / `range_slot_*`; remount row inputs so `defaultValue` dates apply
- [x] 4.3 `CheckboxMultiSelect`: on applied, set `selectedValues` from `fields[name]` (`string | string[]`)

## 5. Event wizard wiring and create GET

- [x] 5.1 Mount `FormDraftPersistence` inside `EventAdminForm` (import the component; do not nest a second island). `formId`: create `admin-event:new`; edit `admin-event:{eventId}` from wizard target
- [x] 5.2 In `getEventCreateWizard`, remove the `step !== 1` 302. Render steps 2 and 3 on GET with empty/default server values. Keep create Next/Back POST replay of `defaults`

## 6. Verification and handoff

- [x] 6.1 Run `bun run lint` — exits 0
- [x] 6.2 Run `bun run typecheck` — exits 0
- [x] 6.3 Run `cd apps/web && bun test app/lib/form-draft.test.ts` — serialize, restore, TTL, skip file, skip `wizard_intent` — exits 0
- [x] 6.4 Mark step 01 done in `.dev-plan/current-iteration/02-form-draft-persistence-parent-guide.md`. Do not update AGENTS.md or product Gherkin (step 03). Do not mount partner/clone/gallery (step 02)
