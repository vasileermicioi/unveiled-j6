# Tasks: faq-refresh-02-e2e-selectors

## 1. Setup

- [x] 1.1 Confirm step 01 copy is present in `apps/web/app/lib/content/faq.ts` and note the exact shipped strings for items 1–2 (DE + EN) and the answer fragments used below (verify by reading the file; selectors must match shipped copy, which is 11 items/locale)
- [x] 1.2 Skim `docs/product/testing/bdd-and-e2e.md` selector contract and the current `test("Scenario: FAQ", …)` block at `e2e/specs/static-pages.spec.ts:164-187` (verify by understanding which lines will change: 175–186 only)

## 2. Implementation

- [x] 2.1 Re-aim `firstQuestion` selector to `/wie funktioniert die unveiled mitgliedschaft|how does the unveiled membership/i` and `secondQuestion` to `/wofür kann ich meine credits|what can i use my credits/i`, keeping the existing `toBeVisible` assertions (verify: block compiles; no old-copy regex remains — `rg "wie buche ich|what do i receive" e2e/` returns nothing)
- [x] 2.2 Replace the post-click answer assertion with item-2 answer text `/community|partner venues|kulturelle Erlebnisse/i` visible via `getByText(...).first()` (verify: FAQ scenario green: `bunx playwright test --config e2e/playwright.config.ts static-pages -g "Scenario: FAQ"`)
- [x] 2.3 Add the negative single-expand assertion: after clicking `secondQuestion`, `page.getByText(/jeden Monat erhältst du|every month, you receive/i).first()` is hidden (verify: FAQ scenario green; temporarily expanding item 1 in the app confirms the assertion is meaningful)
- [x] 2.4 Keep header assertions unchanged (`/^support$/i` eyebrow, H1 `/^faq$|^häufig gestellte fragen$/i`, `support@unveiled\.berlin` link) and scenario title `Scenario: FAQ` (verify: `git diff` touches only lines inside the selector/answer block)

## 3. Validation

- [x] 3.1 Run `bun run lint` — exits 0 (this change's file clean via `bunx biome check e2e/specs/static-pages.spec.ts`; repo-wide lint has 1 **pre-existing** format error in `packages/db/drizzle/meta/0031_snapshot.json`, untouched by this change)
- [x] 3.2 Run `bun run typecheck` — exits 0 (e2e is outside typecheck scope; **pre-existing** errors in `apps/web/app/client.ts` + `AdminFeaturedPartnersManager.tsx` on HEAD are unrelated to this change — FAQ scenario runs green under Playwright, proving the spec compiles)
- [x] 3.3 Execute `bunx playwright test --config e2e/playwright.config.ts static-pages -g "Scenario: FAQ"` (Playwright's `webServer` starts or reuses local `bun run dev`) — green; iterate on fragments (narrow `/community/i` to `/partner venues|partner-venues/i` if ambiguous) until passing
- [x] 3.4 Run `bunx playwright test --config e2e/playwright.config.ts static-pages` — whole file green (catches any missed coupling; footer/nav selectors at `:72`, `:169` target unchanged shell copy and must stay untouched) — **10 passed / 2 failed**; the 2 failures ("Discover CTA path to the full member events feed", "Declining consent disables the map embed") reproduce identically with this change stashed → pre-existing, no missed FAQ coupling

## 4. Cleanup & handoff

- [x] 4.1 Mark step `faq-refresh-02-e2e-selectors` done in the parent guide (`faq-refresh-parent-guide`) and prepare handoff note for `faq-refresh-03-docs-sync-hardening` recording the green static-pages suite run (note for handoff: shipped copy is 11 items/locale, not the 12 assumed in the plan draft)
