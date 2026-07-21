## 1. Setup

- [x] 1.1 Confirm step 01 is done (`.admin-native-select` in `globals.css`, AGENTS §8/§14 native-first) and inventory `AdminFormSelect` props + call sites (`EventAdminBaseFields`, `EventSeriesForm`, `AdminUsersSearchForm`, `AdminWaitlistSearchForm`, `AdminCompTicketForm`, stories)
- [x] 1.2 Record multi-select decision in `.dev-plan/current-iteration/native-form-controls-parent-guide.md` Risks: prefer `<select multiple>` (checkbox group only if smoke rejects UX)

## 2. Native AdminFormSelect

- [x] 2.1 Rewrite single-select path to native `<select className="admin-native-select">` with `name`, `required`, `defaultValue` / placeholder empty option, HeroUI `Label` `htmlFor`/`id`, and `onChange` → `onSelectionChange`
- [x] 2.2 Rewrite multiple path to `<select multiple>` posting the same array `name` (`languages`, `target_age_groups`, `builder_weekdays`); map `defaultSelectedKeys`; optional `.admin-native-select--multiple` theme tweak if needed
- [x] 2.3 Remove HeroUI `Select`/`ListBox`, hidden mirror `Input`s, `EMPTY_OPTION_KEY`, and `AdminFormPopoverAnchor` usage; delete `AdminFormPopoverAnchor.tsx` if unused
- [x] 2.4 Fix any call-site prop mismatches without changing field names or option allowlists; keep ticket_type / secret_code_mode `onSelectionChange` behavior

## 3. Stories & docs

- [x] 3.1 Update `AdminFormSelect.stories.tsx` (single + multiple) to reflect native controls
- [x] 3.2 Mark step 02 done in the parent guide Child Changes list when implementation verifies; note e2e helper debt for step 04 if fixtures still assume popovers

## 4. Validation

- [x] 4.1 Manual smoke: `/en/admin/events/new` Partner is a native `<select>` and submit still posts `partner_id`; spot-check languages / age groups multi POST names
- [x] 4.2 Run `bun run lint` — exits 0
- [x] 4.3 Run `bun run typecheck` — exits 0

