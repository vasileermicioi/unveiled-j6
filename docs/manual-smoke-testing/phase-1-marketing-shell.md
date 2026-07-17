# Phase 1 — Manual smoke test

Marketing shell, locale, legal, cookies. Client demo: *Yellow brand home, how-it-works, FAQ, and legal pages in DE/EN.*

**Do not expect auth, booking, or admin** — those land in later phases.

## Setup

1. App running (`bun run dev` or staging).
2. `SITE_URL` set on staging (canonical / OG / sitemap). Local defaults to `http://localhost:3000` when unset.
3. No demo accounts required.

---

## A. Locale & shell

1. Open `/` → 302 → `/de` or `/en` (by `Accept-Language`, fallback `de`).
2. Switch language in the navbar → same path under the other locale.
3. Yellow page background (`#FAFF86`) on every route; white/cream cards float on top.
4. Navbar + footer render; no console errors on `/de` and `/en`.

## B. Discover (locale home)

1. Open `/:locale` — Discover hero, value props, curated upcoming preview (when catalog has events).
2. Open `/:locale/discover` and bare `/discover` → **301** to locale home.
3. Preview event CTA (“Book Now” / “Bin dabei”) → public `/events/:id` when events exist (guest, no login).

## C. Static & legal

1. `/how-it-works` — explainer loads DE + EN.
2. `/faq` — accordion answers.
3. `/membership` — plan details (Checkout may be inactive until Phase 6).
4. `/impressum`, `/privacy`, `/terms` — legal copy present.

## D. Cookies & SEO basics

1. Cookie banner appears for a fresh browser profile.
2. Accept / decline stores consent; map later uses this (Phase 5).
3. `/robots.txt` responds; `/sitemap.xml` lists marketing/legal locale URLs.

## E. Quick negatives (optional)

- Guest `/events` is gated (redirect to login) — full feed is not public.
- No grey page background; Work Sans only.
- No partner portal routes.

## Related docs

- `apps/web/DEPLOYMENT.md` — Phase 1 / `SITE_URL`
- `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` — Baseline Phases 0–1
- `docs/product/features/static-pages.feature`
- `docs/product/sitemap/sitemap.md`
- `docs/product/ui/static-pages-content.md`
