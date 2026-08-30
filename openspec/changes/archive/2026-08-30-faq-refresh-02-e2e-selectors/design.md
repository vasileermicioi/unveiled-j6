# Design: faq-refresh-02-e2e-selectors

## Context

See `proposal.md` for motivation. Current state:

- Step 01 shipped: `apps/web/app/lib/content/faq.ts` now holds **11** Q&As per locale (DE + EN); items 1–2 are "Wie funktioniert die unveiled Mitgliedschaft?" / "How does the unveiled membership work?" and "Wofür kann ich meine Credits nutzen?" / "What can I use my Credits for?". The step plan said 12; the frozen copy is 11 — selectors below match the shipped file, not the plan draft.
- `e2e/specs/static-pages.spec.ts:164-187` `test("Scenario: FAQ", …)` targets the old copy at lines 175–186 (`/wie buche ich|how does booking/i`, `/was passiert nach|what do i receive after/i`, answer `/einlasscode|promo-code|my tickets|meine tickets/i`) and lacks an explicit negative single-expand assertion.
- The scenario uses the `locale` fixture (`e2e/fixtures/base.ts`, option, default `de`), so it navigates `/${locale}/faq` and the bilingual alternation regexes cover DE + EN shipped copy in one run — the established pattern in this file (config has a single `chromium` project). `e2e/playwright.config.ts` manages the SSR server via `webServer` (`bun run dev`, reused if already healthy).
- Selector contract (`docs/product/testing/bdd-and-e2e.md`): role + accessible-name / visible-text proximity only; no CSS-class coupling. `docs/product/features/static-pages.feature` L51–55 asserts FAQ structure, not copy — no feature-file change.

## Goals / Non-Goals

**Goals:**
- Green `Scenario: FAQ` (bilingual DE+EN assertions) against shipped copy, still proving single-expand behavior.
- Green whole `static-pages` file (catches any missed coupling).
- Zero changes outside the one test block.

**Non-Goals:**
- Per-Q&A test coverage for all 11 items (structure + 2 representative items is the established pattern).
- Content, component, theme, or feature-file changes; test-framework changes.

## Decisions

1. **Bilingual regex alternation on `getByRole("button", { name })`, same as existing pattern.**
   - `firstQuestion`: `/wie funktioniert die unveiled mitgliedschaft|how does the unveiled membership/i`
   - `secondQuestion`: `/wofür kann ich meine credits|what can i use my credits/i`
   - Alternative considered: locale-split tests (e.g., `test.use({ locale: "en" })` variants) — rejected; the bilingual-alternation pattern is established in this file and keeps the scenario DRY without touching fixtures/config.
2. **Answer-text assertions via `getByText(...).first()` with short distinctive fragments** (not full paragraphs, so copy tweaks don't break tests):
   - item 2 open: `/community|partner venues|kulturelle Erlebnisse/i` — present in both DE and EN answers of item 2.
   - item 1 collapsed (new negative assertion): `await expect(page.getByText(/jeden Monat erhältst du|every month, you receive/i).first()).toBeHidden();` — the opening phrase unique to item 1's answer. This makes the single-expand guarantee explicit instead of implied.
   - Alternative considered: HeroUI accordion expanded-state attributes — rejected as CSS/DOM-structure coupling, forbidden by the selector contract.
3. **Keep the three unchanged header assertions** (eyebrow `/^support$/i`, H1 `/^faq$|^häufig gestellte fragen$/i`, support-email link) and the scenario title `Scenario: FAQ`.
4. **Uniqueness check on fragments**: `/community/i` appears in item 1's answer too, but the item-2 assertion runs only after item 2 is clicked while item 1 is collapsed, and `.first()` + `toBeVisible` still holds; the item-1 fragment (`jeden Monat erhältst du` / `every month, you receive`) is unique to item 1, making the hidden assertion unambiguous.

## Risks / Trade-offs

- [Copy drift: future FAQ edits change question phrasing → selectors break] → Fragments are short and distinctive; the scenario fails loudly with a clear name; re-aim in the next refresh step (this is the accepted per-refresh cost).
- [`getByText(/community/i)` could match stray UI text (e.g., footer) and mask a false pass] → Mitigated by pairing it with the negative item-1 assertion; if flaky, narrow to `/partner venues|partner-venues/i` at implementation time.
- [Whole-file suite reveals other couplings to old copy] → Grep confirmed only `static-pages.spec.ts:175-186` references FAQ answers; footer/nav selectors (`:72`, `:169`) target unchanged shell copy. Run the whole file in validation to catch misses.

## Migration Plan

Single-file test change; no deploy/migration concern. Rollback = revert the one commit. Verification requires local `bun run dev` serving the app with `.env` pointed at local/preview infra (no external cloud dependency for this route).
