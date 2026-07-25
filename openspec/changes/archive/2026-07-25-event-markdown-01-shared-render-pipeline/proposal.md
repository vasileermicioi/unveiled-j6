## Why

Event descriptions are stored and shown as plain text today, so authors cannot use headings, lists, or emphasis, and any Markdown already in `events.description` would leak markers into the public page and SEO/JSON-LD. This step adds a shared, SSR-safe Markdown view pipeline so public event detail can render GFM safely and meta/JSON-LD use stripped plain text — without changing the admin authoring UI yet.

## What Changes

- Add `react-markdown` and `remark-gfm` to `@unveiled/web`.
- Add a shared helper (`markdownToPlainText`) for SEO/JSON-LD plain-text extraction, with unit tests.
- Add a shared SSR `MarkdownContent` component: GFM via `remarkGfm`, no `rehype-raw` / HTML-in-Markdown, nodes mapped to HeroUI primitives where possible.
- Wire the public event detail identity description slot to `MarkdownContent` instead of a single raw-text `Paragraph`.
- Run `markdownToPlainText` before meta truncate and JSON-LD `description` in `seo.ts`.
- Theme any unavoidable list/table/code chrome under `.event-description-markdown` in `globals.css` (theme tokens + layout only).
- No admin editor changes, no DB migration, no product/BDD/seed polish (later steps).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Event `description` is Markdown at rest; public event detail renders GFM (no raw HTML); meta description and `schema.org/Event` description use plain-text extraction from that Markdown.

## Impact

- **Dependencies:** `react-markdown`, `remark-gfm` on `apps/web`.
- **Helpers / UI:** `apps/web/app/lib/markdown.ts` (or equivalent), `apps/web/app/components/MarkdownContent.tsx`, unit tests for `markdownToPlainText`.
- **Surfaces:** `EventDetailPage` description slot; `eventDetailPageMeta` / `buildEventJsonLd` in `apps/web/app/lib/seo.ts`.
- **Theme:** optional `.event-description-markdown` rules in `apps/web/app/styles/globals.css`.
- **Unchanged this step:** admin create/edit/series description `TextArea`; `@mdxeditor/editor`; partner descriptions; product Gherkin / seed Markdown / docs sync (steps 02–03).
- **Source brief:** `.dev-plan/current-iteration/event-markdown-01-shared-render-pipeline.md`
- **Parent:** `.dev-plan/current-iteration/event-markdown-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `event-markdown-02-admin-mdx-editor`
- **Verification:** `bun run lint`, `bun run typecheck`, targeted `bun test` for `markdownToPlainText`; manual smoke on public event detail with `**bold**` + list
