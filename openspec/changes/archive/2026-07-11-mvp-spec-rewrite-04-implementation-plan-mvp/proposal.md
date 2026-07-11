## Why

Steps 01–03 delivered a complete `docs/product/` tree (charter, foundation, Gherkin, BDD contract), but agents still have no delivery plan that treats Phases 0–5 as shipped, schedules design-system / BDD debt, and points remaining MVP work at `docs/product/` only. The old `.dev-plan/IMPLEMENTATION-PLAN.md` still cites `docs/migration/` and includes partner as Phase 8.

## What Changes

- Create **`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`** beside the old plan (do **not** overwrite `IMPLEMENTATION-PLAN.md`)
- Preamble: product SoT = `docs/product/`; planning guide = `openspec_5step_proposals_guide.v2.md`; ignore `openspec/specs/` for behavior; `docs/migration/` = historical only
- Hard rules: HeroUI-only, theme-only styling, SSR mutations, locale URLs, no radios/checkboxes, `@unveiled/ui` + Theme Overview, BDD proximity selectors (cite `docs/product/testing/bdd-and-e2e.md`)
- Monorepo layout updated: Ladle stories primarily under `packages/ui`; `docs/product/` not `docs/migration/`
- **Baseline (done):** Phases 0–5 summarized as shipped with known debt — do not re-prompt rebuild
- **Debt / remediation phases** (before or interleaved with remaining product work):
  - UI DS consolidation → `packages/ui` + Theme Overview; audit raw HTML / non-theme styling
  - BDD remediation → align e2e with `docs/product/features` + proximity selectors; coverage matrix
  - Sitemap alignment → Discover→Events CTAs and public `/events/:id` if code still drifts
- **Remaining MVP phases** (renumber cleanly): Stripe + booking; waitlist + profile/billing; admin ops + GDPR + SEO polish — **no partner portal phase in MVP**
- **Post-MVP appendix:** partner role, portal, check-in → `docs/product/features/post-mvp/`
- Each remaining phase: goal, scope, docs to read (`docs/product/` only), done-when (Ladle + Playwright per BDD doc), agent prompt, demo script
- Role strategy: MVP = ADMIN + USER (+ guest); PARTNER post-MVP; partners table = venues
- Mark step 04 done in `.dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md`
- Do **not** implement any phase, edit `AGENTS.md` (step 05), or delete migration docs

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `platform-foundation`: ADDED — repository SHALL provide `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` as the delivery plan for remaining MVP work, referencing `docs/product/` as the product specification and treating Phases 0–5 as a shipped baseline with explicit remediation for design-system and BDD debt

## Impact

- **Docs only:** `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` + parent-guide checkbox; old `IMPLEMENTATION-PLAN.md` retained untouched (optional banner deferred to step 05)
- **Consumers:** step 05 (AGENTS/README SoT flip); future agents implementing remaining MVP phases
- **Sources:** `docs/product/` (CHARTER, README, features, testing/bdd-and-e2e, sitemap, UI, schema); old plan as structure reference; charter Locked decisions §1–6
- **Out of scope:** application/Playwright/Ladle code; deleting `docs/migration/` or the old plan; partner portal implementation
