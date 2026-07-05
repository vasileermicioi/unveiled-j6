## Context

Phase 1 steps 01–04 archived with:
- All public marketing routes: `/:locale`, `/discover`, `/how-it-works`, `/faq`, `/membership`, `/impressum`, `/privacy`, `/terms`
- SEO helper `buildPageMeta()` in `apps/web/app/lib/seo.ts` with canonical, hreflang, OG/Twitter tags — but `og:image` only emitted when a page passes `ogImage` explicitly (no site-wide fallback yet)
- `getSiteUrl()` / `absoluteUrl()` in `apps/web/app/lib/site-config.ts` already reading `SITE_URL` with `http://localhost:3000` default
- `AppShell` wrapping every locale page with navbar + footer; islands pattern established (`FaqAccordion`, `GuestNavbarMenu`)
- Favicon at `/favicon.svg` linked in root `_renderer.tsx`
- No `robots.txt`, no `sitemap.xml`, no cookie banner

This step closes the Phase 1 release loop per `marketing-site-05-cookie-seo-assets-release` iteration doc and `seo-and-metadata.md` §5.

Constraints from `AGENTS.md`:
- Cookie banner is a client island — minimal JS, HeroUI-only markup
- Robots and sitemap are HonoX route handlers (SSR), not static files in `public/`
- Theme-only visual styling for banner chrome
- Do not gate Sentry (not installed in Phase 1)

## Goals / Non-Goals

**Goals:**

- Cookie consent banner on first visit with Accept / Decline; persist in `localStorage` with 12-month expiry; bilingual DE/EN copy
- `/robots.txt` with allow/disallow rules per SEO spec and `Sitemap:` directive
- `/sitemap.xml` with 16 absolute URLs (8 paths × 2 locales) for Phase 1 static pages
- Site-wide `og-default.png` (1200×630) wired as default `og:image` / `twitter:image`
- `DEPLOYMENT.md` updated with `SITE_URL` and Phase 1 verification checklist
- Staging deploy smoke-tested

**Non-Goals:**

- Google Maps consent gating (Phase 5 — store preference now, wire check later)
- Dynamic sitemap event entries (Phase 4)
- Sentry, analytics, Search Console setup
- Auth, database, Stripe
- Replacing favicon unless broken

## Decisions

### 1. Cookie consent storage — `localStorage` with typed helper

Create `apps/web/app/lib/cookie-consent.ts`:
- Storage key: `unveiled:cookie-consent`
- Value: `{ decision: "accepted" | "declined"; expiresAt: number }` (ISO timestamp ms)
- Expiry: 12 months from decision (reasonable GDPR practice; re-prompt after expiry)
- Export `getStoredConsent()`, `setStoredConsent(decision)`, `hasValidConsent()`, `CONSENT_COPY` (DE/EN strings)

**Alternative considered:** HTTP cookie. Rejected for Phase 1 — no server-side read needed yet; `localStorage` is simpler and matches feature spec wording. Phase 5 Maps gating reads client-side only.

### 2. CookieConsentBanner island — fixed bottom bar in AppShell

`apps/web/app/islands/CookieConsentBanner.tsx`:
- Props: `locale: Locale`
- On mount: read `hasValidConsent()` — if valid, render nothing
- Otherwise: fixed-bottom `Surface` with `Paragraph` (explanation), `Link` to `/:locale/privacy`, and two `Button`s (Accept primary, Decline secondary)
- Accept/Decline handlers call `setStoredConsent()` and hide banner via local state
- SSR fallback: render nothing (banner appears after hydration — acceptable for consent UX; no SEO impact)
- Mount in `AppShell` below footer or as last child so it overlays all pages

Copy (DE/EN, aligned with GDPR practice):
- DE: "Wir verwenden Cookies für nicht wesentliche Funktionen wie Karten. Du kannst zustimmen oder ablehnen." + buttons "Akzeptieren" / "Ablehnen"
- EN: "We use cookies for non-essential features such as maps. You can accept or decline." + buttons "Accept" / "Decline"

**Phase 5 hook:** export `getStoredConsent()` for future Maps island to check `decision === "accepted"` before loading embed.

### 3. Robots.txt — flat HonoX route at repo root routes level

