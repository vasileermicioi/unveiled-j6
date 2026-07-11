# MVP product-spec rewrite — Acceptance

Closes the `mvp-spec-rewrite` feature (steps 01–05). After sign-off, agents implement remaining work from **`docs/product/`** + [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](../../.dev-plan/IMPLEMENTATION-PLAN.mvp.md) only.

## Release criteria

Mirror of [`.dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md`](../../.dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md):

- [x] All five steps are marked **done** in the parent guide.
- [x] `docs/product/` exists as a complete tree (README + CHARTER + product + features + ui + database + sitemap + extras + testing) sufficient to build the MVP.
- [x] `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` exists and references `docs/product/` as product SoT.
- [x] MVP personas are **guest, member (`USER`), admin (`ADMIN`)**; **partner is post-MVP** in the new docs/plan.
- [x] Sitemap specifies Discover→Events navigation and **public** `/events/:id` (SEO/share).
- [x] UI docs mandate `@unveiled/ui` as the Ladle design-system home, HeroUI-only + Uber yellow/no-radius theme, and a Theme Overview story.
- [x] BDD docs require Gherkin scenarios ↔ Playwright titles and proximity/layout selectors only.
- [x] Superseded trees (`docs/migration/`, old `IMPLEMENTATION-PLAN.md`, v1 proposals guide) removed; live pointers updated.

## Verification commands

```bash
rg -n "docs/product|IMPLEMENTATION-PLAN.mvp" AGENTS.md
rg -n "active|source of truth|SoT" docs/product/README.md
test -f docs/product/ACCEPTANCE.md
test -f .dev-plan/IMPLEMENTATION-PLAN.mvp.md
test -f .dev-plan/openspec_5step_proposals_guide.v2.md
test ! -d docs/migration
test ! -f .dev-plan/IMPLEMENTATION-PLAN.md
test ! -f .dev-plan/openspec_5step_proposals_guide.md
rg -n "\[x\]|done|complete" .dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md
```

### Prior steps (sanity — artifacts still present)

```bash
test -f docs/product/CHARTER.md
test -f docs/product/product/vision-and-domains.md
test -f docs/product/sitemap/sitemap.md
test -f docs/product/ui/design-system.md
test -f docs/product/database/schema-overview.md
test -f docs/product/features/event-discovery.feature
test -f docs/product/testing/bdd-and-e2e.md
test -d docs/product/features/post-mvp
rg -n "docs/product" .dev-plan/IMPLEMENTATION-PLAN.mvp.md
```

## Cold-read test

From **`AGENTS.md` alone**, a new agent must find:

1. Product SoT → `docs/product/`
2. Active delivery plan → `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`
3. No reliance on `docs/migration/` or the old implementation plan

## Hand-off

Next implementation work follows [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](../../.dev-plan/IMPLEMENTATION-PLAN.mvp.md) — start at **Phase 5.5** (remediation) before Phase 6 (Stripe + booking). Do **not** treat this acceptance file as permission to skip remediation.

## Sign-off

| Field | Value |
|---|---|
| Date | 2026-07-11 |
| Agent / human | Cursor agent |
| Notes | Spec rewrite closed; superseded trees removed; pointers scrubbed to `docs/product/` + MVP plan + guide v2. |
