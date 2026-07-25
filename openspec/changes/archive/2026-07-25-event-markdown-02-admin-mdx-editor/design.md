## Context

Parent feature: Event description Markdown (`.dev-plan/current-iteration/event-markdown-parent-guide.md`). This is child step 02 — depends on step 01 (`event-markdown-01-shared-render-pipeline`, done): public detail already renders Markdown via `MarkdownContent` + `markdownToPlainText` for SEO.

Today admins edit `description` through HeroUI `TextField` + `TextArea` in `EventAdminBaseFields` (`name="description"`). Create (`/admin/events/new`), edit (`/admin/events/:id/edit`), and series (`/admin/events/series/new`) all share those base fields; islands `EventAdminForm` / `EventSeriesForm` wrap multipart SSR POST; parsers in `admin-event-form.ts` use `asString(body.description)` + `requireNonEmpty`.

Constraints: SSR-only mutations (no client save API); island-only for `@mdxeditor/editor` (never on public detail / shared SSR render path); storage remains Markdown string (not MDX/JSX/HTML); HeroUI Label/layout chrome; theme via `globals.css`; form-control exception alongside image upload / geo picker (product docs sync in step 03); minimal toolbar aligned with GFM features step 01 can render.

## Goals / Non-Goals

**Goals:**

- MDXEditor island on admin create/edit/series description field.
- Native `name="description"` field stays in sync so existing multipart POST + server validation keep working.
- Admin-scoped theme for editor chrome; lint/typecheck green.
- Note toolbar/plugin choices and form-control exception for step 03 docs.

**Non-Goals:**

- Public renderer / SEO helper changes (step 01).
- Product Gherkin, schema-overview, design-system exception docs, demo seed Markdown (step 03).
- Image embedding / file upload inside the Markdown editor.
- Partner portal event editing; Markdown on partner/FAQ/static pages.
- New DB column or description transform job.
- Client-side-only mutation modals or fetch-to-save for description.

## Decisions

1. **Library: `@mdxeditor/editor` on `apps/web` only**
   - **Choice:** Add the package to `apps/web`; import package CSS once from the island (or a single admin entry the island pulls in). Do not add MDX runtime or persist JSX.
   - **Rationale:** Parent guide and step brief name this editor; storage stays Markdown; public path already uses `react-markdown` + `remark-gfm`.
   - **Alternatives:** Keep TextArea — fails authoring goal; TipTap/ProseMirror — extra evaluation for no product win this step.

2. **Island: `EventDescriptionEditor`**
   - **Choice:** Client component at `apps/web/app/islands/EventDescriptionEditor.tsx` (thin re-export from `apps/web/app/components/admin/` if that matches `EventImageUpload` pattern). Props: `initialMarkdown` (from `defaults.description`), `locale` if helper copy needs i18n, `required` / `name` defaulting to `"description"`.
   - **Rationale:** Matches existing admin island pattern; keeps `@mdxeditor/editor` out of SSR route trees and public bundles.
   - **Alternatives:** Inline editor in `EventAdminForm` only — would miss series unless duplicated; load from every admin page — larger unnecessary surface.

3. **Form sync via visually hidden `textarea`**
   - **Choice:** Keep a native `<textarea name="description">` (visually hidden / off-screen, not `display:none` if that breaks form association) updated on every MDXEditor `onChange` with the current Markdown string. Initialize both editor and textarea from `initialMarkdown`. Mark required consistently with prior TextArea; server still `requireNonEmpty` after trim.
   - **Rationale:** Multipart SSR POST and `asString(body.description)` stay unchanged; hidden textarea participates in native form submit more reliably than a late-written `input type="hidden"` in some browsers when value is large.
   - **Alternatives:** `input type="hidden"` — fine for short strings, weaker for long Markdown; intercept submit in JS — more fragile than keeping a real named control.

