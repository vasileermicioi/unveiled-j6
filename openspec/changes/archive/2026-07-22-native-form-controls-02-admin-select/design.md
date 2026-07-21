## Context

Parent feature: Native Form Controls (`.dev-plan/current-iteration/native-form-controls-parent-guide.md`). Step 01 (done) flipped AGENTS §8/§14 to native-first and shipped `.admin-native-select` / `.admin-native-number` in `globals.css`. Member Discover filters already use native `<select className="event-feed-filters__select">`.

`AdminFormSelect` is still a client HeroUI `Select`/`ListBox` with `AdminFormPopoverAnchor`, a hidden `<Input>` mirror for SSR POST (series remount workaround), and React Aria empty-key mapping (`EMPTY_OPTION_KEY`). Call sites:

| Surface | Fields |
|---|---|
| `EventAdminBaseFields` | `partner_id`, `category`, `event_type`, `timing_mode`, `ticket_type`, `secret_code_mode`, `barrier_free`, `languages` (multi), `target_age_groups` (multi) |
| `EventSeriesForm` | `slot_mode`, `builder_weekdays` (multi) |
| `AdminUsersSearchForm` | `role` |
| `AdminWaitlistSearchForm` | `status` |
| `AdminCompTicketForm` | `eventId` |

Parsers already accept same-name repeated fields as arrays (`parseBodyStringArrayField` / `parseBodyStringArray` for `languages`, `target_age_groups`, `builder_weekdays`).

Constraints: SSR-only mutations; no catalog validation/allowlist changes; theme via existing admin classes; HeroUI remains for Label/Surface/TextField chrome; e2e fixture rewrite is step 04.

## Goals / Non-Goals

**Goals:**

- Native `AdminFormSelect` for single and multi, with `.admin-native-select`, accessible label association, and unchanged field `name`s / option values.
- Preserve `defaultSelectedKey` / `defaultSelectedKeys`, `isRequired`, `placeholder`, and `onSelectionChange` (ticket type / secret-code mode conditional UI).
- Update Ladle stories; record multi-select decision in parent guide Risks.
- Supersede stale `event-catalog` “HeroUI-first controls” select requirements.

**Non-Goals:**

- `AdminFormNumberField` rewrite (step 03).
- Full Playwright admin select helpers (step 04) unless a test hard-blocks.
- better-auth-ui, image upload/Pica, `EventGeoPicker`.
- Changing date/time fields (already native `input type="date|time"`).
- Broad product-doc polish beyond parent-guide risk note (step 04).

## Decisions

1. **Multi-select: `<select multiple>` first**
   - **Choice:** Implement `selectionMode="multiple"` as `<select multiple className="admin-native-select" name={name}>` with `defaultValue={defaultSelectedKeys}` and `<option>` children. Same POST shape as today’s repeated hidden inputs (`languages=…&languages=…`). Fallback to checkbox group only if product rejects UX after smoke — not the default path for this PR.
   - **Rationale:** Parent guide + step brief prefer order (1) select multiple → (2) checkbox group; parsers already handle arrays; minimal API change.
   - **Alternatives:** Checkbox group now (better UX, more markup/CSS, larger PR); keep ListBox for multi only (defeats native-first).

2. **Single-select: native `<select>` with optional empty placeholder option**
   - **Choice:** Uncontrolled `<select name={…} defaultValue={defaultSelectedKey ?? ""} className="admin-native-select" required={isRequired}>`. If `placeholder` is set, render a leading `<option value="">` (optionally `disabled` when required). Drop `EMPTY_OPTION_KEY` — native empty string values are fine.
   - **Rationale:** Matches Discover filters; removes React Aria key workaround and hidden-input mirror.
   - **Alternatives:** Keep controlled state always (unnecessary); keep hidden mirror “for safety” (redundant once the real control has `name`).

