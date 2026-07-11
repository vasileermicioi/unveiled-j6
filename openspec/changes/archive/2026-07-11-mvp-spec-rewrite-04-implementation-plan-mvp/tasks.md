## 1. Setup

- [x] 1.1 Read `docs/product/README.md`, `docs/product/CHARTER.md` Locked decisions §1–6, and `docs/product/testing/bdd-and-e2e.md` (including known coverage gaps)
- [x] 1.2 Skim old `.dev-plan/IMPLEMENTATION-PLAN.md` structure (hard rules, monorepo, Phases 6–9 agent prompts) as a template — do not copy `docs/migration/` paths
- [x] 1.3 Outline phase list: baseline 0–5 (shipped + debt) → Phase 5.5 remediation (UI DS + BDD + sitemap) → Phase 6 payments/booking → Phase 7 waitlist/profile → Phase 8 admin/GDPR/SEO → post-MVP partner appendix

## 2. Write IMPLEMENTATION-PLAN.mvp.md — preamble & foundation

- [x] 2.1 Create `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` with preamble: product SoT = `docs/product/`; planning guide = `openspec_5step_proposals_guide.v2.md`; ignore `openspec/specs/` for behavior; `docs/migration/` + old plan = historical only
- [x] 2.2 Write hard rules: HeroUI-only, theme-only styling, SSR mutations, locale URLs, no radios/checkboxes, `@unveiled/ui` + Theme Overview, BDD proximity selectors citing `docs/product/testing/bdd-and-e2e.md`
- [x] 2.3 Write monorepo layout updated for `docs/product/` and Ladle stories primarily under `packages/ui`
- [x] 2.4 Write role strategy: MVP = ADMIN + USER (+ guest); PARTNER post-MVP; partners table = venues

## 3. Baseline and remediation phases

- [x] 3.1 Summarize Phases 0–5 as shipped baseline (foundation, marketing, auth, onboarding, catalog/admin, testing harness, member discovery) with known debt list — no rebuild agent prompts
- [x] 3.2 Write Phase 5.5 (remediation) with three workstreams and done-when: UI DS consolidation + Theme Overview; BDD remediation + coverage matrix; sitemap/Discover/public-detail alignment
- [x] 3.3 Require Phase 5.5 complete (or explicit deferrals named) before Phase 6 starts

## 4. Remaining MVP phases

- [x] 4.1 Write Phase 6 (Stripe + booking): goal, scope, `docs/product/` docs to read, done-when (Ladle + Playwright), agent prompt, demo script
- [x] 4.2 Write Phase 7 (waitlist + profile/billing): same section shape; `docs/product/` paths only
- [x] 4.3 Write Phase 8 (admin ops + GDPR + SEO polish): member/admin hardening from old Phase 9; exclude partner-only cron/portal; `docs/product/` paths only
- [x] 4.4 Ensure every agent prompt and “docs to read” path uses `docs/product/...` (never `docs/migration/` as SoT)

## 5. Post-MVP appendix and agent how-to

- [x] 5.1 Add post-MVP appendix for partner role / portal / check-in pointing at `docs/product/features/post-mvp/`; `/partner` only appears here
- [x] 5.2 Write “How to run with a new agent” context block pointing at `docs/product/` + this MVP plan (not migration)
- [x] 5.3 Optional: short demo cadence table for remaining MVP weeks (no partner week in MVP)

## 6. Validation and cleanup

- [x] 6.1 Run `test -f .dev-plan/IMPLEMENTATION-PLAN.mvp.md && test -f .dev-plan/IMPLEMENTATION-PLAN.md`
- [x] 6.2 Run `rg -n "docs/product" .dev-plan/IMPLEMENTATION-PLAN.mvp.md | wc -l` — multiple references
- [x] 6.3 Run `rg -n "docs/migration" .dev-plan/IMPLEMENTATION-PLAN.mvp.md` — only historical/superseded mentions, if any
- [x] 6.4 Run `rg -n "Theme Overview|bdd-and-e2e|post-MVP|Phase 5|shipped|@unveiled/ui" .dev-plan/IMPLEMENTATION-PLAN.mvp.md`
- [x] 6.5 Run `rg -n "/partner" .dev-plan/IMPLEMENTATION-PLAN.mvp.md` — only in post-MVP appendix, not as an active MVP phase goal
- [x] 6.6 Skim: a cold agent could start “next MVP phase” without opening `docs/migration/`
- [x] 6.7 Mark step 04 done in `.dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md`
