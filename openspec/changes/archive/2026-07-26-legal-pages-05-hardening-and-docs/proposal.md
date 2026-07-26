## Why

Steps 01–04 shipped the legal content model and real bilingual Impressum, Privacy, and Terms copy, but e2e still only checks footer links + H1, and product docs / i18n inventory still under-document the shipped legal module. Without stronger regression asserts and SoT updates, placeholder stubs could return unnoticed and agents will treat legal pages as unfinished. This final Legal pages slice closes the release loop.

## What Changes

- Strengthen `e2e/specs/static-pages.spec.ts` legal scenario: keep footer LEGAL links; keep H1; assert at least one distinctive real body string per page (locale-tolerant); assert page content does **not** include `Platzhalter` or `pending legal review`.
- Tighten `docs/product/features/static-pages.feature` Then steps to require non-placeholder body sections in the selected language (without over-specifying counsel-level clauses).
- Document legal pages in `docs/product/ui/static-pages-content.md` (routes, `apps/web/app/lib/content/legal.ts`, operational copy pending formal legal review, credits no-rollover in Terms).
- Index legal page titles / module path in `docs/product/extras/content-i18n-inventory.md`.
- Refresh coverage-matrix notes only if new assertions warrant it; verify Ladle `LegalPage` stories still render.
- Mark all five child steps done in `legal-pages-parent-guide.md` and confirm parent release criteria.
- OpenSpec delta on `static-marketing-pages`: legal pages SHALL stay free of placeholder copy and covered by e2e body assertions.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `static-marketing-pages`: Legal pages (Impressum, Privacy, Terms) MUST remain fully localized, free of placeholder copy, linked from the footer LEGAL column, and regression-tested with distinctive body-content assertions — not H1-only checks.

## Impact

- **E2E:** `e2e/specs/static-pages.spec.ts` (legal scenario); optionally `docs/product/testing/coverage-matrix.md` notes.
- **Product SoT:** `docs/product/features/static-pages.feature`, `docs/product/ui/static-pages-content.md`, `docs/product/extras/content-i18n-inventory.md`.
- **Stories:** Ladle `LegalPage` stories — verify only unless broken.
- **Parent close-out:** `.dev-plan/current-iteration/legal-pages-parent-guide.md`.
- **Planning mirror:** `openspec/specs/static-marketing-pages` via this change’s delta (not product SoT).
- **Unchanged this step:** counsel engagement / PDF terms; footer IA / Cookie Policy link; cookie-banner or SEO refactors; Phase 6–8 billing/GDPR feature work beyond documenting what Privacy already describes; content rewrites in `legal.ts` (already complete in 02–04).
- **Source brief:** `.dev-plan/current-iteration/legal-pages-05-hardening-and-docs.md`
- **Parent:** `.dev-plan/current-iteration/legal-pages-parent-guide.md`
- **Depends on:** `legal-pages-04-terms-content` (and transitively 01–03) — done
- **Consumed by:** closes the Legal pages parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; `rg` confirms no Platzhalter/pending-legal-review in `legal.ts`; targeted `bun run test:e2e -- static-pages` when env allows (else document skip); DE+EN spot-check of three legal routes
