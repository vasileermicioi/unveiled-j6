## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/legal-pages-01-content-model-and-ui.md` and parent guide non-goals / release criteria
- [x] 1.2 Confirm prerequisites exist: `types.ts` (`LegalSection`), `legal.ts`, `LegalPage.tsx`, stories, and impressum/privacy/terms routes
- [x] 1.3 Grep `apps/web` for `section.placeholder` / legal `placeholder` usages to list call sites to update

## 2. Content model

- [x] 2.1 Update `LegalSection` in `apps/web/app/lib/content/types.ts` to `{ id, title, body: readonly string[] }`; remove `placeholder`
- [x] 2.2 Migrate every section in `apps/web/app/lib/content/legal.ts` to `body: ["…"]` keeping current placeholder strings temporarily

## 3. LegalPage UI

- [x] 3.1 Update `LegalPage.tsx` to map each `section.body` entry to a HeroUI `Paragraph` (layout gap only; keep muted/sm styling parity)
- [x] 3.2 Fix any remaining `section.placeholder` references under `apps/web`; update Ladle stories only if types break
- [x] 3.3 Run `bun run typecheck` after the rename and fix any fallout

## 4. Verification and handoff

- [x] 4.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 4.2 Manual or Ladle: LegalPage stories show section titles and at least one body paragraph each (placeholder text OK)
- [x] 4.3 Mark step 01 done in `legal-pages-parent-guide.md`; skip product-spec / i18n updates until step 05
