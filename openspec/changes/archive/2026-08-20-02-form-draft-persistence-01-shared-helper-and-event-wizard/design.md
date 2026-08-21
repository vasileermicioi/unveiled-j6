## Context

Parent feature: unsaved form draft persistence (`.dev-plan/current-iteration/02-form-draft-persistence-parent-guide.md`), step 01 — shared helper + event wizard only. See proposal.md for motivation.

Current state:

- Create/edit is a three-step SSR POST wizard (`EventAdminForm` island → `EventAdminBaseFields`). Inactive steps stay mounted (`hidden`/`inert`). Field names unchanged.
- **Edit** step chrome uses HeroUI `<Link>` to `/edit`, `/edit/dates`, `/edit/image` — full GET from DB, so unsaved values vanish.
- **Create** Next/Back are `wizard_intent` POSTs that replay parsed body as `defaults`. `getEventCreateWizard` **302s `step !== 1` to General**, so refresh on `/new/dates` or `/new/image` always bounces to step 1 with empty values.
- `EventDescriptionEditor` keeps Markdown in React state and a `name="description"` textarea; MDXEditor seeds once on mount (`editorSeedRef`) and may lag the textarea until blur/submit.
- Datetime UI (`EventAdminDateTimeList`) is React state (`datetime_count`, `event_date_*`, range builder fields). `CheckboxMultiSelect` keeps `selectedValues` in React. Native restore of extra rows / checked boxes will not update those UIs unless they resync.
- Cookie-consent already uses `localStorage` key `unveiled:cookie-consent`. Do not collide.
- `parseWizardIntent` / `isWizardAdvanceSubmit` already distinguish Next/Back from persist (`create` / default `save`).

Constraints: client island only where unavoidable; mutations remain SSR POST; HeroUI for banner chrome; Tailwind layout only; no cookies for drafts; no File bytes; no partner/clone/gallery (step 02); no AGENTS.md/Gherkin (step 03).

## Goals / Non-Goals

**Goals:**

- Pure snapshot/restore helpers + unit tests (serialize, restore, TTL, skip file, skip `wizard_intent`) without jsdom.
- Reusable `FormDraftPersistence` island: restore, debounce save, flush editors, banner, discard, clear on persist.
- Wire it into `EventAdminForm` with stable ids `admin-event:new` and `admin-event:{eventId}`.
- Flush MDX (and other wizard islands) into named inputs before snapshot; rebuild date-list / multi-select UI after restore.
- Create GET on `/new/dates` and `/new/image` renders that step with empty/default server values (no 302).

**Non-Goals:**

- Partner, clone, gallery-add mounts (step 02) — but the helper API MUST be reusable for those form ids.
- Encrypting drafts, cookie-consent gating, server-side draft tables, multi-device sync.
- Persisting raw file bytes (primary image file input). Staged `imageId` hidden fields are in scope.
- Changing create Next/Back POST behavior; localStorage is an additional restore path.
- AGENTS.md, product Gherkin, Playwright (step 03).

## Decisions

1. **Storage key and payload shape (versioned JSON, 7-day TTL)**
   - **Choice:** Key `unveiled:form-draft:v1:{formId}`. Payload:
     ```ts
     { v: 1, savedAt: number, fields: Record<string, string | string[]> }
     ```
     `savedAt` is epoch ms. TTL 7 days from `savedAt`. Malformed JSON, wrong `v`, missing `fields`, or expired → treat as absent (and delete the key). QuotaExceededError on write is swallowed (form still works).
   - **Rationale:** Step plan lock; prefix cannot collide with `unveiled:cookie-consent`. Version in the key *and* payload lets a later format bump ignore old blobs.
   - **Alternatives:** Cookies (rejected in parent — size + sent on every request); `sessionStorage` (lost when the tab closes; refresh-within-tab only, weaker than the spec); IndexedDB (overkill for named strings).

