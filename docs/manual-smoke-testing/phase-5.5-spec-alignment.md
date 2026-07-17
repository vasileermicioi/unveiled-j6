# Phase 5.5 — Manual smoke test

Spec alignment: Theme Overview, Discover CTAs, public detail. Client demo: *Theme Overview in Ladle; guest can open a public event from Discover; e2e titles match product Gherkin.*

**Do not start Stripe/booking (Phase 6)** in this pass.

## Setup

1. Phases 0–5 shipped; catalog seeded if testing Discover preview.
2. Local: `bun run stories` (Ladle) + app (`bun run dev` or staging).
3. No Stripe/Resend vars required for this smoke.

---

## A. Theme Overview (Ladle)

1. `bun run stories` → open **Theme Overview** under `@unveiled/ui`.
2. Confirm brand yellow `#FAFF86`, near-zero radius, no hard drop shadows, Work Sans.
3. Primary + secondary CTA samples and sample card/chips render.

## B. Guest Discover → public detail

1. As guest, open `/:locale` (Discover).
2. Click preview “Book Now” / “Bin dabei” → public `/events/:id` **without** login.
3. Confirm browse/full-feed CTA sends guests toward signup/login (not a public `/events` list).

## C. Sitemap redirects

1. `/:locale/discover` → **301** → `/:locale`.
2. Bare `/discover` → **301** → locale home.
3. Guest `/events` → login/signup with `returnTo`.

## D. Quick negatives (optional)

- No `packages/billing` Checkout or booking mutation routes introduced here.
- Named deferrals (Google OAuth e2e, GDPR UI, etc.) may still be open — see parent guide; they must not block this smoke’s A–C.

## Related docs

- `apps/web/DEPLOYMENT.md` — Phase 5.5
- `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` — Phase 5.5
- `.dev-plan/current-iteration/spec-alignment-parent-guide.md`
- `docs/product/ui/design-system.md`
- `docs/product/testing/coverage-matrix.md`
- `docs/product/features/static-pages.feature`, `event-discovery.feature`
