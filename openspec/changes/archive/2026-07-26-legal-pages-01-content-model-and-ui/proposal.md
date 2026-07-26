## Why

Legal routes already render `LegalPage`, but every section stores a single `placeholder` string — a content-model dead end for real multi-paragraph Impressum / Privacy / Terms copy. This first Legal Pages slice upgrades the shared section shape and renderer so steps 02–04 can land bilingual body copy without further UI work.

## What Changes

- **BREAKING (content types):** `LegalSection` changes from `{ id, title, placeholder }` to `{ id, title, body: readonly string[] }` (one string per paragraph).
- Migrate all existing sections in `apps/web/app/lib/content/legal.ts` to temporary `body: [string]` using current placeholder text so typecheck and Ladle stay green.
- Update `LegalPage` to map each `section.body` entry to a HeroUI `Paragraph` (stack with layout gap only; no raw `<p>`).
- Fix any `section.placeholder` call sites under `apps/web` (stories already use `getPageContent` and should only need type-driven updates if any).
- OpenSpec delta on `static-marketing-pages` for legal section body paragraphs; final legal prose, product docs, and e2e hardening stay in later steps.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `static-marketing-pages`: Legal sections render a title plus one or more body paragraphs from localized content modules; content model no longer uses a `placeholder` field.

## Impact

- **Types:** `apps/web/app/lib/content/types.ts` — `LegalSection.body`.
- **Content:** `apps/web/app/lib/content/legal.ts` — all DE/EN impressum/privacy/terms sections.
- **UI:** `apps/web/app/components/marketing/LegalPage.tsx` (+ stories only if types break).
- **Unchanged this step:** final Impressum / Privacy / Terms wording (02–04); product docs / e2e hardening (05); cookie banner; footer links; routes; SEO meta shape.
- **Source brief:** `.dev-plan/current-iteration/legal-pages-01-content-model-and-ui.md`
- **Parent:** `.dev-plan/current-iteration/legal-pages-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `legal-pages-02-impressum-content`, `legal-pages-03-privacy-content`, `legal-pages-04-terms-content`
- **Verification:** `bun run lint`; `bun run typecheck`; Ladle LegalPage stories show section titles and body paragraphs (placeholder text OK until 02–04)
