## Context

Step 02 is merged: `/:locale` renders `LandingPageV3` (`apps/web/app/components/marketing/landing-v3/LandingPageV3.tsx` + `LandingHeroV3`, `LandingEventsRailV3`, `LandingCreditsV3`, `LandingPartnersV3`, `LandingCommunityV3`, `LandingFinalCtaV3`) from the `landing-v3` content model with guest-safe live teasers (`loadLandingLiveTeasers` / `getLandingFallbackTeasers`). Both `/regular` route files are deleted (404).

What is stale: `apps/web/app/lib/seo.ts` (`landingPageMeta` builds title/description from `hero.headlineA/B` + `hero.lead`, `buildOrganizationJsonLd` is generic) still needs verification against v3 copy with `/regular` canonicals/index rules removed; no `LandingPageV3.stories.tsx` exists (only `DiscoverPage.stories.tsx`-style precedents with `getPageContent` + mock fixtures); `e2e/specs/static-pages.spec.ts` still has `Scenario: Regular membership landing` and `Scenario: Bare /regular redirects to localized regular landing`; and five canonical docs still reference `/regular` (`sitemap.md` row, `static-pages-content.md` §Regular section, `static-pages.feature` two scenarios, `coverage-matrix.md` two rows, `seo-and-metadata.md` index table). See `proposal.md` for why; specs define the release contract.

## Goals / Non-Goals

**Goals:**

- Locale-home-only SEO: v3-derived title/description, self canonical, hreflang, OG fallback, Organization JSON-LD — with zero `/regular` references.
- Ladle stories for `LandingPageV3` covering full/short/empty rail × DE/EN, following the existing `getPageContent` + fixtures pattern.
- Playwright v3 assertions with proximity/layout selectors only and 404 coverage for both deleted routes.
- Canonical docs synced to the single landing (sitemap, static copy, Gherkin, coverage matrix, i18n inventory, SEO index rules).

**Non-Goals:**

- Copy redesign, pricing/Checkout changes, new visual tokens or theme rework (verify yellow backdrop / breakpoints / reduced-motion / focus only).
- Discover, member `/events` feed, admin, email, or image-pipeline work.
- New SEO surfaces (no new routes, no sitemap.xml builder changes beyond dropping `/regular` rows).

## Decisions

### 1. SEO: verify-and-prune, not a new meta builder

`[locale]/index.tsx` already wires `landingPageMeta(content)` + `buildOrganizationJsonLd(locale)` + `canonicalPath: pathname` through `_renderer.tsx` (`buildPageMeta` → canonical, hreflang de/en/x-default→de, OG fallback `/og-default-v2.png`). Keep that path; change content, not plumbing.

- Confirm `landingPageMeta` output against shipped v3 DE/EN hero copy (headline + lead); adjust only if view-source shows stale founding/deposit wording or over-long description. No `/regular` branch is added — the deleted routes have no meta path.
- Confirm Organization JSON-LD stays locale-home URL + support email + Berlin address; no `/regular` URL is emitted.
- Prune docs, not code, for index rules: remove `/regular` from `seo-and-metadata.md` §1 index table and any sitemap/robots mention. No `noindex` rule is kept for deleted routes (they 404).
- Alternative considered: dedicated `landingV3PageMeta` with offer-price fields — rejected; the generic hero-derived builder already satisfies the per-page metadata contract and avoids a second title source.

### 2. Stories: one `LandingPageV3.stories.tsx`, three rail states × two locales

Follow `DiscoverPage.stories.tsx`: `getPageContent(locale, "landing")` (the `landing` PageKey now serves v3) plus lightweight teaser fixtures shaped as `LandingLiveTeaser` (id, title, description, dateLabel, time, place, image — reuse existing story image helpers, never base64).

- `FullRail` (3 teasers), `ShortRail` (1–2 teasers), `EmptyRail` (fallback teasers from `getLandingFallbackTeasers` or empty → empty-state card) — each rendered for `de` and `en` (either six exports or locale-parameterized stories matching the Ladle convention in `marketing/*.stories.tsx`).
- Delete any legacy landing stories still referencing `LandingPage`, `landing.legacy`, or `regular` content keys.
- Responsive / reduced-motion / focus / gallery keyboard-aria are verified manually against the stories and the live route (theme CSS `@media (prefers-reduced-motion)` already covers marquees; no story prop for motion).
- Alternative considered: Storybook-style CSF with mocked DB — rejected; Ladle + static fixtures is the repo standard and keeps `bun run stories` green without services.