3. **Label / chrome**
   - **Choice:** Stable `id` derived from `name` (and optional suffix if needed); HeroUI `Label htmlFor={id}`; wrap in `Surface variant="transparent"` or a simple flex column like Discover filters. No `Select.Popover` / `AdminFormPopoverAnchor`.
   - **Rationale:** AGENTS §8 allowlist + design-system: HeroUI Label/Surface around native controls.
   - **Alternatives:** Raw label element (violates HeroUI-first chrome rule).

4. **`onSelectionChange` stays on a client module**
   - **Choice:** Keep `"use client"`; wire native `onChange` → `onSelectionChange(string | string[])`. Ticket type / secret-code mode call sites keep working without prop renames.
   - **Rationale:** Conditional field UI needs client callbacks; avoiding a dual server/client export keeps the API one component.
   - **Alternatives:** Split server-only uncontrolled select + thin client wrapper (more files, same behavior).

5. **Prop API compatibility**
   - **Choice:** Keep existing discriminated props (`selectionMode`, `defaultSelectedKey` / `defaultSelectedKeys`). Do not require call-site renames. Remove unused popover-related internals only.
   - **Rationale:** Step brief — no API breakage or thin documented aliases only.
   - **Alternatives:** Rename to `defaultValue` (cosmetic churn across five call sites).

6. **CSS for multi**
   - **Choice:** Reuse `.admin-native-select` as-is; if multi looks cramped, add a modifier (e.g. `.admin-native-select--multiple` with taller `min-height`) in `globals.css` using the same tokens — no ad-hoc colors.
   - **Rationale:** Theme-only styling; chevron on multi is imperfect but acceptable for admin MVP.
   - **Alternatives:** Separate checkbox theme classes (only if falling back to checkboxes).

7. **Spec delta shape**
   - **Choice:** **REMOVED** `Admin event form HeroUI-first controls` (dates already native; selects go native). **ADDED** `Admin event form select controls` per step brief. Light **MODIFIED** on languages/age-groups multi-select (native + same array names) and series remount (drop “HeroUI Select” wording; require named native control / equivalent to carry `partner_id`).
   - **Rationale:** OpenSpec MODIFIED needs an exact existing header; the step brief’s new requirement name is an ADDED; the old HeroUI-first header is what actually exists.
   - **Alternatives:** MODIFIED HeroUI-first in place under the old title (keeps a misleading name).

8. **Dead code**
   - **Choice:** Remove Select/ListBox/hidden Input/EMPTY_OPTION_KEY from `AdminFormSelect.tsx`. Delete `AdminFormPopoverAnchor.tsx` if nothing else imports it after the rewrite (currently select-only).
   - **Rationale:** Step cleanup; avoids orphan portal helper.
   - **Alternatives:** Leave PopoverAnchor for “future” (unused debt).

## Risks / Trade-offs

- **[Native multi-select UX]** Ctrl/Cmd-click is weaker than ListBox → Mitigation: ship `<select multiple>` first; record decision in parent Risks; checkbox fallback is an explicit follow-up if rejected in smoke.
- **[E2E still targets HeroUI popovers]** Fixtures in `e2e/fixtures/admin.ts` may fail when run → Mitigation: step 04 owns rewrite; if a local run hard-fails, add a minimal native `selectOption` helper only for the blocking path and note dual debt.
- **[Series remount / confirm]** Hidden-input mirror was added for HeroUI remount quirks → Mitigation: native `<select name>` is the sole carrier; smoke series preview→confirm still posts `partner_id` (existing remount requirement scenarios).
- **[FormData array aggregation]** Must still yield `string[]` for multi fields → Mitigation: same repeated-name pattern as today’s hidden inputs; existing unit tests in `admin-event-form.test.ts` cover parsers.

## Migration Plan

1. Rewrite `AdminFormSelect` + stories; record multi decision in parent guide; apply spec delta under this change.
2. Smoke `/en/admin/events/new` Partner + languages multi submit; optional series confirm path.
3. Run `bun run lint` and `bun run typecheck`.
4. Rollback: revert PR; HeroUI select returns (no DB/env migration).

## Open Questions

- None blocking. Checkbox-group fallback only if product rejects `<select multiple>` UX during smoke — note outcome in parent Risks either way.
