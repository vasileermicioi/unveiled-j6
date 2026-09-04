## Context

Step 01 (`membership-landing-v3-01-content-and-teasers`, merged) added the v3 DE/EN content model (`apps/web/app/lib/content/landing-v3.ts`), the guest-safe live-teaser loader (`loadLandingLiveTeasers` + static fallback), and wired both through `apps/web/app/routes/[locale]/index.tsx` — but the route still renders the old `LandingPage` (founding/deposit offer, static 5-card rail with credit tags and login links); the v3 values are loaded and discarded (`void v3Content; void liveTeasers`). Both `/regular` routes (`apps/web/app/routes/[locale]/regular.tsx`, `apps/web/app/routes/regular.tsx`) render the same old `LandingPage` with the `regular` PageKey. See proposal.md for why this step rebuilds the page and hard-deletes `/regular`. Source brief section order: `.dev-plan/unveiled-membership-v3.html` (nav/footer from shared shell; hero + 29 € offer; events rail; credits band; flexibility/partners band; community proof; final CTA). Hard rules apply: HeroUI-only markup, theme-only styling in `globals.css`, brand-yellow backdrop, Work Sans, SSR-only.

## Goals / Non-Goals

**Goals:**
- `/:locale` renders `LandingPageV3` from the mock in app look-and-feel with a signup-only live rail.
- Both `/regular` routes return 404 via git-deletion; all superseded landing files git-deleted; `bun run lint` and `bun run typecheck` green.

**Non-Goals:**
- Copy rewrites beyond porting the mock, SEO/meta changes, Ladle stories, e2e, docs/sitemap updates — all step 03 (`membership-landing-v3-03-hardening`).
- Discover (`/:locale/discover`) and member `/events` feed changes; pricing/Stripe/image-pipeline work.

## Decisions

- **Mirror the old composition shape with `landing-v3/*` sections.** New `LandingPageV3` composes `LandingHeroV3`, `LandingEventsRailV3`, `LandingCreditsV3`, `LandingPartnersV3`, `LandingCommunityV3`, `LandingFinalCtaV3` (same order as `LandingPage` today, same props shape: locale + v3 section content + teasers for the rail). The partners band is named `LandingPartnersV3` (not `LandingFlexibilityV3`) because the v3 content model has no flexibility copy — the band renders `credits.partners` (`partnersEyebrow` as eyebrow, `partnersSub` as headline, logo tiles, `partnersNote`). Chosen over editing the old sections in place so the old files can be git-deleted atomically and the diff stays reviewable. Alternative (in-place rewrite) rejected: it would mix deleted and new behavior in one file history.
- **Rail card is not a link; only the CTA is clickable.** Card renders as a plain HeroUI `Card`/`Surface` (no `href`, no wrapping `Link`); footer holds one `Link className="button button--primary"` to `localizedPath(locale, "signup")`. No credit-split block, no `loginHref`, no `locked` overlay variant (lock/login upsell disappears with the old funnel). Alternative (whole-card link to signup) rejected: spec requires the card itself to be assertably link-free except the CTA.
- **Repoint the `landing` PageKey at v3 content; delete `regular`.** `apps/web/app/lib/content/index.ts` maps `"landing"` to the `landing-v3` module; `"landing-v3"` key may remain as an alias for step 01 compatibility; `"regular"` key, `landing.ts`, `regular.ts`, `landing.legacy.ts`, and their tests (`landing.test.ts`, `regular.test.ts` — update or delete with the modules) are removed. Chosen over keeping parallel keys so there is exactly one landing content path. Alternative (route loads `"landing-v3"` directly and `"landing"` is deleted) rejected: parent guide fixes `landing` as the v3 key.
- **Route change is a render-target swap only.** `apps/web/app/routes/[locale]/index.tsx` keeps the guest-only guard, bare-`/` 302 behavior, and the step-01 loader block, but passes the loaded values into `<LandingPageV3>` instead of discarding them; SEO helpers (`landingPageMeta`, JSON-LD) are reused unchanged in this step. Alternative (rewriting loader/SEO now) rejected: step 03 owns SEO polish.
- **Hard-delete list (git rm, no archive).** Routes: `[locale]/regular.tsx`, `regular.tsx`. Components: `LandingPage.tsx`, `landing/LandingHero.tsx`, `LandingEventsRail.tsx`, `LandingCredits.tsx`, `LandingFlexibility.tsx`, `LandingCommunity.tsx`, `LandingFinalCta.tsx`, `LandingPerkRow.tsx`, `LandingSectionHeader.tsx` (only if unused elsewhere — verify imports first), `landing/assets.ts` (static rail images), `LandingPage.legacy.tsx`. Stories: `LandingPage.stories.tsx`, `LandingPage.legacy.stories.tsx`. Theme: `.guest-home*` blocks in `globals.css`; old `.landing-*` rules are replaced by v3 rules in the same theme pass, not per-route classes. `LandingImageGallery` island is kept only if a v3 section reuses it, else deleted with its imports.
- **Images via existing R2/seed variants only.** Teaser images come from the guest-safe teaser `image` field (event primary variant URL); partner logos reuse the v3 content `logoSrc` paths. The mock's base64 blobs are never copied. No new image pipeline.

## Risks / Trade-offs

- [Stale imports after deletion] → Mitigation: `rg` for `landing/`, `LandingPage`, `PageKey.*regular`, `"landing"`, `"regular"`, `guest-home`, `landingEventImages` across `apps/web` (routes, islands, stories, tests, seo/content index) before finishing; typecheck is the gate.
- [Tests/stories reference deleted modules] → Mitigation: delete or repoint `landing.test.ts` / `regular.test.ts` and Ladle stories in the same change; do not leave skipped tests behind.
- [SEO/meta regresses silently] → Mitigation: reuse `landingPageMeta` + Organization JSON-LD unchanged; full meta polish and assertions are step 03 scope (accepted interim gap).
- [`/regular` indexed or bookmarked] → Mitigation: none in this step — hard 404 is the specified behavior per parent guide (no redirect); step 03 removes `/regular` from sitemap/docs.

## Migration Plan

- Single deploy, no data migration, no env changes. Rollback is revert of the merge commit (route files and components are git-deleted, so revert restores them atomically).
- Post-deploy smoke: `/de` shows v3 hero/offer/rail with signup-only CTAs and no credit figures in rail markup; `/de/regular` and `/regular` return 404; `bun run lint`, `bun run typecheck` green.
