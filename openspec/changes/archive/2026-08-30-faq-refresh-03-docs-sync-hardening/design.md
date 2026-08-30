# Design: FAQ docs sync & release hardening (step 03)

## Context

See `proposal.md` — Why. Current state after steps 01–02:

- `apps/web/app/lib/content/faq.ts` ships the final copy: 11 Q&As per locale (DE + EN), new subheadline, rollover promise included.
- `apps/web/app/lib/seo.ts:225` exposes `buildFaqPageJsonLd(items: readonly FaqItem[])`, used by `apps/web/app/routes/[locale]/faq.tsx`.
- `docs/product/ui/static-pages-content.md` §FAQ (L85–112) is stale: old subheadline, "exactly 3 Q&As" with the old 3 items; L80 forbids rollover claims.
- `docs/product/extras/gaps-and-decisions.md` has no entry for the FAQ refresh / rollover decision.
- `docs/product/testing/coverage-matrix.md:284` FAQ row references the pre-refresh scenario.
- Owner decision (parent guide): the rollover promise stands; engine + Terms/billing alignment ships later as a separate follow-up parent feature. AGENTS.md's "credits do NOT roll over" rule is **not** edited in this change (owner direction required).

Note: the canonical `openspec/specs/static-marketing-pages/spec.md` already records 11 Q&As; the step plan's "12" was a stale count (verified against `.dev-plan/FAQs.md` and shipped `faq.ts`, both 11). All artifacts use 11.

## Goals / Non-Goals

**Goals:**
- Shipped behavior, `docs/product/` SoT, decision log, and spec agree on the FAQ (including the rollover promise and its interim status).
- A zero-dependency guard test fails CI if FAQ item count/shape drifts.
- Staging verification evidence recorded in `apps/web/DEPLOYMENT.md`.

**Non-Goals:**
- No changes to `faq.ts`, `seo.ts`, routes, or any runtime code.
- No Terms/billing copy edits (`legal.ts`, `billing-content.ts`) — follow-up feature.
- No AGENTS.md edits, no `content-i18n-inventory.md` rollover rewording, no credit-engine work, no further e2e expansion (step 02 covers it).

## Decisions

1. **Single new test file `apps/web/app/lib/content/faq.test.ts` (bun:test)** instead of extending an existing suite: keeps the guard discoverable next to the module it protects; follows the repo's colocated `*.test.ts` convention for content modules. Asserts per locale: `items.length === 11`, every `question`/`answer` non-empty (trim), and `buildFaqPageJsonLd(items).mainEntity.length === 11`. Imports only `./faq` and `../seo` — no DB/network, so `bun test apps/web` stays cloud-free. Alternative considered: a snapshot test — rejected because snapshots churn on legitimate copy edits and would be routinely accepted-over, defeating the drift guard.

2. **Docs sync is verbatim, not paraphrased**: copy the 11 DE/EN Q&As out of `faq.ts` into `static-pages-content.md` §FAQ (hard rule §5: spec copy verbatim). The old "exactly 3" list and the stale subheadline are replaced wholesale; the L80 prohibition bullet becomes a pointer: rollover is the approved marketing promise, decision recorded in `gaps-and-decisions.md`, engine work tracked as follow-up. Alternative: link to `faq.ts` as source — rejected; `static-pages-content.md` is the copy SoT and other sections quote copy inline.

3. **Decision log entry lives in the "App shell & content" area of `gaps-and-decisions.md`** (append to the changelog following existing section/voice), one entry covering: FAQ replaced per `.dev-plan/FAQs.md`; rollover = deliberate forward promise; follow-up parent feature files credit-engine rollover + Terms/billing alignment; AGENTS.md rule pending owner-directed update when that ships.

4. **Coverage-matrix edit is minimal**: update only the FAQ row's notes to mention the refreshed 11-Q&A scenario and the new unit guard (`faq.test.ts`), keeping table structure/voice.

5. **Staging verification recorded under the existing `DEPLOYMENT.md` public-routes checklist (~L1032)** rather than a new section: `/de/faq` + `/en/faq` render final copy; view-source `FAQPage` JSON-LD has 11 `mainEntity` entries of type `Question`; OG/meta unchanged in shape; layout (hero, card, accordion) identical to pre-change.

## Risks / Trade-offs

- [FAQ promise ≠ engine behavior (users expect rollover; ledger resets to 17 on renewal)] → Deliberate, owner-decided interim state; documented in `gaps-and-decisions.md` + spec; support fulfills manually; follow-up feature closes the gap. Do not "fix" by softening FAQ copy.
- [Future implementer reads L80's removed prohibition and reintroduces anti-rollover edits] → The replacement bullet explicitly names the decision and its location; spec MODIFIED requirement encodes the forward-copy intent.
- [Guard test count (11) drifts from step plan text (12)] → Resolved: shipped copy and `FAQs.md` are both 11; proposal documents the discrepancy so nobody "adds" a 12th item to satisfy the stale number.
- [Verbatim doc sync introduces transcription errors across 22 bilingual strings] → Mitigated by copying directly from `faq.ts` and spot-checking against the JSON-LD in staging page source.

## Migration Plan

Docs + test only: deploy as-is, no data/migration concerns. Rollback = revert commit(s). Staging verification is part of the deploy step; if a check fails, fix forward before marking step 03 done.

## Open Questions

- (none blocking) Follow-up parent feature id for credit-engine rollover + Terms/billing alignment will be chosen when that iteration is planned; `gaps-and-decisions.md` references it by description.