`apps/web/app/routes/robots.txt.ts`:
- Export default handler returning `text/plain` with `Content-Type: text/plain; charset=utf-8`
- Rules (wildcard user-agent `*`):
  - `Allow: /` (base allow)
  - `Disallow: /*/admin/`
  - `Disallow: /*/partner/`
  - `Disallow: /*/profile/`
  - `Disallow: /*/bookings`
  - `Disallow: /*/saved`
  - `Disallow: /*/onboarding/`
  - `Disallow: /*/checkin`
  - `Disallow: /*/events/*/book`
  - `Disallow: /*/events/*/waitlist`
  - `Disallow: /*/login`
  - `Disallow: /*/signup`
  - `Disallow: /*/forgot-password`
  - `Disallow: /*/reset-password`
- Trailing line: `Sitemap: ${absoluteUrl("/sitemap.xml")}`

**Alternative considered:** Static `public/robots.txt`. Rejected — `Sitemap:` URL must use `SITE_URL` env var dynamically.

### 4. Sitemap.xml — static path list, both locales

`apps/web/app/routes/sitemap.xml.ts`:
- Export handler returning `application/xml`
- Static paths array (no locale prefix): `["/", "/discover", "/how-it-works", "/faq", "/membership", "/impressum", "/privacy", "/terms"]`
- For each path × each locale in `LOCALES` (`de`, `en`): emit `<url><loc>${absoluteUrl(localizedPath(path, locale))}</loc></url>`
- Root `/` becomes `/de` and `/en` (not bare `/` — matches canonical/hreflang rule in SEO doc)
- No `<lastmod>` in Phase 1 (static pages rarely change; optional enhancement)
- No event URLs

Expected count: 16 URLs.

### 5. OG fallback image — public asset + SEO helper default

- Create `apps/web/public/og-default.png` — 1200×630, `#FAFF86` background, Unveiled wordmark centered (simple branded placeholder; can be designed in Figma or generated programmatically)
- Add `DEFAULT_OG_IMAGE = absoluteUrl("/og-default.png")` helper or constant in `site-config.ts` or `seo.ts`
- Update `buildPageMeta()`: when `ogImage` is omitted, set `openGraph["og:image"]` and `twitter["twitter:image"]` to default
- Optionally pass default from `_renderer.tsx` so all marketing pages get fallback without per-route changes

**Rationale:** `seo-and-metadata.md` §2 requires OG image on every indexable page; marketing pages have no natural image.

### 6. SITE_URL documentation

`apps/web/DEPLOYMENT.md`:
- Add `SITE_URL` to env var table — Required for production/staging; default `http://localhost:3000` for local dev
- Add Phase 1 verification section: robots.txt curl, sitemap.xml curl (16 URLs), cookie banner browser test, View Source OG image on `/en/faq`
- Update staging status when operator deploys

### 7. Favicon — verify only

Existing `/favicon.svg` linked in `_renderer.tsx`. Verify HTTP 200 on staging; no change unless 404.

## Risks / Trade-offs

- **[Cookie banner flash on hydration]** → Banner hidden until client mount avoids false "no banner" SSR; acceptable for consent UX. Mitigation: keep island lightweight.
- **[localStorage cleared by user]** → Banner reappears — correct behavior per spec.
- **[OG image generation quality]** → Simple placeholder may look basic in social previews. Mitigation: branded yellow + wordmark is on-brand; replace with designed asset later without code change.
- **[Sitemap omits bare `/`]** → Correct per SEO doc — crawlers should use `/de/` and `/en/` canonical URLs, not the 302 root.
- **[Declining consent has no Phase 1 effect]** → Preference stored but unused until Phase 5 Maps. Document in code comment and DEPLOYMENT.md.

## Migration Plan

1. Implement cookie island, robots, sitemap, OG asset, SEO default in feature branch
2. Run `bun run typecheck`, `bun run lint`, `bun run build`
3. Local verification: curl robots/sitemap, browser cookie test, View Source on FAQ
4. Set `SITE_URL` on Railway staging service
5. Deploy to staging; run Phase 1 demo script
6. Archive OpenSpec change; merge spec deltas into `openspec/specs/`

Rollback: remove new routes and island mount; no database or auth impact.

## Open Questions

- _(none blocking)_ — OG placeholder can be a simple generated PNG; staging URL filled by operator after first Railway deploy.
