## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/legal-pages-05-hardening-and-docs.md`, parent guide release criteria, and this change’s proposal/design/specs
- [x] 1.2 Confirm prerequisites exist: complete `legal.ts` (impressum/privacy/terms DE+EN), `e2e/specs/static-pages.spec.ts` legal scenario, `static-pages.feature`, `static-pages-content.md`, `content-i18n-inventory.md`, coverage-matrix legal row
- [x] 1.3 Confirm `rg -n "Platzhalter|pending legal review" apps/web/app/lib/content/legal.ts` has zero matches (fix narrowly only if unexpected leftovers appear)

## 2. E2E and Gherkin

- [x] 2.1 Extend `e2e/specs/static-pages.spec.ts` scenario “Legal pages exist and are linked from the footer”: keep footer LEGAL links + H1; add distinctive locale-tolerant body asserts per page (Impressum address, Privacy Stripe/rights, Terms Credits + no-rollover); assert page text has no `Platzhalter` or `pending legal review` (proximity/role selectors only)
- [x] 2.2 Align `docs/product/features/static-pages.feature` Then steps for that scenario to require non-placeholder body sections in the selected language; keep scenario title stable

## 3. Product docs and inventory

- [x] 3.1 Add a short **Legal pages** subsection to `docs/product/ui/static-pages-content.md` (routes, `apps/web/app/lib/content/legal.ts`, `body: string[]` model, operational copy pending formal legal review, Terms credits no-rollover)
- [x] 3.2 Index legal page titles DE/EN and point at `legal.ts` in `docs/product/extras/content-i18n-inventory.md` (do not dump full prose)
- [x] 3.3 Touch `docs/product/testing/coverage-matrix.md` legal row notes only if body assertions should be tracked; keep scenario title mapping intact

## 4. Stories and parent close-out

- [x] 4.1 Verify Ladle `LegalPage` stories still render; edit only if they still show placeholder fixtures
- [x] 4.2 Mark all five child steps done in `.dev-plan/current-iteration/legal-pages-parent-guide.md` and walk parent **Release Criteria**

## 5. Verification

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Re-run `rg -n "Platzhalter|pending legal review" apps/web/app/lib/content/legal.ts` (no matches)
- [x] 5.3 Targeted e2e when env allows: `bun run test:e2e -- static-pages` (or project-equivalent filter) — legal scenario passes; otherwise document skip reason with assertions committed
- [x] 5.4 Spot-check DE + EN for `/impressum`, `/privacy`, `/terms` in local `bun run dev` when available
