## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/spec-alignment-05-sitemap-and-release.md`, parent release criteria, this change’s proposal/design/specs, and `docs/product/sitemap/sitemap.md` §§ Discover & Guest journey
- [x] 1.2 Confirm steps 01–04 are marked done; collect named deferrals from parent Risks + `docs/product/testing/coverage-matrix.md`
- [x] 1.3 Skim `static-pages.feature` / `event-discovery.feature` against live routes (`[locale]/index.tsx`, `[locale]/discover.tsx`, `[locale]/events/[id].tsx`, `[locale]/events/index.tsx`, Discover CTA hrefs)

## 2. Sitemap spot-check and drift fixes

- [x] 2.1 Spot-check Discover home (`/:locale`), preview EventCard → public `/events/:id`, browse CTA → signup/login with `returnTo` toward `/events`, guest `/events` gate
- [x] 2.2 Confirm `/:locale/discover` returns **301** to `/:locale`; check bare `/discover` — if 404, add minimal root 301 to locale home (same `Accept-Language` resolution as `/`)
- [x] 2.3 Fix any other confirmed CTA/redirect/auth-gate drift with minimal diffs; if already aligned, note “already aligned” for PR + DEPLOYMENT.md
- [x] 2.4 Do **not** implement onboarding auto-`returnTo` polish unless a trivial safe one-liner already exists — keep as named deferral to Phase 8

## 3. DEPLOYMENT.md and parent close-out

- [x] 3.1 Add Phase 5.5 section to `apps/web/DEPLOYMENT.md`: Theme Overview in Ladle; guest Discover → public detail; locale `/discover` 301; e2e/Gherkin alignment; no Stripe/booking started; env vars unchanged unless required
- [x] 3.2 Deploy to staging (`bun run deploy:workers`) when credentials available; record URL/date in DEPLOYMENT.md (or document token blocker per design Decision 6)
- [x] 3.3 Finalize `.dev-plan/current-iteration/spec-alignment-parent-guide.md`: check remaining release criteria; mark step 05 done; list consolidated named deferrals with target phases; set parent status complete (or complete with named deferrals)

## 4. Validation

- [x] 4.1 Run `bun run lint` — exit 0 _(touched `discover.tsx` passes biome; repo-wide lint still has pre-existing debt — documented)_
- [x] 4.2 Run `bun run typecheck` — exit 0 _(packages except pre-existing `@unveiled/web` Hono Context errors — documented)_
- [x] 4.3 Run `bun run stories` — Theme Overview reachable under `@unveiled/ui`
- [x] 4.4 Run `bun run test:e2e` — in-scope specs pass (respect named skips/deferrals) _(sitemap Discover/guest scenarios 6/6; member feed flakes documented)_
- [x] 4.5 Staging smoke (or local equivalent if deploy blocked): guest opens public event from Discover; locale `/discover` redirects home
- [x] 4.6 Confirm no Phase 6 packages/routes introduced (`rg` for `packages/billing`, booking stubs, Stripe/Resend wiring added in this change)

## 5. Cleanup

- [x] 5.1 Update `docs/product/` only if sitemap/behavior docs were wrong (prefer fixing code to match docs) _(no product doc change — fixed bare `/discover` to match sitemap; matrix note updated for returnTo → Phase 8)_
- [x] 5.2 Mark this change’s apply tasks done; stop — do not open Phase 6 proposals in this session unless explicitly requested
