# docs/product — Unveiled Berlin product specification

**Active source of truth (SoT)** for Unveiled Berlin MVP product behavior. Implement remaining work from **`docs/product/`** + [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](../../.dev-plan/IMPLEMENTATION-PLAN.mvp.md) only.

[`CHARTER.md`](./CHARTER.md) Locked decisions are **binding**. Product SoT is this folder only — use with [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](../../.dev-plan/IMPLEMENTATION-PLAN.mvp.md).

---

## How to read (order)

1. **[`AGENTS.md`](../../AGENTS.md)** — hard rules and phase workflow; **[`DESIGN.md`](../../DESIGN.md)** — visual identity (Google Labs DESIGN.md format).
2. **[`CHARTER.md`](./CHARTER.md)** — MVP personas, locked decisions, gap register, migration→product mapping, post-MVP parking lot.
3. **[`product/vision-and-domains.md`](./product/vision-and-domains.md)** — product vision, bounded contexts, boundary rules, v1 non-goals.
4. **[`features/*.feature`](./features/)** — Gherkin scenarios per domain (MVP only; partner/check-in under [`features/post-mvp/`](./features/post-mvp/)).
5. **[`sitemap/sitemap.md`](./sitemap/sitemap.md)** — complete MVP route map (+ post-MVP partner appendix).
6. **[`ui/`](./ui/)** — design tokens, design system, component map, app shell, static copy, assets.
7. **[`database/schema-overview.md`](./database/schema-overview.md)** — entities, fields, relationships for Drizzle.
8. **[`extras/`](./extras/)** — auth matrix, SEO, images, pagination, integrations, i18n, decisions log.
9. **[`product/user-journeys.md`](./product/user-journeys.md)** + **[`testing/bdd-and-e2e.md`](./testing/bdd-and-e2e.md)** — end-to-end journeys and enforceable Playwright/BDD contract.
10. **[`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](../../.dev-plan/IMPLEMENTATION-PLAN.mvp.md)** — phased delivery for remaining MVP work.
11. **[`ACCEPTANCE.md`](./ACCEPTANCE.md)** — MVP product-spec rewrite acceptance checklist (closed).

When docs conflict, prefer the more specific file for the topic (e.g. `seo-and-metadata.md` over `sitemap.md` for indexing rules). Do not reopen charter Locked decisions unless the user explicitly asks.

---

## Tree status

| Area | Status |
|---|---|
| Charter, vision, sitemap, UI, database, extras | **Done** (step 02) |
| Features, user journeys, BDD testing doc | **Done** (step 03) |
| `IMPLEMENTATION-PLAN.mvp.md` | **Done** (step 04) |
| `AGENTS.md` / README pointers → this folder as active SoT | **Done** (step 05) |
| Acceptance checklist | [`ACCEPTANCE.md`](./ACCEPTANCE.md) |
