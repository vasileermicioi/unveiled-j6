## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/seo-launch-polish-01-sitemap-and-seo-gaps.md`, parent guide, `docs/product/extras/seo-and-metadata.md`, and current `sitemap.xml.ts` / `robots-config.ts` / `seo.ts`
- [x] 1.2 Diff robots disallow list, event detail `noindex, follow`, hreflang, and FAQPage JSON-LD against the seo doc; note any gaps
- [x] 1.3 Confirm `membership.ts` perks[2] already corrected vs inventory warning; grep app content for “roll over” / “rollen mit”

## 2. Bookable events query and sitemap builder

- [x] 2.1 Add `@unveiled/db` catalog query for bookable sitemap rows (`date_time` future, `remaining_capacity > 0`) returning at least `id` + `updated_at`; export from package
- [x] 2.2 Extract pure `buildSitemapXml(entries)` (escape XML; optional `lastmod`) into `apps/web/app/lib/sitemap.ts` (or equivalent)
- [x] 2.3 Wire `sitemap.xml.ts` to emit marketing/legal locale URLs plus both locales of bookable `/events/:id` with `lastmod` from `updated_at`; exclude member feed and bare `/`; static-only fallback when DB unavailable

## 3. SEO audit and copy alignment

- [x] 3.1 Fix any robots.txt / meta / hreflang gaps found in 1.2 (minimal diffs only)
- [x] 3.2 Spot-check FAQ still emits FAQPage JSON-LD; fix only if broken
- [x] 3.3 Update `docs/product/extras/content-i18n-inventory.md` — mark `perks[2]` corrected and align table DE/EN with shipped strings; fix any remaining app rollover claims

## 4. Tests

- [x] 4.1 Add unit/fixture test for sitemap builder — bookable event URLs in both locales; no `/:locale/events` feed path; marketing URL present
- [x] 4.2 Extend `robots-config` tests only if disallow list changed

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 5.2 With seed DB (or document fixture path): confirm sitemap XML includes at least one `/events/` URL when a bookable event exists and excludes the member feed path
- [x] 5.3 Mark step 01 done in `seo-launch-polish-parent-guide.md`; handoff for `seo-launch-polish-02`; update `docs/product/extras/seo-and-metadata.md` only if behavior diverged from the doc
