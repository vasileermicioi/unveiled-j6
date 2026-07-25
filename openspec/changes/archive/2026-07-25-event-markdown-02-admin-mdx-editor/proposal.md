## Why

Step 01 made public event descriptions render as safe Markdown/GFM, but admins still edit via a plain HeroUI `TextArea` in `EventAdminBaseFields`, so authoring Markdown is awkward and error-prone. This step replaces that control with an `@mdxeditor/editor` island so admins can author Markdown visually on create/edit/series while SSR form POST and `events.description` storage stay unchanged.

## What Changes

- Add `@mdxeditor/editor` (and required editor CSS) to `@unveiled/web`.
- Add a client island (e.g. `EventDescriptionEditor`) that initializes from `defaults.description`, keeps a native form field `name="description"` in sync on every change, and stays required/validated the same way as today’s TextArea (server still enforces non-empty trim).
- Replace the description `TextArea` in `EventAdminBaseFields` with HeroUI `Label` chrome + the island (optional short helper that the field accepts Markdown) so create, edit, and series forms inherit it.
- Theme MDXEditor chrome under an admin wrapper class in `globals.css` (bordered flat admin surfaces; no per-route color utilities).
- Document MDXEditor as an allowed non-native form exception next to image upload / geo picker (code comment and/or note for step 03 docs sync).
- No public renderer / SEO changes, no product feature-file / schema-doc / seed updates (step 03), no image upload inside the Markdown editor.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `admin-events`: Admin event create, edit, and series forms provide an MDXEditor-based Markdown editor for `description`; submit still uses SSR form POST with Markdown source in field `description`. Edit-event-details behavior allows Markdown descriptions stored and shown per `event-catalog` Markdown requirements.

## Impact

- **Dependencies:** `@mdxeditor/editor` on `apps/web` (admin islands only — not imported into public event detail or the shared SSR Markdown render path).
- **Islands / UI:** `apps/web/app/islands/EventDescriptionEditor.tsx` (or equivalent), `EventAdminBaseFields` description control swap; create/edit/series continue via `EventAdminForm` / `EventSeriesForm`.
- **Server:** `admin-event-form.ts` / `@unveiled/db` create-update parse path unchanged aside from accepting Markdown strings in `description`.
- **Theme:** admin-scoped editor wrapper rules in `apps/web/app/styles/globals.css`.
- **Unchanged this step:** public `MarkdownContent` / `markdownToPlainText`; product Gherkin, schema overview, design-system docs, demo seed Markdown (step 03); partner portal editing.
- **Source brief:** `.dev-plan/current-iteration/event-markdown-02-admin-mdx-editor.md`
- **Parent:** `.dev-plan/current-iteration/event-markdown-parent-guide.md`
- **Depends on:** `event-markdown-01-shared-render-pipeline` (done)
- **Consumed by:** `event-markdown-03-hardening-and-docs`
- **Verification:** `bun run lint`, `bun run typecheck`; manual smoke create/edit/series with MDXEditor ↔ Markdown round-trip