4. **Swap in `EventAdminBaseFields` only**
   - **Choice:** Replace description `TextField`/`TextArea` with HeroUI `Label` (+ optional `Description` helper: field accepts Markdown) wrapping `<EventDescriptionEditor … />`. Create/edit/series inherit automatically.
   - **Rationale:** Single shared base fields is the current architecture; avoids three call-site edits.
   - **Alternatives:** Per-form wiring — higher drift risk.

5. **Minimal toolbar / plugins (GFM-aligned)**
   - **Choice:** Enable headings, bold/italic, lists, links, quote. Add tables only if low-cost with default MDXEditor plugins. Omit image upload, JSX/MDX, and HTML source modes that encourage raw HTML.
   - **Rationale:** Matches what step 01 renders; avoids scope creep into R2 uploads inside the editor.
   - **Alternatives:** Full default toolbar — noisy and may expose unsupported features; Markdown-only source mode — worse UX than visual editor.

6. **Theme under admin wrapper class**
   - **Choice:** Wrap editor in a class such as `admin-event-description-editor` and style chrome (borders, radius, toolbar flat look) in `globals.css` using theme tokens — no ad-hoc per-route color/shadow Tailwind.
   - **Rationale:** AGENTS.md §9; matches bordered flat admin surfaces.
   - **Alternatives:** Accept default MDXEditor skin — brand mismatch; deep-override every BEM node now — polish belongs partly in step 03.

7. **Server path unchanged**
   - **Choice:** Do not change `admin-event-form.ts` parse/validate or `@unveiled/db` create-update beyond accepting Markdown strings already valid as `text`.
   - **Rationale:** Storage and validation contract already fit; reduces risk.
   - **Alternatives:** Server-side Markdown lint — out of scope; strip HTML on write — optional later if needed, not this step.

8. **Form-control exception documentation**
   - **Choice:** Add a short code comment on the island / base-fields call site listing MDXEditor next to image upload / geo picker as an allowed non-native exception. Leave canonical `docs/product/ui/design-system.md` § Form controls edit for step 03.
   - **Rationale:** Step brief defers product-spec sync; implementers still need an in-code breadcrumb.
   - **Alternatives:** Edit design-system.md now — overlaps step 03 deliverable.

## Risks / Trade-offs

- **[Risk] Bundle size / Workers** → Mitigation: import `@mdxeditor/editor` only from the admin island; never from public detail or `MarkdownContent`.
- **[Risk] Form field empty on submit (sync race)** → Mitigation: update textarea on every change; optionally flush on form `submit` event as belt-and-suspenders; smoke-test create/edit/series.
- **[Risk] MDXEditor emits MDX/JSX-ish output** → Mitigation: configure Markdown mode / plugins that produce standard Markdown; do not enable JSX; storage contract is Markdown only; smoke round-trip against step 01 renderer.
- **[Risk] Required-field UX vs hidden textarea** → Mitigation: mirror prior required semantics; rely on server `requireNonEmpty` for authoritative check; add `aria`/`Label` association for a11y.
- **[Risk] Theme mismatch / hard-to-override editor CSS** → Mitigation: wrapper-scoped rules this step; deeper polish in step 03 if needed.
- **[Trade-off] OpenSpec / product SoT** → Planning delta ships here; `docs/product/features/admin-events.feature` and design-system exception stay for step 03.
- **[Trade-off] Tables in toolbar** → Include only if trivial; otherwise authors can still type table Markdown; theming polish is step 03.

## Migration Plan

- No DB migration. Deploy Workers bundle with new admin-only dependency.
- Rollback: restore `TextArea` in `EventAdminBaseFields` and remove island; stored Markdown remains valid for step 01 renderer.
- No data backfill.

## Open Questions

- None blocking. Exact MDXEditor plugin package names / CSS import path resolved at install time from current `@mdxeditor/editor` docs. Table toolbar button: include iff default plugin cost is low; otherwise defer to typed Markdown + step 03.
