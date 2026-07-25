## Why

Steps 01–02 shipped Markdown render (`MarkdownContent` + plain-text SEO) and admin MDXEditor authoring, but the release loop is still open: product/BDD docs, demo seed, and security/theme polish do not yet match shipped behavior. Without this slice, agents and staging demos cannot treat event Markdown as fully specified and verifiable.

## What Changes

- Security polish on `MarkdownContent`: confirm no `rehype-raw`; external links keep safe `rel`/`target`; ignore/strip raw HTML only if MDXEditor emits a real issue (default: react-markdown ignores raw HTML).
- Theme polish for `.event-description-markdown` and `.admin-event-description-editor` so lists/links/headings match brand tokens (Work Sans, yellow page, flat bordered surfaces — no new shadow language).
- Demo seed: at least one upcoming event description with multi-block Markdown (heading, paragraph, list, link).
- Canonical docs / BDD:
  - Extend `docs/product/features/admin-events.feature` with Markdown authoring + public render scenarios.
  - Note in `schema-overview.md` that `events.description` is Markdown at rest.
  - Update `ui-component-map.md` event detail + admin event form rows; add MDXEditor to design-system form-control exceptions; list the new island in `docs/COMPONENTS.md`.
  - Log the decision in `gaps-and-decisions.md`.
- Optional light e2e only if the existing Playwright harness already covers admin event create/edit; optional Ladle story for `MarkdownContent` — neither blocks release.
- Mark step 03 and the parent feature done in `event-markdown-parent-guide.md`.
- **No** new editor features, partner portal, schema migrations/renames, or Markdown on other entities.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `admin-events`: Product Gherkin SHALL cover Markdown authoring on create/edit (and series via shared base fields); create/edit SHALL accept Markdown source for `description` (MDXEditor-assisted) while other required fields stay unchanged.
- `event-catalog`: Demo seed SHALL include at least one upcoming event with multi-block Markdown description; product schema docs SHALL state `events.description` is Markdown at rest (GFM public render; MDXEditor admin authoring).

## Impact

- **Security / UI:** `apps/web/app/components/MarkdownContent.tsx`; theme rules in `apps/web/app/styles/globals.css` (`.event-description-markdown`, `.admin-event-description-editor*`).
- **Seed:** `packages/db/src/catalog/fixtures/abundo-berlin-demo.json` (and/or seed path via `seed-data.ts`) — at least one rich Markdown description.
- **Product SoT:** `docs/product/features/admin-events.feature`; `database/schema-overview.md`; `ui/ui-component-map.md`; `ui/design-system.md`; `extras/gaps-and-decisions.md`; `docs/COMPONENTS.md`.
- **Optional:** Ladle story for `MarkdownContent`; Playwright scenario only if harness already fits (`docs/product/testing/bdd-and-e2e.md` proximity rules).
- **Planning:** parent guide step 03 → done; release criteria confirmed.
- **Source brief:** `.dev-plan/current-iteration/event-markdown-03-hardening-and-docs.md`
- **Parent:** `.dev-plan/current-iteration/event-markdown-parent-guide.md`
- **Depends on:** `event-markdown-02-admin-mdx-editor` (merged)
- **Consumed by:** closes Event description Markdown
- **Verification:** `bun run lint`, `bun run typecheck`, unit tests for `markdownToPlainText` (+ any new renderer tests); doc grep for Markdown + MDXEditor exception; manual admin → public detail → plain meta demo
