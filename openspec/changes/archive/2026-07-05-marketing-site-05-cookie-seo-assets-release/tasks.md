## 1. Pre-flight

- [x] 1.1 Read `proposal.md`, `design.md`, and both spec deltas end-to-end
- [x] 1.2 Confirm step 04 artifacts are merged: discover, legal routes, footer links, SEO helpers
- [x] 1.3 Read `static-pages.feature` cookie scenarios and `seo-and-metadata.md` §5 (robots + sitemap rules)
- [x] 1.4 Confirm `getSiteUrl()` / `absoluteUrl()` exist in `apps/web/app/lib/site-config.ts`

## 2. Cookie consent

- [x] 2.1 Create `apps/web/app/lib/cookie-consent.ts` — storage key, 12-month expiry, `getStoredConsent()` / `setStoredConsent()` / `hasValidConsent()`, DE/EN copy constants
- [x] 2.2 Create `apps/web/app/islands/CookieConsentBanner.tsx` — HeroUI fixed-bottom bar with explanation, privacy link, Accept/Decline buttons; hide when valid consent stored
- [x] 2.3 Mount `CookieConsentBanner` in `apps/web/app/components/AppShell.tsx` with `locale` prop
- [x] 2.4 Add theme styles for cookie banner in `globals.css` `@layer components` if needed (fixed positioning, z-index, bordered surface)

## 3. Robots.txt route

- [x] 3.1 Create `apps/web/app/routes/robots.txt.ts` — `text/plain` response with Allow/Disallow rules per SEO spec
- [x] 3.2 Include `Sitemap: {SITE_URL}/sitemap.xml` line using `absoluteUrl("/sitemap.xml")`

## 4. Sitemap.xml route

- [x] 4.1 Create `apps/web/app/routes/sitemap.xml.ts` — valid XML `urlset` with `Content-Type: application/xml`
- [x] 4.2 Emit 16 absolute URLs: 8 static paths (`/`, `/discover`, `/how-it-works`, `/faq`, `/membership`, `/impressum`, `/privacy`, `/terms`) × 2 locales via `localizedPath()` + `absoluteUrl()`
- [x] 4.3 Verify no `/events/:id` URLs appear in output

## 5. OG fallback image

- [x] 5.1 Create `apps/web/public/og-default.png` — 1200×630 branded placeholder (yellow `#FAFF86` background, Unveiled wordmark)
- [x] 5.2 Add `DEFAULT_OG_IMAGE` constant (absolute URL via `getSiteUrl()`) in `site-config.ts` or `seo.ts`
- [x] 5.3 Update `buildPageMeta()` to set `og:image` and `twitter:image` to default when `ogImage` is omitted
- [x] 5.4 Verify View Source on `/en/faq` shows fallback `og:image` in initial SSR HTML

## 6. Favicon verification

- [x] 6.1 Confirm `/favicon.svg` returns HTTP 200 locally and on staging; upgrade only if broken

## 7. Deployment documentation

- [x] 7.1 Add `SITE_URL` to env var table in `apps/web/DEPLOYMENT.md` — required for staging/production, default `http://localhost:3000` locally
- [x] 7.2 Add Phase 1 verification checklist: robots.txt curl, sitemap.xml curl (16 URLs), cookie banner browser test, OG meta View Source, DE/EN route smoke test
- [x] 7.3 Document that MapLibre + OpenStreetMap map consent gating wires in Phase 5; declining cookies has no visible effect in Phase 1

## 8. Validation

- [x] 8.1 Run `bun run typecheck` — exits 0
- [x] 8.2 Run `bun run lint` — exits 0
- [x] 8.3 Run `bun run build` — exits 0
- [x] 8.4 `curl -s http://localhost:3000/robots.txt` — shows Allow/Disallow rules and Sitemap line
- [x] 8.5 `curl -s http://localhost:3000/sitemap.xml` — valid XML with 16 URLs including `/de/discover` and `/en/terms`
- [x] 8.6 Clear storage, load `/de` — cookie banner appears; accept/decline persists across reloads
- [x] 8.7 View Source on `/en/faq` — `og:image` points at site-wide fallback; all meta tags server-rendered
- [ ] 8.8 Deploy to staging with `SITE_URL` set; smoke-test all public DE/EN routes; no console errors

## 9. Wrap-up

- [x] 9.1 Mark step 05 done in `marketing-site-README.md` when change is archived
- [ ] 9.2 Archive OpenSpec change and merge spec deltas into `openspec/specs/static-marketing-pages/spec.md` and `openspec/specs/platform-foundation/spec.md`