### 3. Playwright: replace two scenarios, keep everything else

Edit `e2e/specs/static-pages.spec.ts` only:

- Delete `Scenario: Regular membership landing` and `Scenario: Bare /regular redirects to localized regular landing`.
- Add `Scenario: /regular routes return 404` (or the exact Gherkin title chosen in `static-pages.feature`): `page.goto('/:locale/regular')` and `page.goto('/regular')` both assert 404 (locale-aware not-found template, `noindex`; assert the not-found heading via `getByRole("heading")` + URL, not status-code plumbing unless the harness exposes it — check the existing 404 convention first).
- Add/extend the locale-home test to v3 rail assertions: rail cards count ≤3 (`getByRole("main")` → card scope), no credit-figure text in the rail scope (`not.toContainText(/credits?|€/i)` scoped to the rail, not the 29 € offer card), no `href` containing `/events/` inside rail cards, and every rail CTA `toHaveAttribute("href", /\/:locale\/signup/)`.
- All selectors `getByRole` / `getByText` / `getByLabel` with layout scoping (`main`, `banner`, `contentinfo`); no CSS-class hooks, no bare `input[name=…]`.
- Alternative considered: keeping a redirect test for `/regular` → home — rejected; the parent guide locks hard-delete (404, no redirect).

### 4. Docs: purge `/regular` in five files + index rules

Single pass, verbatim-copy discipline (`static-pages-content.md`, `content-i18n-inventory.md` quote shipped copy):

- `docs/product/sitemap/sitemap.md`: delete the `/regular` row (§Guest home table); confirm `/:locale` row describes the v3 landing.
- `docs/product/ui/static-pages-content.md`: delete `## Regular membership landing` section; confirm `## Guest marketing home` describes v3 sections (hero + 29 € offer, signup-only rail, credits, partners, community, final CTA).
- `docs/product/features/static-pages.feature`: delete the two `/regular` scenarios; add the 404 scenario with the exact title used by Playwright.
- `docs/product/testing/coverage-matrix.md`: delete the two `/regular` rows; add v3 rail + 404 rows pointing at the new test titles (`pass` or named env-skip).
- `docs/product/extras/content-i18n-inventory.md`: drop `regular` key strings if listed; keep `landing-v3` DE/EN pairs.
- `docs/product/extras/seo-and-metadata.md`: drop `/regular` from the indexable table.
- `docs/product/ui/ui-component-map.md` if it still rows `/:locale/regular` (grep hit) — same purge.

## Risks / Trade-offs

- [Risk] Rail-scoped "no €" assertion collides with the 29 € offer card → Mitigation: scope all no-credit/no-€ assertions to the rail container (`#experiences` / rail region), never the whole `main`.
- [Risk] 404 assertion flakes if the not-found template shares headings with other pages → Mitigation: assert URL + not-found-specific heading/text; reuse the existing 404 e2e idiom if one exists, else the locale-aware `NotFoundPage` copy.
- [Risk] Doc purge misses a `/regular` reference (case variants, `regular.ts`, PageKey) → Mitigation: final `rg -i "regular" docs/product e2e/specs apps/web` triage — remaining hits must be only `kind: "regular"` offer enum, "regular ticket price" FAQ prose, or "change regularly" copy, each explicitly justified in the PR.
- [Risk] Story fixtures drift from shipped v3 copy → Mitigation: source all copy from `getPageContent(locale, "landing")`, fixture only the teaser rows.

## Migration Plan

No data migration. SSR-only + docs + e2e change behind the normal deploy: merge, staging deploy, run `bun run lint`, `bun run typecheck`, `bun run stories` smoke, `bun run test:e2e -- e2e/specs/static-pages.spec.ts`. Rollback is a plain revert (no schema, no Stripe, no R2 changes).

## Open Questions

- None — all unknowns (exact 404 heading copy, story export naming) are resolved at implementation time from the shipped `NotFoundPage` and Ladle conventions without changing specs or tasks.
