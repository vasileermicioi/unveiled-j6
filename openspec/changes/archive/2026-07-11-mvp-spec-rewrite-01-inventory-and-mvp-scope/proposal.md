## Why

Phases 0–5 are shipped, but `docs/migration/` and `.dev-plan/IMPLEMENTATION-PLAN.md` still read like a migration extract: Discover vs Events is fuzzy, sitemap auth on `/events/:id` contradicts SEO indexing rules, Ladle ownership drifted into `apps/web` (43 stories vs 1 in `@unveiled/ui`), partner is mixed into MVP language, and BDD proximity rules are stated but not enforced. Before rewriting the full product tree (steps 02–05), this change locks a binding MVP charter so later agents do not re-litigate personas, sitemap intent, design-system ownership, or Playwright contracts.

## What Changes

- Create `docs/product/` with only:
  - `docs/product/README.md` — WIP stub (not yet source of truth)
  - `docs/product/CHARTER.md` — full MVP charter: purpose, inventory, gap register, locked decisions, target tree, migration→product mapping, post-MVP parking lot
- Record six locked decisions as authoritative for steps 02–05: MVP personas (guest/member/admin; partner post-MVP), public `/events/:id`, Discover→Events navigation, `@unveiled/ui` + Theme Overview ownership, Gherkin↔Playwright proximity BDD, and artifact paths (`docs/product/` + `IMPLEMENTATION-PLAN.mvp.md`)
- Mark step 01 done in `.dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md`
- Do **not** rewrite sitemap/features/plan, move Ladle stories, edit `AGENTS.md` / `IMPLEMENTATION-PLAN.md` / feature files, or change application code

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `platform-foundation`: Add requirement that a MVP product-spec charter at `docs/product/CHARTER.md` exists and locks personas, public event detail, Discover→Events navigation, design-system ownership (including Theme Overview), and BDD proximity rules before the full product doc rewrite

## Impact

- **Docs only:** `docs/product/README.md`, `docs/product/CHARTER.md`; parent-guide checkbox for step 01
- **Consumers:** steps 02–05 of `mvp-spec-rewrite` (foundation docs, features/BDD, MVP plan, AGENTS pointers)
- **Evidence cited in charter (not fixed here):** `docs/migration/sitemap/sitemap.md` (`/events/:id` listed as USER-gated vs `extras/seo-and-metadata.md` indexable), Ladle split (`packages/ui` 1 story / `apps/web` 43; `ThemeDecorator` imports `apps/web` CSS), e2e `page.locator('input[name=…]')` usage in `e2e/specs/admin-events.spec.ts` and fixtures
- **Out of scope:** code, story moves, deleting `docs/migration/`, partner portal implementation
