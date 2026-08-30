# Proposal: FAQ content refresh — docs sync & release hardening (step 03)

## Why

Steps 01–02 of the `faq-refresh` feature shipped the new FAQ copy and green e2e, but `docs/product/ui/static-pages-content.md` §FAQ still quotes the old 3 Q&As, still uses the pre-refresh subheadline, and its L80 bullet explicitly forbids the rollover claim that the (decided) new copy now contains. Per AGENTS.md, `docs/product/` is the product source of truth, so shipped behavior, docs, and the decision log currently disagree. This change closes the feature by re-syncing the docs, recording the rollover decision, adding a cheap content-shape guard test, and verifying on staging.

## What Changes

- Rewrite `docs/product/ui/static-pages-content.md` §FAQ to the shipped copy: new subheadline (DE/EN), "11 Q&As" instead of "exactly 3", the full DE/EN item list verbatim from `apps/web/app/lib/content/faq.ts`, and replace the L80 "do not reintroduce rollover claims" bullet with a pointer to the recorded decision (rollover is the approved marketing promise pending engine implementation).
- Add a changelog entry to `docs/product/extras/gaps-and-decisions.md`: FAQ content replaced per `.dev-plan/FAQs.md`; the 2-month rollover promise is deliberate forward copy; the credit-engine rollover + Terms/billing copy alignment is flagged as a separate follow-up feature. `faq.ts` and `AGENTS.md` are **not** edited here (AGENTS.md rule change requires owner direction).
- Add `apps/web/app/lib/content/faq.test.ts` (bun:test): both locales expose 11 non-empty Q&A items and `buildFaqPageJsonLd(items).mainEntity.length === 11`. No external services.
- Update `docs/product/testing/coverage-matrix.md` FAQ row to reflect the refreshed scenario description.
- Staging verification (per `apps/web/DEPLOYMENT.md` ~L1032 checklist): `/de/faq` + `/en/faq` render final copy, `FAQPage` JSON-LD lists the 11 questions, OG/meta unchanged in shape; record results.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `static-marketing-pages`: (a) **Added** requirement "FAQ content guard" — a unit test asserting the FAQ module keeps 11 non-empty Q&As per locale and the JSON-LD builder emits exactly those 11 entities; (b) **Modified** requirement "FAQ page content" — clarifies that the rollover answer is deliberate interim forward copy fulfilled manually by support until a separate follow-up feature ships the credit-engine rollover and aligns Terms/billing copy.

## Impact

- Docs: `static-pages-content.md`, `gaps-and-decisions.md`, `coverage-matrix.md`, `apps/web/DEPLOYMENT.md` (staging notes).
- Tests: one new file `apps/web/app/lib/content/faq.test.ts`; no runtime code changes (`faq.ts` untouched).
- No DB, auth, API, or dependency changes. No user-visible behavior changes — this aligns documentation and adds a CI guard.

**Resolved discrepancy (explicit):** the step plan (`faq-refresh-03-docs-sync-hardening.md`) says "12 Q&As", but the approved source copy `.dev-plan/FAQs.md` and the shipped `faq.ts` (steps 01–02, merged) both contain **11** items per locale, and the canonical spec already records 11. All artifacts in this change therefore use 11.
