## Context

Parent feature: Event description Markdown (`.dev-plan/current-iteration/event-markdown-parent-guide.md`). Steps 01–02 are merged and archived:

- 01: `MarkdownContent` + `remark-gfm`, no `rehype-raw`; `markdownToPlainText` for meta/JSON-LD; public event detail wired; `.event-description-markdown` theme scope
- 02: `EventDescriptionEditor` island (`@mdxeditor/editor`) on create/edit/series; SSR form field `description`; `.admin-event-description-editor` theme wrapper

Shipped code is ahead of releasable SoT:

- `docs/product/features/admin-events.feature` still treats description as opaque text (no Markdown authoring / public-render scenarios)
- `schema-overview.md` does not state `events.description` is Markdown at rest
- `ui-component-map.md` / `design-system.md` / `docs/COMPONENTS.md` lack MDXEditor + `MarkdownContent` / island documentation
- `gaps-and-decisions.md` has no Markdown decision line
- Demo fixture descriptions in `abundo-berlin-demo.json` are long plain prose (no multi-block Markdown structure for staging demos)
- Link safety and theme rules largely exist; this step audits and finalizes gaps only

Constraints: product SoT is `docs/product/` (not `openspec/specs/`); HeroUI + theme tokens; no schema migration; BDD proximity selectors if e2e is touched; parent non-goals (partner portal, Markdown elsewhere, `rehype-raw`, embeds/image-upload in Markdown) stay out.

## Goals / Non-Goals

**Goals:**

- Confirm XSS posture (no raw HTML pipeline; safe external links) and finish theme polish for public + admin Markdown chrome.
- Seed at least one upcoming demo event with heading + paragraph + list + link Markdown.
- Align canonical product/UI docs + gaps log with shipped Markdown storage, MDXEditor admin UX, and GFM public render.
- Extend `admin-events.feature` with Markdown create/edit/render scenarios.
- Optionally add Ladle / Playwright only if low-cost against existing harness.
- Mark step 03 + parent feature complete against release criteria.

**Non-Goals:**

- New editor features (embeds, image upload into Markdown, collaborative editing, table toolbar).
- Partner portal / check-in.
- Schema migrations or column renames.
- Expanding Markdown to partners, FAQ, or static marketing pages.
- Building a new e2e framework; treating `openspec/specs/` as product SoT.

## Decisions

1. **Security audit posture**
   - **Choice:** Keep `react-markdown` + `remark-gfm` only (no `rehype-raw`). Rely on react-markdown ignoring raw HTML by default. Keep HeroUI `Link` with `rel="noopener noreferrer"` + `target="_blank"` for `http(s)` hrefs (already in `MarkdownContent`). Add save-time HTML strip only if MDXEditor is observed emitting HTML blocks in practice during this step.
   - **Rationale:** Parent XSS risk; step brief prefers ignore-by-default over premature strip.
   - **Alternatives:** Always strip HTML on save (extra complexity without a repro); add `rehype-sanitize` (heavier; not needed without `rehype-raw`).

2. **Theme polish scope**
   - **Choice:** Finalize under existing classes `.event-description-markdown` and `.admin-event-description-editor*` in `globals.css` — lists, links, headings, table/code chrome using brand tokens; flat bordered surfaces; no new shadow language. Do not add per-route color/typography Tailwind.
   - **Rationale:** Hard rules §8–9; step 01/02 already established class names.
   - **Alternatives:** New BEM namespaces (unnecessary churn).

3. **Demo seed Markdown**
   - **Choice:** Edit at least one upcoming event `description` in `packages/db/src/catalog/fixtures/abundo-berlin-demo.json` to include a short Markdown block (e.g. `##` heading, paragraph, `-` list, and a Markdown link) while keeping the rest of the Abundo copy usable. Prefer a high-visibility upcoming fixture (e.g. gallery walk / comedy) so staging demos hit it without hunting.
   - **Rationale:** Seed path is fixture JSON → `seed-data.ts`; no Worker-side transform.
   - **Alternatives:** Hardcode Markdown only in `seed-data.ts` post-process (diverges from fixture SoT); add a synthetic-only seed event (heavier).

4. **Product docs / BDD sync**
   - **Choice:**
     - `admin-events.feature`: add Scenario(s) for Markdown authoring on create/edit (series via shared base fields) and public detail render; clarify create/edit description is Markdown source (MDXEditor).
     - `schema-overview.md`: note on `events.description` — Markdown text at rest.
     - `ui-component-map.md`: event detail uses `MarkdownContent`; admin event form description = MDXEditor island.
     - `design-system.md` § Form controls: add MDXEditor alongside image upload / geo picker / `@better-auth-ui/*`.
     - `docs/COMPONENTS.md`: document `EventDescriptionEditor` island (+ note `MarkdownContent` SSR component if the components index lists shared content components).
     - `gaps-and-decisions.md`: decision line for Markdown-at-rest + MDXEditor + GFM public render / no `rehype-raw`.
   - **Rationale:** Parent release criteria; agents must not regenerate TextArea-only description UX.
   - **Alternatives:** Docs-only without feature scenarios (fails BDD SoT alignment).

5. **Optional e2e / stories**
   - **Choice:** Existing `e2e/specs/admin-events.spec.ts` already fills description via labeled textbox (sync/`textarea` path from step 02). Add a Markdown-specific Playwright assertion (rendered list/emphasis on public detail) **only** if it stays a small addition to that harness; otherwise rely on unit tests + Gherkin until a later e2e pass. Optional Ladle story for `MarkdownContent` with a fixture string — nice-to-have, not blocking.
   - **Rationale:** Step brief; do not build new e2e framework.
   - **Alternatives:** Full admin→public Markdown round-trip e2e as required (higher cost; defer if fragile with MDXEditor contenteditable).

6. **openspec vs product SoT**
   - **Choice:** Update `docs/product/` (+ `docs/COMPONENTS.md`) as canonical merge targets. Openspec deltas under this change reinforce seed + Gherkin/schema-doc requirements; do not treat `openspec/specs/` as product SoT (AGENTS.md).
   - **Rationale:** Repo convention.

## Risks / Trade-offs

- **[Risk] MDXEditor contenteditable breaks existing `fillTextbox` e2e** → Mitigation: step 02 sync `textarea` / fallback should keep labeled fill working; if broken, fix fixture helper to target sync field — do not invent client-only save APIs.
- **[Risk] Editing Abundo fixture prose too aggressively** → Mitigation: prepend/append a short Markdown section; keep original narrative.
- **[Risk] Docs drift vs openspec/specs** → Mitigation: `docs/product/` wins; openspec delta is planning only.
- **[Trade-off] Optional Playwright Markdown round-trip** → Prefer unit tests + feature file when e2e cost is high; document deferral in handoff if skipped.
- **[Trade-off] Save-time HTML strip** → Only if a real emit path appears; otherwise leave ignore-by-default.

## Migration Plan

1. Audit/fix `MarkdownContent` + finalize theme CSS.
2. Update one (or more) demo fixture descriptions with multi-block Markdown.
3. Sync product/UI docs + gaps + COMPONENTS; extend `admin-events.feature`.
4. Optionally add Ladle story and/or light Playwright assertion.
5. `bun run lint`, `bun run typecheck`, targeted unit tests; doc grep sanity; manual demo script.
6. Mark step 03 done and parent feature releasable in parent guide.
7. Rollback = revert docs/seed/theme commits; no schema migration.

## Open Questions

- None blocking. If Playwright Markdown round-trip is brittle against MDXEditor, defer with a note in the PR and keep unit tests + Gherkin as the validation bar.
