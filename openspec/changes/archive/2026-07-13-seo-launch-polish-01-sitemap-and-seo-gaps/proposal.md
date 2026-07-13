## Why

Phase 8 SEO launch polish starts here: `sitemap.xml` still lists only marketing/legal locale URLs, so crawlers never discover public bookable `/events/:id` pages. Product SoT (`docs/product/extras/seo-and-metadata.md`) requires those URLs with `lastmod`, plus an audit that robots/hreflang/sold-out `noindex`/FAQPage still match the doc, and closure of the old “credits roll over” inventory warning now that membership perks copy is corrected.

## What Changes

- Extend `/sitemap.xml` to include both locales of **currently bookable** public event detail URLs (`remaining_capacity > 0`, future `date_time`), with `lastmod` from `updated_at`
- Keep marketing/legal locale URLs; never include member `/events` feed, sold-out/past events, bare `/`, or auth/private paths
- Audit and fix any remaining SEO gaps vs `seo-and-metadata.md` (robots.txt disallow list, event detail `noindex, follow`, hreflang alternates, FAQPage JSON-LD)
- Align rollover copy: confirm app membership perks have no roll-over claim; update `content-i18n-inventory.md` to mark `perks[2]` corrected
- Add lightweight unit/fixture coverage for the sitemap builder (event URLs in, feed path out)

**Out of scope:** 403/500 pages; Sentry; full Playwright SEO audit; partner routes; `seo-launch-polish-02` / `03`

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `static-marketing-pages`: Replace Phase-1-only static sitemap with a dynamic sitemap that still lists marketing/legal locales and also both locales of currently bookable `/events/:id` (with `lastmod`); exclude member feed and bare `/`
- `credits-subscription`: Marketing and membership perk copy MUST state fresh monthly credits and MUST NOT claim credits roll over (close inventory warning)

## Impact

- **Code:** `apps/web/app/routes/sitemap.xml.ts` (+ extractable builder for tests); optional thin catalog query in `@unveiled/db` for bookable sitemap rows; verify `seo.ts`, `robots-config.ts`, FAQ route JSON-LD; membership content already corrected in `membership.ts` — confirm + grep
- **Docs:** `.dev-plan/current-iteration/seo-launch-polish-01-sitemap-and-seo-gaps.md` (step plan); mark step 01 done in `seo-launch-polish-parent-guide.md`; update `docs/product/extras/content-i18n-inventory.md` `perks[2]` warning → corrected; update `docs/product/extras/seo-and-metadata.md` only if implementation exposes a doc gap
- **Downstream:** Consumed by `seo-launch-polish-02-error-pages-and-sentry`, `seo-launch-polish-03-mvp-audit-and-cutover`
- **Verification:** `bun run lint`, `typecheck`; sitemap XML includes `/events/` when fixtures/seed have a bookable event and excludes `/:locale/events` feed; grep confirms no “roll over” / “rollen mit” perk claims in app content
