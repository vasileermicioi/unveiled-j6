## Context

Legal routes (`/:locale/impressum|privacy|terms`) already wire `getPageContent` → `LegalPage`. Today `LegalSection` is `{ id, title, placeholder: string }` and `LegalPage` renders one muted `Paragraph` per section. Parent feature `legal-pages` needs multi-paragraph DE/EN copy in steps 02–04; inventing final legal prose is out of scope here.

Constraints: HeroUI-only markup (`AGENTS.md` §8–9); Tailwind for layout/spacing only; content stays in `apps/web/app/lib/content/legal.ts` (same pattern as FAQ / how-it-works); no client islands; no route or SEO shape changes.

## Goals / Non-Goals

**Goals:**

- Replace `placeholder` with `body: readonly string[]` on `LegalSection`.
- Keep the app compiling with temporary single-element `body` arrays (current placeholder strings).
- Render one HeroUI `Paragraph` per body entry inside each `SectionCard`.
- Unlock content steps 02–04 without further UI work.

**Non-Goals:**

- Final Impressum / Privacy / Terms wording (02–04).
- Product docs, i18n inventory, e2e non-placeholder asserts (05).
- Cookie banner, footer link structure, route paths, or SEO meta beyond existing `legalPageMeta`.
- Markdown / rich-text legal bodies — plain strings only.

## Decisions

1. **`body: readonly string[]` (one string per paragraph)**  
   - **Why:** Matches how operators think about legal sections (multiple short paragraphs) and keeps React mapping trivial (`body.map` → `Paragraph`).  
   - **Alternatives:** single `string` with `\n\n` splitting (fragile); markdown (overkill for this feature and would need a new render path).

2. **Keep temporary placeholder prose in `body[0]` this step**  
   - **Why:** Typecheck, Ladle, and existing e2e “page exists / footer links” stay green; content authors replace strings in 02–04.  
   - **Alternatives:** empty `body: []` (would break “at least one paragraph” and look broken in stories).

3. **Stack paragraphs with layout `gap` on a transparent `Surface` (or equivalent HeroUI wrapper already used in `SectionCard` children)**  
   - **Why:** No raw `<p>` / `<div>`; theme owns typography color/size via existing `Paragraph` props (`color="muted"`, `size="sm"` to match today’s single paragraph).  
   - **Alternatives:** join paragraphs into one `Paragraph` (defeats multi-paragraph model).

4. **Capability name `static-marketing-pages` (not a new `static-pages` spec)**  
   - **Why:** Existing OpenSpec capability already owns Legal pages; delta ADDs the body-paragraph requirement there. Step-plan “Spec Delta: static-pages” maps to this capability.

## Risks / Trade-offs

- **[Risk] Call sites still read `section.placeholder`** → Mitigation: grep `apps/web` for legal `placeholder` / `LegalSection` usages; only `LegalPage.tsx` and `legal.ts` are expected hits besides the type.  
- **[Risk] Stories / SEO helpers assume string fields** → Mitigation: `legalPageMeta` uses page-level title/intro, not section placeholder; stories call `getPageContent` and need no copy change.  
- **[Trade-off] Placeholder strings remain user-visible until 02–04** → Acceptable per parent guide; release criteria require real copy before the parent feature is done.

## Migration Plan

1. Change type → migrate `legal.ts` → update `LegalPage` → typecheck.  
2. No DB, env, or deploy migration.  
3. Rollback: revert the four files; no data migration.

## Open Questions

- None for this step. Entity/contact details and counsel review live in the parent guide for steps 02–04.
