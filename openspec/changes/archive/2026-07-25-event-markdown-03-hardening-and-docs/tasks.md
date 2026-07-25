## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/event-markdown-03-hardening-and-docs.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm prerequisites: `MarkdownContent` + `markdownToPlainText`, public event detail wiring, admin `EventDescriptionEditor` island on create/edit/series
- [x] 1.3 Diff stale SoT: `admin-events.feature`, `schema-overview.md`, `ui-component-map.md`, `design-system.md`, `gaps-and-decisions.md`, `docs/COMPONENTS.md`, demo fixture descriptions

## 2. Security and theme polish

- [x] 2.1 Audit `MarkdownContent` for absence of `rehype-raw` / HTML-in-Markdown plugins and for external-link `rel`/`target` safety; fix any gaps
- [x] 2.2 Only if MDXEditor is observed emitting HTML blocks, add a minimal save-time strip; otherwise keep react-markdown ignore-by-default
- [x] 2.3 Finalize `.event-description-markdown` and `.admin-event-description-editor*` theme rules in `globals.css` (lists/links/headings/tables/code; brand tokens; flat borders; no new shadows)

## 3. Demo seed

- [x] 3.1 Update at least one upcoming event `description` in `packages/db/src/catalog/fixtures/abundo-berlin-demo.json` with multi-block Markdown (heading, paragraph, list, link)
- [x] 3.2 Confirm seed path still flows through `seed-data.ts` without schema or Worker changes

## 4. Product docs and BDD

- [x] 4.1 Extend `docs/product/features/admin-events.feature` with Markdown authoring (create/edit/series via shared fields) + public render scenarios; clarify create/edit description is Markdown source
- [x] 4.2 Note in `docs/product/database/schema-overview.md` that `events.description` is Markdown at rest
- [x] 4.3 Update `docs/product/ui/ui-component-map.md` event detail + admin event form rows for `MarkdownContent` / MDXEditor
- [x] 4.4 Add MDXEditor to form-control exceptions in `docs/product/ui/design-system.md`
- [x] 4.5 Document `EventDescriptionEditor` island (and `MarkdownContent` if appropriate) in `docs/COMPONENTS.md`
- [x] 4.6 Log Markdown decision in `docs/product/extras/gaps-and-decisions.md`

## 5. Optional coverage

- [x] 5.1 Optionally add a Ladle story for `MarkdownContent` with a fixture Markdown string (nice-to-have, not blocking)
- [x] 5.2 Optionally add one Playwright assertion for rendered list/emphasis on public detail after admin save **only** if low-cost against existing `e2e/specs/admin-events.spec.ts`; otherwise skip and rely on unit tests + feature file
- [x] 5.3 If touching Playwright, use proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`

## 6. Validation and release close-out

- [x] 6.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 6.2 Run existing unit tests for `markdownToPlainText` (and any new renderer tests) — exit 0
- [x] 6.3 Doc grep sanity: `docs/product` mentions Markdown for event description; design-system lists MDXEditor exception
- [x] 6.4 Manual demo script: admin edits Markdown → public detail renders → meta description is plain text
- [x] 6.5 Mark step 03 done and parent feature releasable in `.dev-plan/current-iteration/event-markdown-parent-guide.md`
