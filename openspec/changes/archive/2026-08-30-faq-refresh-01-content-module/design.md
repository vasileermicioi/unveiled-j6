# Design: faq-refresh-01-content-module

## Context

See `proposal.md` for motivation. Current state:

- `apps/web/app/lib/content/faq.ts` exports `faqContent: LocalizedContent<FaqContent>` with 3 DE + 3 EN items and per-locale hero/section chrome strings.
- `FaqItem` (`apps/web/app/lib/content/types.ts:94–97`) is `{ question: string; answer: string }` — answers are plain strings; `FaqContent` (`types.ts:99–111`) fixes the module shape. **types.ts and content/index.ts must not be modified.**
- The route `apps/web/app/routes/[locale]/faq.tsx` reads `getPageContent(locale, "faq")` and derives both the visible page (`FaqPage` → `HelpSection` → `FaqAccordion`) and the `FAQPage` JSON-LD (`buildFaqPageJsonLd(content.section.items)`) from the same `section.items` array — SEO wiring needs no touch.
- `.dev-plan/FAQs.md` is the EN copy source of truth (AGENTS.md hard rule 5: verbatim); DE translation is provided in the step plan `.dev-plan/current-iteration/faq-refresh-01-content-module.md`.

## Goals / Non-Goals

**Goals:**
- Single-file copy swap (`faq.ts`) rendering 11 localized Q&As per locale with identical markup, types, and behavior.
- JSON-LD stays in lockstep with visible content by construction (same source array).
- `bun run typecheck`, `bun run lint`, `bun test apps/web` stay green.

**Non-Goals (design-level):**
- No component, route, theme, or `copy.ts` edits (parent-guide non-goal).
- No e2e selector updates (`faq-refresh-02`) and no canonical doc updates (`faq-refresh-03`) — this change deliberately ships with known-red FAQ e2e selectors between step merges; 01 and 02 merge back-to-back.
- No credit-engine/rollover implementation; item 4 copy is a recorded forward promise.

## Decisions

1. **Content module in place of any CMS/table approach.** The step plan mandates editing `faq.ts` only. Alternative (DB-backed FAQ) rejected: out of scope, adds admin surface not in MVP.
2. **Item order = FAQs.md document order (1–11), with the bold "cancel too late or don't show up" sub-question split into item 6** (right after the cancel question it qualifies), yielding 11 items; the step plan's "12" was a heading miscount, confirmed with owner 2026-08-30. Alternative (keep it merged into item 5's answer) rejected: parent guide decided it ships as its own accordion item; plain-string answers make a two-topic item worse for scannability and JSON-LD granularity.
3. **Mailto flattened to plain text.** `FaqItem.answer` is a plain string rendered directly by `FaqAccordion`; embedding markup would either leak raw markdown or require a component/type change (forbidden). The clickable support link already exists in `HelpSection`'s `Card.Description`.
4. **EN copy verbatim; DE copy from step plan, single-paragraph answers.** Where FAQs.md splits a Q's answer across paragraphs, the module joins them into one string with a single space (matches existing 3-item style). Typographic style (em dashes, curly quotes) follows the current DE copy per the step-plan convention.
5. **Hero subheadline updated; all other chrome untouched.** Eyebrows/headlines/section strings are locale-stable labels also referenced by tests/docs; only `subheadline` describes topics and must change (values fixed in the step plan).
6. **Delta written as ADDED, not MODIFIED.** `openspec/specs/static-marketing-pages/spec.md` has no existing "FAQ page content" requirement to copy/modify; the 3-item content was never spec'd. Archive therefore appends a clean new requirement without losing anything.

## Risks / Trade-offs

- [E2E red between steps] `e2e/specs/static-pages.spec.ts:175–186` selects FAQ items by old question text → accepted; mitigated by back-to-back merge of 01 and 02 (parent guide). Do not patch e2e in this step.
- [DE copy unreviewed] DE items are machine-assisted translations of EN-only FAQs.md → flagged in parent guide for native review before launch; step ships as planned.
- [Rollover promise precedes engine] Item 4 advertises 2-month rollover the ledger does not yet implement → owner-approved decision (2026-08-30); support fulfills manually until the follow-up iteration. No sanitization allowed in this step.
- [Stale docs] `static-pages-content.md` §FAQ no longer matches shipped copy → explicitly deferred to step 03; note added at handoff instead of editing docs here.
- [Verbatim-copy drift] typos/curly-quote normalization differences vs `.dev-plan/FAQs.md` → mitigation: diff EN items against FAQs.md during validation.

## Migration Plan

Deploy: normal staging deploy, no env/migration steps (static module). Rollback: revert the single `faq.ts` commit. Sequencing: merge 01 immediately followed by 02 before running the full e2e gate.
