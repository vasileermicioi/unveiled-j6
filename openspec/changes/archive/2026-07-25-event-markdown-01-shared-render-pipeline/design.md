## Context

Parent feature: Event description Markdown (`.dev-plan/current-iteration/event-markdown-parent-guide.md`). This is child step 01 — first increment; no prior child dependency.

Today `events.description` is a `text` column rendered as a single HeroUI `Paragraph` of raw string in `EventDetailPage` (`event-detail--checkout__description`). `eventDetailPageMeta` truncates `event.description` for meta; `buildEventJsonLd` copies the same raw string into `schema.org/Event.description`. Existing plain-text rows are already valid Markdown.

Constraints: HeroUI-only UI (AGENTS.md §8–9); theme tokens in `globals.css`; SSR in HonoX/Workers; no `rehype-raw`; no admin editor / DB migration this step; helpers under `apps/web/app/lib/` (prefer app-local over a new package); product/BDD/seed polish deferred to step 03.

## Goals / Non-Goals

**Goals:**

- Shared SSR Markdown renderer with GFM (`react-markdown` + `remark-gfm`) and HeroUI node mapping.
- `markdownToPlainText` for meta truncate + JSON-LD description.
- Public event detail description slot uses the renderer; SEO path uses plain text.
- Minimal theme chrome for list/table/code under `.event-description-markdown` when HeroUI has no primitive.
- Unit tests for plain-text extraction; lint/typecheck green.

**Non-Goals:**

- `@mdxeditor/editor` / admin form replacement (step 02).
- Product Gherkin, schema-overview notes, design-system exception docs, demo seed Markdown (step 03).
- Partner descriptions, FAQ, static marketing Markdown.
- MDX / executable JSX; HTML blocks in descriptions; new DB column.
- Migrating historical descriptions through a transform job.

## Decisions

1. **Libraries: `react-markdown` + `remark-gfm` only**
   - **Choice:** Add both to `apps/web`. Enable `remarkPlugins={[remarkGfm]}`. Do **not** add `rehype-raw`, `rehype-sanitize`, or MDX runtime.
   - **Rationale:** Matches parent guide; GFM covers tables, strikethrough, autolinks, task lists; omitting raw HTML avoids XSS without a sanitize pipeline.
   - **Alternatives:** `marked` + custom React tree — more glue; MDX — out of scope / executable risk.

2. **Module layout stays in `apps/web`**
   - **Choice:** `apps/web/app/lib/markdown.ts` exports `markdownToPlainText`; `apps/web/app/components/MarkdownContent.tsx` is the SSR view component. No new workspace package.
   - **Rationale:** Step brief prefers app-local until reuse clearly needs a package; only public event detail (+ SEO) consume it this step.
   - **Alternatives:** `@unveiled/ui` export — premature; admin editor (step 02) will not import the public renderer path.

3. **`markdownToPlainText` implementation**
   - **Choice:** Deterministic strip of common Markdown markers to readable plain text (headings → text, emphasis/strikethrough markers removed, links → label text, list markers removed, whitespace normalized). Prefer a small pure function (optionally powered by a lightweight stripper or remark AST → text) that needs no DOM. Export for use by `seo.ts`.
   - **Rationale:** Meta/JSON-LD must not contain `**`, `#`, list bullets, or raw link syntax; unit-testable without Workers.
   - **Alternatives:** Reuse rendered HTML + strip tags — heavier SSR path for meta; leave markers — fails SEO requirement.

4. **`MarkdownContent` HeroUI mapping**
   - **Choice:** Pass a `components` map to `react-markdown` mapping `p` → `Paragraph`, `h1`–`h3` (and lower heading levels as appropriate) → `Heading` with matching `level`, `a` → HeroUI `Link` with `rel="noopener noreferrer"` for external `http(s)` targets, block wrappers via `Surface` where useful. Wrapper root: `Surface` (or equivalent) with class `event-description-markdown` (+ preserve `event-detail--checkout__description` on the event-detail call site for layout continuity).
   - **Rationale:** Satisfies HeroUI-only hard rule for text/links; documents inevitable native `ul`/`ol`/`li`/`table`/`code`/`pre` under the themed wrapper if no HeroUI primitive exists.
   - **Alternatives:** Render all as raw HTML inside one `Surface` — violates §8; map nothing — fails design-system rules.

5. **Wire event detail + SEO only**
   - **Choice:** Replace the identity-column description `Paragraph` with `<MarkdownContent markdown={event.description} className="…" />`. In `eventDetailPageMeta`, `truncateDescription(markdownToPlainText(event.description))`. In `buildEventJsonLd`, set `description: markdownToPlainText(event.description)` (no truncate unless product already truncates JSON-LD — today it does not).
   - **Rationale:** Minimal surface for step 01; unlocks visible Markdown for any already-stored syntax and for step 02 authoring.
   - **Alternatives:** Also change admin preview — out of scope until editor lands.

6. **Theme scope**
   - **Choice:** Add `.event-description-markdown` rules in `globals.css` only for list/table/code spacing, borders, and typography tokens that cannot be expressed via HeroUI props. No per-route color/shadow Tailwind on the content tree beyond existing layout classes on the wrapper.
   - **Rationale:** AGENTS.md §9; parent risk note on list/table chrome.
   - **Alternatives:** Defer all theme to step 03 — may leave ugly lists in 01 smoke; do full table polish now — scope creep.

7. **Empty / whitespace descriptions**
   - **Choice:** If description is empty/whitespace after trim, keep current UX (no description block or empty render — match existing behavior; do not invent placeholder copy).
   - **Rationale:** Avoid product-copy changes this step.
   - **Alternatives:** Always render wrapper — unnecessary DOM.

## Risks / Trade-offs

- **[Risk] HeroUI hard rule vs Markdown DOM (`ul`/`ol`/`table`)** → Mitigation: map text/links/headings to HeroUI; scope native list/table/code under `.event-description-markdown`; note convention for step 03 docs.
- **[Risk] XSS via HTML in Markdown** → Mitigation: never enable `rehype-raw`; GFM HTML blocks stay as text or are not executed; external links get `noopener noreferrer`.
- **[Risk] Bundle size on public detail** → Mitigation: `react-markdown` + `remark-gfm` only on the SSR/public path; do not import `@mdxeditor/editor` here.
- **[Risk] Plain-text strip imperfect for exotic GFM** → Mitigation: unit tests for headings, emphasis, links, lists; tables/task lists best-effort readable text; polish in step 03 if needed.
- **[Trade-off] OpenSpec deltas vs product SoT** → Planning contract ships here; `docs/product/` updates deferred to step 03 unless step 02 is blocked.
- **[Trade-off] Existing plain text unchanged visually** → Acceptable; Markdown syntax only appears once authors use it (or if already present in DB).

## Migration Plan

- No DB migration. Deploy Workers bundle with new deps.
- Rollback: revert to raw `Paragraph` + raw SEO strings; leave stored text unchanged (still valid).
- No data backfill.

## Open Questions

- None blocking step 01. Table theming depth deferred to step 03 if smoke shows gaps.
