## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/featured-discover-04-hardening.md`, parent release criteria in `featured-discover-parent-guide.md`, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm prerequisites: steps 01–03 done (featured table + admin Featured tab + Discover/browse/nav redirects); note step 03 redirect table for docs
- [x] 1.3 Diff/grep `docs/product/` and e2e for stale Discover/catalog-preview / ungated inactive `/events` / nav-always-Discover language; list stale hits
- [x] 1.4 Confirm demo seed creates partners/events but no `featured_events` rows yet; locate `runDemoSeed` + `addFeaturedEvent` + `DEMO_DISCOVERY_TITLES`

## 2. Product docs & Gherkin

- [x] 2.1 Update `docs/product/features/event-discovery.feature` for featured-only Discover, non-active Discover access, active-only `/events` (+ map), and Discover vs Browse events nav (prefer MODIFY; keep stable Scenario titles where Playwright already matches)
- [x] 2.2 Update admin Featured scenarios (or add to the appropriate admin feature file) so remove-from-featured keeps the catalog event
- [x] 2.3 Update `docs/product/sitemap/sitemap.md`, `docs/product/ui/app-shell.md`, `docs/product/ui/static-pages-content.md`, `docs/product/ui/ui-component-map.md` for shipped redirects and labels
- [x] 2.4 Update `docs/product/extras/content-i18n-inventory.md` for Discover / Browse events shell strings; append `gaps-and-decisions.md` with shipped decisions + deferred items (footer parity, PAST_DUE Browse revisit if still open)

## 3. Demo seed & empty Discover polish

- [x] 3.1 In `runDemoSeed`, after creating upcoming demo events, call `addFeaturedEvent` for a small fixed upcoming subset so Discover is non-empty after `seed:demo`
- [x] 3.2 Update Discover empty-state copy in `apps/web/app/lib/content/discover.ts` (DE/EN) to featured-aware wording; keep HeroUI-only markup if any empty-state UI tweak is needed
- [x] 3.3 Do not change booking eligibility, redirects, or admin Featured routes unless e2e reveals a regression

## 4. Playwright / BDD

- [x] 4.1 Add/adjust `e2e/specs/event-discovery.spec.ts` (and `static-pages.spec.ts` if needed): guest Discover shows a seeded featured title; a known non-featured upcoming title does not appear solely for being soon
- [x] 4.2 Inactive USER: `/events` redirects to Discover; Active USER: primary nav shows Browse events → `/events` (proximity selectors)
- [x] 4.3 Admin: remove-from-featured confirm; Discover no longer lists the event; event remains on `/admin/events`
- [x] 4.4 Align Playwright test titles with new Gherkin `Scenario:` lines where the BDD contract requires verbatim match; document staging-only gaps with owner if fixtures missing

## 5. Validation & cleanup

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (both exit 0)
- [x] 5.2 Run targeted Playwright for discovery/static/admin specs related to this feature; document env blockers if any
- [x] 5.3 Grep sanity: product SoT no longer claims Discover is an automatic upcoming-catalog preview or that inactive USERs browse the full `/events` feed
- [x] 5.4 Walk parent **Release Criteria**; mark steps 01–04 **done** in `.dev-plan/current-iteration/featured-discover-parent-guide.md`; note deferred items in gaps-and-decisions
- [x] 5.5 Prepare PR/handoff linking this change id and parent guide; optional one-line `DEPLOYMENT.md` demo note only if seed/featured behavior needs operator callout
