# Tasks: FAQ docs sync & release hardening (step 03)

## 1. Setup — confirm prerequisites

- [x] 1.1 Verify steps 01–02 are merged: confirm shipped `apps/web/app/lib/content/faq.ts` contains 11 Q&As per locale with the new subheadline and rollover item, and `e2e` FAQ specs pass locally (`bunx playwright test --config e2e/playwright.config.ts static-pages`) — 10 passed / 2 failed; both failures are the pre-existing non-FAQ ones recorded in the parent-guide handoff
- [x] 1.2 Re-read the parent-guide rollover decision (promise stands; engine deferred to follow-up feature) and confirm the branch is created off latest `main`

## 2. Content guard test

- [x] 2.1 Create `apps/web/app/lib/content/faq.test.ts` (bun:test, colocated like `apps/web/app/lib/*.test.ts`): import `faqContent` from `./faq` and `buildFaqPageJsonLd` from `../seo`; assert for each locale (`de`, `en`) that `section.items.length === 11` and every item has a non-empty trimmed `question` and `answer`; assert `buildFaqPageJsonLd(items).mainEntity.length === 11` for both locales. No external services/DB
- [x] 2.2 Verify `bun test apps/web/app/lib/content/faq.test.ts` passes, and that deliberately changing an item count or emptying a question makes it fail (then revert)

## 3. Docs sync (static-pages-content.md)

- [x] 3.1 Rewrite `docs/product/ui/static-pages-content.md` §FAQ (L85–112): update subheadline bullet to the shipped DE/EN copy ("Alles Wichtige zu Mitgliedschaft, Credits, Buchung und Storno an einem Ort." / "Everything important about membership, credits, booking, and cancellation in one place."), replace "exactly 3 Q&As" with the 11-item list, and quote all 11 DE/EN Q&As verbatim from `faq.ts`
- [x] 3.2 Replace the L80 bullet ("Terms state that unused credits do not roll over. Do not reintroduce rollover claims…") with a pointer: rollover in the FAQ is the approved marketing promise pending credit-engine implementation; see the decision entry in `gaps-and-decisions.md`
- [x] 3.3 Verify every quoted string in §FAQ byte-matches `faq.ts` (spot-check DE + EN, incl. typographic apostrophes) and §FAQ still preserves the section's existing structure/voice

## 4. Decision log (gaps-and-decisions.md)

- [x] 4.1 Add one changelog entry (in the existing section style, e.g. under "App shell & content"): FAQ content replaced per `.dev-plan/FAQs.md` (11 Q&As/locale); 2-month Credits rollover recorded as a deliberate forward promise; credit-engine rollover + Terms/billing copy alignment deferred to a separate follow-up parent feature; AGENTS.md "credits do NOT roll over" rule to be updated only by owner direction when that feature ships
- [x] 4.2 Verify the entry mentions the interim inconsistency against Terms (`legal.ts`), billing copy (`billing-content.ts`), `content-i18n-inventory.md`, and `credits-subscription.feature` renewal-resets-to-17 behavior, without editing any of them

## 5. Coverage matrix

- [x] 5.1 Update the FAQ row (~L284) in `docs/product/testing/coverage-matrix.md` to reference the refreshed 11-Q&A scenario and the new `faq.test.ts` guard; keep table structure/voice unchanged

## 6. Validation

- [x] 6.1 Run `bun test apps/web` — all suites incl. `faq.test.ts` pass (no cloud services) — 292 pass / 4 fail; the 4 failures reproduce with `faq.test.ts` removed (pre-existing order/env coupling in gallery + auth/onboarding middleware suites); both FAQ guard tests pass
- [x] 6.2 Run `bun run lint` and `bun run typecheck` — exit 0 — NOT achievable on this tree: only the pre-existing failures documented in the step-02 handoff (`0031_snapshot.json` format error; `client.ts`/`AdminFeaturedPartnersManager.tsx` type errors); new `faq.test.ts` is biome- and tsc-clean
- [x] 6.3 Run `bunx playwright test --config e2e/playwright.config.ts static-pages` — green — 10 passed / 2 failed = the two known pre-existing failures (Discover CTA, consent-decline map), identical to step-02 baseline; `Scenario: FAQ` re-confirmed green after docs/test changes

## 7. Staging verification & close-out

- [x] 7.1 Deploy to staging; verify `/de/faq` and `/en/faq` render the final copy; view page source: `FAQPage` JSON-LD `mainEntity` lists the 11 questions of type `Question`; OG/meta unchanged in shape; layout (hero, card, accordion) identical to pre-change — DONE against local SSR (dev server): 11 `Question` entries per locale, rollover item present, OG/meta shape unchanged, old 3-Q copy absent, FAQ e2e layout assertions green. **Staging deploy is a human step** (credentials/CI); re-run this checklist there
- [x] 7.2 Record the `/faq` checklist results (both locales) in `apps/web/DEPLOYMENT.md` staging checklist (~L1032)
- [x] 7.3 Prepare handoff linking this change and the `faq-refresh` parent guide; mark step 03 done and parent-guide status shipped; note the follow-up parent feature (credit-engine rollover + Terms/billing copy alignment) so the promise is fulfilled in a later iteration — parent guide set to "ready-to-ship" (staging re-check is the sole open gate); step-03 plan file checkboxes updated; follow-up feature noted in handoff + decision log
