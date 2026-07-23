## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-account-ui-03-admin-page-headers.md`, parent guide, and this change’s `design.md` / specs
- [x] 1.2 Confirm `PageSectionHeader` API and current `AdminPageShell` call sites / stories; skim parent guide non-goals (no table redesign)

## 2. Shared header in AdminPageShell

- [x] 2.1 Add shared Admin eyebrow copy to `admin-content` (EN: `Admin`, DE: `Verwaltung`) and pass it into the shell
- [x] 2.2 Replace bare `Heading` title block with `PageSectionHeader` (`eyebrow` + `title` as headline); keep breadcrumbs above the header
- [x] 2.3 Render optional `subtitle` as muted `Paragraph` below the header rule; keep `actions` and `wrapInCard` behavior unchanged
- [x] 2.4 Do not move admin tabs; leave `AdminLayout` → `AdminTabNav` above shell children

## 3. CSS and stories

- [x] 3.1 Trim superseded `.admin-shell__intro` title-only CSS if safe; keep useful subtitle max-width rules
- [x] 3.2 Update `AdminPageShell.stories.tsx` so wrapped-card and overview stories show the new header chrome

## 4. Validation and handoff

- [x] 4.1 Run `bun run lint` and `bun run typecheck` (both exit 0)
- [x] 4.2 Manual spot-check: `/en/admin/partners`, Events, Users, and one nested breadcrumb page — eyebrow + large headline + rule; tabs above title; subtitle/actions usable
- [x] 4.3 Mark step `03` done in the parent guide; note doc bullets for step `04` (`ui-component-map`, design-system)
