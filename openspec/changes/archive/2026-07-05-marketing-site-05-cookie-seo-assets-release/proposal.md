## Why

Phase 1 steps 01–04 delivered the full marketing brochure site — landing, how-it-works, FAQ, membership, discover, and legal pages — but the release loop is incomplete without GDPR cookie consent, crawler-facing `robots.txt` and `sitemap.xml`, a site-wide Open Graph fallback image, and documented `SITE_URL` for production canonical URLs. This step closes Phase 1 so the site is demo-ready for investors and indexable by search engines without waiting for auth, catalog, or the event map (MapLibre + OpenStreetMap, Phase 5).

## What Changes

- Add `CookieConsentBanner` client island mounted in `AppShell`: first-visit banner with Accept / Decline for non-essential cookies; persist decision in `localStorage` with reasonable expiry; no re-prompt until cleared or expired. Phase 1: declining has no visible effect (MapLibre + OSM map island not implemented yet) but preference is stored per feature spec.
- Add HonoX route `apps/web/app/routes/robots.txt.ts`: allow indexable marketing routes; disallow auth, member, partner, admin, onboarding, checkin, and booking paths per `seo-and-metadata.md` §5; include `Sitemap: {SITE_URL}/sitemap.xml`.
- Add HonoX route `apps/web/app/routes/sitemap.xml.ts`: valid XML listing both locale URLs for every Phase 1 static page (`/`, `/discover`, `/how-it-works`, `/faq`, `/membership`, `/impressum`, `/privacy`, `/terms`) — 16 URLs total; no event URLs until Phase 4.
- Add site-wide OG fallback image `apps/web/public/og-default.png` (1200×630, yellow background + Unveiled wordmark) and wire as default `og:image` / `twitter:image` in the SEO helper when a page does not specify an image.
- Verify favicon at `/favicon.svg` still works; upgrade from placeholder only if needed.
- Update `apps/web/DEPLOYMENT.md`: document `SITE_URL` env var (required for production canonical/sitemap/OG absolute URLs), Phase 1 demo script, and staging verification checklist.
- Staging deploy and smoke-test all public DE/EN routes.

**Out of scope:** MapLibre GL JS + OpenStreetMap map consent gating (Phase 5), dynamic sitemap event entries (Phase 4), Sentry/analytics/Search Console, auth, database, Stripe.

## Capabilities

### New Capabilities

- _(none — cookie consent, sitemap, OG fallback extend `static-marketing-pages`; robots.txt and SITE_URL extend `platform-foundation`)_

### Modified Capabilities

- `static-marketing-pages`: Add requirements for cookie consent banner (first visit, persistence, Phase 1 no gating), static sitemap listing both locales of all Phase 1 marketing/legal pages, and site-wide Open Graph fallback image for pages without page-specific images.
- `platform-foundation`: Add requirements for `/robots.txt` route (allow/disallow rules + Sitemap directive), `SITE_URL` environment configuration for absolute URLs, and Phase 1 release gate (full brochure site demo-ready on staging).

## Impact

- **New files:** `apps/web/app/islands/CookieConsentBanner.tsx`, `apps/web/app/routes/robots.txt.ts`, `apps/web/app/routes/sitemap.xml.ts`, `apps/web/public/og-default.png`, optional `apps/web/app/lib/cookie-consent.ts` (storage key, expiry, copy).
- **Modified files:** `apps/web/app/components/AppShell.tsx` (mount cookie banner island), `apps/web/app/lib/seo.ts` (default OG image fallback), `apps/web/app/routes/_renderer.tsx` or locale renderer (pass default `ogImage` when unset), `apps/web/DEPLOYMENT.md`.
- **Existing utilities reused:** `getSiteUrl()` / `absoluteUrl()` in `apps/web/app/lib/site-config.ts` (already defaults to `http://localhost:3000`).
- **Dependencies:** no new npm packages — client island uses existing HeroUI primitives and `localStorage`.
- **Downstream:** Phase 2 auth follows; Phase 4 extends sitemap with event URLs; Phase 5 wires MapLibre GL JS + OpenStreetMap map island behind consent check.
- **Branch:** `phase-1-marketing-05` or parent Phase 1 branch per iteration convention.
