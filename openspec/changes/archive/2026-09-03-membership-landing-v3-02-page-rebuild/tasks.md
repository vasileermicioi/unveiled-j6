## 1. Setup and prerequisites

- [x] 1.1 Confirm step-01 prerequisites exist on the locale-home route (v3 content load + `loadLandingLiveTeasers` with static fallback in `apps/web/app/routes/[locale]/index.tsx`) and skim the parent guide plus `.dev-plan/unveiled-membership-v3.html` section order; verify by naming the v3 sections and teaser cap (3) in the apply session.
- [x] 1.2 Inventory all importers of the deletion set (`LandingPage`, `landing/*`, `landing/assets`, `content/landing`, `content/regular`, `content/landing.legacy`, `regular` PageKey, `.guest-home`, `landingEventImages`) via `rg` across `apps/web` and verify the hit list is captured before deleting.

## 2. Page rebuild (LandingPageV3)

- [x] 2.1 Build `LandingPageV3` + `landing-v3/*` sections (hero + 29 € offer card with 17 credits / +5 extra / +1 bring / join CTA / cancel note, credits, flexibility/partners, community, final CTA) from HeroUI primitives with theme-only styling in `globals.css`, and verify each section renders its v3 copy in both locales with no raw `section/p/a/button/h1` markup and no per-route color/shadow classes.
- [x] 2.2 Rebuild the rail from live teasers only (no credit tags, no guest-hidden details, card itself not a link, single signup CTA per card to `/:locale/signup`, teaser `image` field for R2/seed variants only) and verify rendered rail markup contains no `href` to `/events/:id` and no credit figures.
- [x] 2.3 Point `apps/web/app/routes/[locale]/index.tsx` at `LandingPageV3` (pass through the step-01 `v3Content` + `liveTeasers`, keep guest-only guard and bare `/` 302, reuse `landingPageMeta`/JSON-LD unchanged) and verify `bun run dev` + visit `/de` shows v3 hero/offer/rail with action buttons pointing at `/de/signup`.

## 3. Hard delete and import repair

- [x] 3.1 Git-delete both `/regular` route files (`apps/web/app/routes/[locale]/regular.tsx`, `apps/web/app/routes/regular.tsx`) and verify `/de/regular` and `/regular` both return 404.
- [x] 3.2 Git-delete superseded landing files (`LandingPage.tsx`, old `landing/*` sections + `assets.ts`, `LandingPage.legacy.tsx`, `landing.ts`, `regular.ts`, `landing.legacy.ts`, dead Ladle stories, `.guest-home*` theme blocks; keep `LandingImageGallery` only if v3 reuses it), repoint the `landing` PageKey at v3 content and remove the `regular` PageKey (updating/deleting `landing.test.ts` + `regular.test.ts` in the same pass), and verify with `rg` that no stale imports remain.
- [x] 3.3 Run `bun run lint` and `bun run typecheck` and verify both exit 0.

## 4. Handoff

- [x] 4.1 Manual smoke per step plan (v3 hero/offer/rail visible on `/de`, rail cards link-free except signup CTAs, view-source shows no credit figures in rail, both `/regular` paths 404) and verify each check passes or is recorded as a named deferral.
- [x] 4.2 Update `.dev-plan/current-iteration/01-membership-landing-v3-parent-guide.md` to mark step 02 done and verify the guide reflects completion for the step-03 agent.