2. **Pure helpers in `apps/web/app/lib/form-draft.ts`; island owns DOM/React**
   - **Choice:** Export testable functions, e.g. `draftStorageKey`, `serializeFormFields(form)`, `parseDraft(raw)`, `isDraftExpired`, `applyFieldsToForm(form, fields)` (DOM write of named controls). Skip: no `name`; `type=file`; `type=submit|button|reset|image`; `name === "wizard_intent"`. Checkboxes: include the value when checked; for a checkbox group, `string[]`. Unchecked boxes omitted from `fields` so restore can uncheck names that are present in the form but missing/not listed. `select[multiple]` → `string[]`.
   - Unit tests in `apps/web/app/lib/form-draft.test.ts` use a minimal `HTMLFormElement` mock or a tiny virtual field list if jsdom is unavailable — prefer testing serialize/parse/TTL/skip as pure functions over a fake form when that is simpler (`serializeNamedFields(entries)`).
   - **Rationale:** Verification names this file; bun tests already live next to `admin-event-wizard.test.ts`.
   - **Alternatives:** Put serialize inside the island only (harder to unit-test); snapshot `FormData` including files (violates skip-file).

3. **`FormDraftPersistence` locates the nearest ancestor form**
   - **Choice:** Implementation in `apps/web/app/components/admin/FormDraftPersistence.tsx`, re-exported from `apps/web/app/islands/FormDraftPersistence.tsx` (same pattern as `EventAdminForm`). Props: `formId`, `locale`. Render as a child of HeroUI `Form` / `<form>`. On mount, `useLayoutEffect` finds `el.closest("form")`. Debounce ~300ms on bubbling `input`/`change`. Restore before paint when a valid draft exists; set banner visible only when at least one restored value differed from the SSR-rendered control.
   - EventAdminForm already `"use client"` — import the component directly (do not nest a second island). Step 02 SSR forms can mount the island.
   - **Rationale:** One helper for any SSR form; EventAdminForm is already an island so a nested island is waste.
   - **Alternatives:** `form` ref prop only (awkward for SSR markup); wrap Form in the helper (changes every form’s root).

4. **Flush then snapshot; applied event so controlled islands resync**
   - **Choice:** Document events (names locked):
     - `unveiled:form-draft-flush` on `document` (detail `{ form }`) — **before** serialize. MDXEditor / other islands MUST copy latest editor state into their named inputs.
     - `unveiled:form-draft-applied` on the form (detail `{ form, fields }`) — **after** writing fields. Dynamic UIs rebuild from the field map.
   - Optional callback registry in `form-draft.ts` (`registerFormDraftParticipant`) if an island cannot use events; events are the default.
   - **EventDescriptionEditor:** on flush, write current `markdown` into the textarea. On applied, `setMarkdown` from `fields.description` (or the `name` prop) and remount MDX (`editorSeedRef = null` or increment a `key`) because MDXEditor only seeds on mount.
   - **EventAdminDateTimeList:** on applied, rebuild `rows` / range slots from `datetime_count`, `event_date_*` / `event_time_*` / `event_credit_*` / `event_capacity_*`, `range_start` / `range_end` / `range_slot_count` / `range_slot_*`. Remount row inputs (new React keys) so `defaultValue` TextFields pick up restored dates.
   - **CheckboxMultiSelect:** on applied, set `selectedValues` from `fields[name]` (`string | string[]`).
   - **EventImageUpload / voucher hidden JSON:** restore named hidden fields (`imageId`, `promo_codes_json`, etc.) if present; do not restore `type=file`. Preview may stay at SSR image until step 02/03 polish — acceptable if `imageId` is in the POST.
   - **Rationale:** Parent risk: MDX lag; datetime rows are the edit-Link scenario. Native-only restore cannot add rows or update controlled checkboxes.
   - **Alternatives:** Serialize React state per island (forks the helper per form); keep Next/Back POST as the only create restore path (fails edit Links and refresh).

5. **Clear on persist submit; keep on Next/Back; discard reloads**
   - **Choice:** On `submit`, if `isWizardAdvanceSubmit(event)` (existing helper: `wizard_intent` is `next` or `back`), do **not** clear. Otherwise (`wizard_intent` missing, `create`, or `save`) remove the key. Successful persist redirects to the event list — draft is already gone when the admin reopens edit. Discard: `removeItem` + `location.reload()` (SSR DB values on edit, empty/defaults on create).
   - If persist fails, the server re-renders posted values as `defaults`. Draft was cleared on submit; the error page will re-snapshot as the admin types (or immediately after mount when `error` is set — snapshot silently, no banner). Failed-save then immediate refresh without typing may lose the error-page values; accepted (spec only requires successful save to clear).
   - **Rationale:** Step plan: clear on persist submit, not Next/Back. Redirect-after-success means we cannot wait for a client “success” page.
   - **Alternatives:** Clear only after detecting the list URL (fragile); keep draft until next GET of the same edit id (stale overlay after save).

