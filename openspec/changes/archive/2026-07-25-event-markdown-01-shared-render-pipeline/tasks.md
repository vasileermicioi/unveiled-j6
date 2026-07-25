## 1. Setup

- [x] 1.1 Confirm prerequisites: `events.description` text column, `EventDetailPage` identity description slot, `eventDetailPageMeta` / `buildEventJsonLd` / `truncateDescription` in `apps/web/app/lib/seo.ts`
- [x] 1.2 Skim `.dev-plan/current-iteration/event-markdown-parent-guide.md` for release criteria and non-goals
- [x] 1.3 Add `react-markdown` and `remark-gfm` to `apps/web` (`@unveiled/web`)

## 2. Plain-text helper

- [x] 2.1 Implement `markdownToPlainText(markdown: string): string` in `apps/web/app/lib/markdown.ts` (headings, emphasis, links, lists → readable plain text; normalize whitespace)
- [x] 2.2 Add unit tests covering headings, emphasis, links, and lists (no raw `**` / `#` / list markers in output)
- [x] 2.3 Run targeted `bun test` on the new test file and confirm exit 0

## 3. MarkdownContent SSR component

- [x] 3.1 Add `apps/web/app/components/MarkdownContent.tsx` using `react-markdown` with `remarkPlugins={[remarkGfm]}` and **no** `rehype-raw` (or any HTML-in-Markdown plugin)
- [x] 3.2 Map Markdown nodes to HeroUI primitives where possible (`Paragraph`, `Heading`, `Link`, `Surface`, …); external `http(s)` links use `rel` appropriate for new tabs (`noopener noreferrer`)
- [x] 3.3 Wrap output with class `event-description-markdown` (accept optional className for event-detail layout continuity)

## 4. Wire event detail + SEO

- [x] 4.1 Replace the identity-column raw description `Paragraph` on `EventDetailPage` with `MarkdownContent`
- [x] 4.2 Update `eventDetailPageMeta` to `truncateDescription(markdownToPlainText(event.description))`
- [x] 4.3 Update `buildEventJsonLd` so `description` uses `markdownToPlainText(event.description)`
- [x] 4.4 Add minimal `.event-description-markdown` theme rules in `globals.css` only where HeroUI mapping is insufficient (lists/tables/code; theme tokens + layout)

## 5. Verification & handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Re-run targeted unit tests for `markdownToPlainText` (exit 0)
- [x] 5.3 Manual smoke: public event detail with `**bold**` and a list shows formatted HTML; view-source meta/JSON-LD description has no `**` / `#`
- [x] 5.4 Mark step 01 done in `.dev-plan/current-iteration/event-markdown-parent-guide.md`; note HeroUI markdown map convention for step 03 docs; leave full product-spec sync for step 03
