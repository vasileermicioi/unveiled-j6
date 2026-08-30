# Proposal: faq-refresh-02-e2e-selectors

## Why

Step 01 (`faq-refresh-01-content-module`) replaced the old 3-Q&A FAQ copy with the refreshed question set in `apps/web/app/lib/content/faq.ts`. The `Scenario: FAQ` test in `e2e/specs/static-pages.spec.ts:175-186` still asserts the pre-refresh copy ("Wie buche ich…", "How does booking work?"…), so the e2e baseline is red until selectors are re-aimed at the shipped questions and answers.

## What Changes

- Rewrite the question/answer selectors in `e2e/specs/static-pages.spec.ts` `test("Scenario: FAQ", …)` only:
  - `firstQuestion` button name → `/wie funktioniert die unveiled mitgliedschaft|how does the unveiled membership/i` (shipped item 1).
  - `secondQuestion` button name → `/wofür kann ich meine credits|what can i use my credits/i` (shipped item 2).
  - After clicking `secondQuestion`: assert item-2 answer text (`/community|partner venues|kulturelle Erlebnisse/i`) is visible **and** add the single-expand negative assertion that item-1 answer text (`/jeden Monat erhältst du|every month, you receive/i`) is **not** visible.
  - Keep unchanged: `support` eyebrow, H1 `/^faq$|^häufig gestellte fragen$/i`, support-email link assertions.
- No UI, content, theme, or feature-file changes. No new test scenarios (structure + two representative items remains the established pattern). Footer/nav selectors elsewhere in the file target unchanged shell copy and stay as-is.
- Note: the step plan (written pre-copy-freeze) said "12 items/locale"; the shipped copy from step 01 has **11 items per locale** in both DE and EN. Artifacts here reflect the shipped copy.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `static-marketing-pages`: REQUIREMENT "Automated browser coverage for static pages" — the FAQ e2e coverage obligation is updated to name the refreshed-copy assertions explicitly: support header (eyebrow, H1, support-email link), two representative questions from the refreshed Q&A set, and single-expand accordion behavior (opening item 2 collapses item 1), using role/proximity selectors only. The `FAQ page content` requirement itself is unchanged (already synced by step 01).

## Impact

- Affected file: `e2e/specs/static-pages.spec.ts` (single test block; no new files).
- Depends on: `faq-refresh-01-content-module` (merged to working tree; copy source of truth is `apps/web/app/lib/content/faq.ts`).
- Consumed by: `faq-refresh-03-docs-sync-hardening` (runs the full static-pages suite during staging verification).
- Conventions: `docs/product/testing/bdd-and-e2e.md` — proximity/role/text selectors only, no CSS-class coupling.
- Verification commands: `bun run lint`, `bun run typecheck`, `bunx playwright test --config e2e/playwright.config.ts static-pages -g "Scenario: FAQ"` (default `de` locale run; bilingual selectors cover shipped en copy), then the whole `static-pages` file green.
