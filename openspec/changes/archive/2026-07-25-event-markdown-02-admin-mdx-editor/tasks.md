## 1. Setup

- [x] 1.1 Confirm prerequisites: step 01 `MarkdownContent` + `markdownToPlainText`, `EventAdminBaseFields` description `TextArea`, `EventAdminForm` / `EventSeriesForm`, `admin-event-form.ts` `description` parse
- [x] 1.2 Skim `.dev-plan/current-iteration/event-markdown-parent-guide.md` for release criteria and non-goals
- [x] 1.3 Add `@mdxeditor/editor` to `apps/web` (`@unveiled/web`) and import required editor CSS once from the island (or its admin component entry)

## 2. EventDescriptionEditor island

- [x] 2.1 Create `EventDescriptionEditor` client island (follow `EventImageUpload` pattern: component under `apps/web/app/components/admin/`, island re-export under `apps/web/app/islands/`)
- [x] 2.2 Initialize MDXEditor from `initialMarkdown` / `defaults.description`; keep a visually hidden native `<textarea name="description">` in sync on every change
- [x] 2.3 Configure a minimal toolbar/plugin set: headings, bold/italic, lists, links, quote; add tables only if low-cost; no image-upload or JSX plugins
- [x] 2.4 Preserve required semantics (label/ARIA); rely on existing server `requireNonEmpty` for authoritative validation
- [x] 2.5 Add a short code comment that MDXEditor is an allowed non-native form exception (with image upload / geo picker); leave `design-system.md` edit for step 03

## 3. Wire admin forms + theme

- [x] 3.1 Replace description `TextField`/`TextArea` in `EventAdminBaseFields` with HeroUI `Label` (+ optional Markdown helper `Description`) wrapping `EventDescriptionEditor`
- [x] 3.2 Confirm create (`/admin/events/new`), edit (`/admin/events/:id/edit`), and series (`/admin/events/series/new`) all pick up the editor via shared base fields
- [x] 3.3 Leave `admin-event-form.ts` / `@unveiled/db` create-update parse path unchanged aside from accepting Markdown strings
- [x] 3.4 Theme editor chrome under an admin wrapper class (e.g. `admin-event-description-editor`) in `globals.css` — bordered flat surfaces, theme tokens only

## 4. Verification & handoff

- [x] 4.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 4.2 Manual smoke: admin create with heading + bullet list → DB/`description` is Markdown → public detail renders via step 01 pipeline
- [x] 4.3 Manual smoke: admin edit loads existing description; save without intentional edits preserves Markdown structure
- [x] 4.4 Manual smoke: series create shows the same editor in shared base fields
- [x] 4.5 Mark step 02 done in `.dev-plan/current-iteration/event-markdown-parent-guide.md`; note toolbar/plugin choices for step 03; leave product-spec / seed / design-system exception docs for step 03