6. **Create GET no longer redirects steps 2/3**
   - **Choice:** In `getEventCreateWizard`, delete the `if (step !== 1) return c.redirect(..., 302)` branch. Always `listPartners` + `renderWizard` with no `defaults` (empty/default server values). Create Next/Back POST still replays `defaults` as today. Restore from localStorage overlays after paint.
   - **Rationale:** Spec: `/new/dates` and `/new/image` GET must render those steps so a refresh can restore step 2/3. Inactive steps remain in the document, so a restored General title is present as a hidden field on the dates GET.
   - **Alternatives:** Keep the 302 and restore only on step 1 (fails the dates GET scenario); encode draft in the query string (cookies/URL size).

7. **formId wiring and restore banner copy**
   - **Choice:** `EventAdminWizardPage` / `EventAdminForm` pass `formId`: create → `admin-event:new`; edit → `admin-event:${eventId}` (`target.eventId`). Banner: HeroUI `Alert` (or `Surface` + `Paragraph` + `Button` if Alert is too heavy) above the stepper, inside the form. Copy in `getAdminCopy`:
     - DE: `Nicht gespeicherter Entwurf wiederhergestellt` + Discard `Entwurf verwerfen`
     - EN: `Unsaved draft restored` + Discard `Discard draft`
   - Theme-only visuals; Tailwind `flex`/`gap` only.
   - **Rationale:** Step plan strings; Discard must be explicit. `eventId` is already on the wizard target.
   - **Alternatives:** One global `admin-event` key (create and edit would clobber each other).

8. **Tests this step**
   - **Choice:** `cd apps/web && bun test app/lib/form-draft.test.ts` covers: serialize string + string[] + checkbox on/off; restore map; skip `type=file`; skip `wizard_intent`; TTL expired vs fresh; malformed JSON → null. No Playwright (step 03). Do not add jsdom solely for this if a field-list helper suffices.
   - **Rationale:** Step verification lock.
   - **Alternatives:** Component test of the island (needs DOM + React; defer).

## Risks / Trade-offs

- **[Risk] Hydration flash (SSR DB/empty, then overlay)** → Mitigation: restore in `useLayoutEffect`; banner only when values actually changed. Residual one-frame flash is accepted (parent guide).
- **[Risk] MDXEditor / datetime list / CheckboxMultiSelect ignore native value writes** → Mitigation: flush + applied events; remount MDX; rebuild date rows from `datetime_count`; sync multi-select from `fields[name]`.
- **[Risk] Stale edit draft vs another admin’s save** → Mitigation: Discard reloads server state. No merge (parent risk).
- **[Risk] Restored `wizard_intent` re-submits navigation** → Mitigation: never serialize that name.
- **[Risk] QuotaExceededError / private mode** → Mitigation: try/catch writes; form remains usable without drafts.
- **[Trade-off] Create GET `/new/dates` with no draft shows an empty Date & tickets step** → Accepted; required so refresh-with-draft works. HTML `required` stays on the active step only (existing).
- **[Trade-off] Failed persist then refresh may drop values** → Accepted; error re-render still shows posted `defaults`.
- **[Trade-off] Image file bytes not restored; staged `imageId` may restore without a file input** → Matches spec; create still requires an image on persist if none staged.

## Migration Plan

1. Land `form-draft.ts` + unit tests (pure serialize/parse/TTL/skip).
2. Land `FormDraftPersistence` island + `getAdminCopy` strings.
3. Flush/applied hooks on `EventDescriptionEditor`, `EventAdminDateTimeList`, `CheckboxMultiSelect`.
4. Mount on `EventAdminForm` with stable form ids.
5. Remove create GET 302 in `getEventCreateWizard`.
6. `bun run lint`, `bun run typecheck`, `cd apps/web && bun test app/lib/form-draft.test.ts`.
7. Mark step 01 done in the parent guide. Do not edit AGENTS.md or Gherkin.
8. Rollback: revert the PR; leftover `unveiled:form-draft:v1:*` keys expire in 7 days (harmless).

## Open Questions

- None blocking. Debounce interval (~300ms) and exact Discard label (`Discard draft` / `Entwurf verwerfen` vs a shorter Discard) are implementation details as long as DE/EN restore copy matches the step plan and Discard is visible.
