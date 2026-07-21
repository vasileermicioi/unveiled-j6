## Why

Step 01 locked native-first policy and shipped `.admin-native-select` theme classes, but admin choice fields still render through HeroUI `Select`/`ListBox` inside `AdminFormSelect` (hidden inputs + portal popovers). That fights progressive enhancement, complicates e2e, and blocks the rest of the Native Form Controls feature. This step rewrites `AdminFormSelect` to native controls while keeping SSR field names and POST array contracts.

## What Changes

- Rewrite `AdminFormSelect` to native `<select>` (single) and a decided multi-value pattern (`<select multiple>` preferred; checkbox group fallback only if UX is unacceptable), applying `.admin-native-select` (and related) theme classes from step 01.
- Preserve public props (`name`, `label`, `options`, `isRequired`, `placeholder`, `defaultSelectedKey` / `defaultSelectedKeys`, `selectionMode`, `onSelectionChange`) or document thin aliases if needed — no catalog validation / option allowlist changes.
- Keep HeroUI `Label` / `Description` / `Surface` wrappers where useful; remove HeroUI `Select` / `ListBox` / `AdminFormPopoverAnchor` / hidden-input mirror from this module.
- Update Ladle stories for single and multiple `AdminFormSelect`.
- Record the multi-select decision in the parent guide Risks.
- Call sites (`EventAdminBaseFields`, `EventSeriesForm`, `AdminUsersSearchForm`, `AdminWaitlistSearchForm`, `AdminCompTicketForm`) keep working without API breakage.
- **Out of scope:** `AdminFormNumberField` (03), full Playwright fixture rewrite (04), better-auth-ui, image upload, geo picker.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Add native admin select-control requirement; update languages/age-groups multi-value and series remount wording for native named controls; remove obsolete “HeroUI-first controls” (Select/DatePicker) requirement superseded by native-first policy.

## Impact

- **Code:** `apps/web/app/components/admin/AdminFormSelect.tsx`, `AdminFormSelect.stories.tsx`; possible light call-site prop fixes; may drop unused `AdminFormPopoverAnchor` usage from this path.
- **Theme:** consume existing `.admin-native-select` in `globals.css` (no new visual tokens required unless multi checkbox pattern needs a shared class).
- **POST contracts unchanged:** `partner_id`, `category`, `event_type`, `timing_mode`, `ticket_type`, `secret_code_mode`, `barrier_free`, `languages[]`, `target_age_groups[]`, `builder_weekdays[]`, role/status/eventId filters, etc.
- **E2E:** fixtures may still assume HeroUI popovers until step 04 — note debt; do not block unless a local test hard-fails.
- **Source brief:** `.dev-plan/current-iteration/native-form-controls-02-admin-select.md`
- **Parent:** `.dev-plan/current-iteration/native-form-controls-parent-guide.md`
- **Depends on:** `native-form-controls-01-policy-and-theme` (done)
- **Consumed by:** `native-form-controls-03-admin-number`
- **Verification:** `bun run lint`, `bun run typecheck`; manual smoke `/en/admin/events/new` Partner is native `<select>` and posts `partner_id`
