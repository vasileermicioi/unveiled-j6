## Context

Phase 8 `seo-launch-polish-01`. Today `apps/web/app/routes/sitemap.xml.ts` builds a static XML list of marketing/legal paths for `de`/`en` only — no event URLs. Product SoT (`docs/product/extras/seo-and-metadata.md`) requires both locales of **currently bookable** public event detail URLs with `lastmod` from `updated_at`, and forbids the member feed and bare `/`.

Most other SEO surfaces already match the doc:

- `eventDetailPageMeta` → `noindex, follow` when not bookable (`remainingCapacity > 0` && future `dateTime`)
- `buildPageMeta` → reciprocal hreflang + `x-default` → `de`
- `buildFaqPageJsonLd` on `/faq`
- `robots-config.ts` disallow list + `Sitemap:` line (align with seo doc; fix only if drift)

Membership perks in `apps/web/app/lib/content/membership.ts` already say “17 Credits jeden Monat” / “17 fresh credits every month”; `content-i18n-inventory.md` still warns that `perks[2]` needs correction.

`listUpcomingEvents` returns future events without filtering `remaining_capacity > 0`, so sitemap needs a dedicated bookable query (or filtered list), not a blind reuse of Discover preview.

## Goals / Non-Goals

**Goals:**

- Dynamic `/sitemap.xml` = marketing/legal locales + both locales of bookable `/events/:id` with `lastmod`.
- Exclude member `/events` feed, sold-out/past events, bare `/`.
- Close SEO audit gaps if any (robots, hreflang, noindex, FAQPage).
- Inventory doc marks `perks[2]` corrected; grep app content for rollover claims.
- Unit/fixture test for sitemap builder.

**Non-Goals:**

- 403/500 pages, Sentry (`seo-launch-polish-02`).
- Full Playwright SEO audit / MVP cutover (`seo-launch-polish-03`).
- Partner portal routes; hard-404 sold-out events; sitemap index sharding.
- Changing event detail booking gates or indexability rules beyond verifying existing behavior.

## Decisions

### 1. Extract pure sitemap builder + async route load

```
apps/web/app/lib/sitemap.ts          # buildSitemapXml(entries) — pure, unit-tested
apps/web/app/routes/sitemap.xml.ts   # load static paths + bookable events → builder
packages/db/src/catalog/…            # listBookableEventsForSitemap(db, { now? })
```

`SitemapUrlEntry = { loc: string; lastmod?: string }` (ISO date or full datetime per sitemap convention — prefer `YYYY-MM-DD` from `updated_at` in Europe/Berlin or UTC ISO truncated; document choice in code comment).

Route: if `DATABASE_URL` missing, emit static-only sitemap (same as today) rather than 500 — Workers without DB should still serve marketing URLs.

**Rationale:** Pure builder enables fixture tests without DB; domain query belongs in `@unveiled/db` with other catalog reads.

**Alternatives:** Inline SQL in the route — violates “business logic in packages”. Reuse `listUpcomingEvents` then filter in app — duplicates bookable definition; prefer one SQL predicate matching `isEventBookable` / `eventDetailPageMeta`.

### 2. Bookable predicate (single definition)

Bookable for sitemap **and** indexability:

```
date_time > now AND remaining_capacity > 0
```

Same as `eventDetailPageMeta` / `isEventBookable`. Query columns needed: `id`, `updated_at`. Cap with a high limit (e.g. 5000) or unbounded with comment — MVP catalog is small; document upper bound if added.

Do **not** include draft/unpublished semantics beyond what the public catalog already uses (all rows in `events` are public catalog today).

### 3. URL set rules

| Include | Exclude |
|---|---|
| Both locales × static paths (`""`, how-it-works, faq, membership, impressum, privacy, terms) | Bare `/` |
| Both locales × `/events/:id` for bookable events | `/:locale/events` (feed, no id) |
| `lastmod` on event URLs from `updated_at` | Sold-out / past |
| Optional `lastmod` on static — omit or deploy build time; not required by SoT | Auth, admin, book, waitlist, profile, … |

Static paths stay without requiring DB. Absolute URLs via existing `absoluteUrl` + `localizedPath`.

### 4. SEO audit checklist (fix only if broken)

1. `robots.txt` disallow paths vs seo-and-metadata §5 (current list already close; add missing patterns only).
2. Event detail: spot-check sold-out/past → `robots: noindex, follow`; bookable → no robots meta (indexable).
3. Marketing pages: hreflang de/en/x-default present via `_renderer`.
4. FAQ: `FAQPage` JSON-LD still emitted from `faq.tsx`.
5. Grep app content modules for “roll over” / “rollen mit” (excluding docs that describe the ban).

### 5. Credits copy / inventory

- App: confirm `membership.ts` perks[2] already corrected; fix any other marketing strings if grep finds them.
- Docs: change inventory callout from ⚠️ Needs copy correction → ✅ Resolved with the shipped DE/EN strings.

### 6. Tests

- Unit: `buildSitemapXml` with fixture entries — asserts `/de/events/{id}` and `/en/events/{id}` present; asserts no `/de/events` or `/en/events` without trailing id segment; asserts static `/de/faq` present; XML well-formed enough (contains `<urlset`, escaped locs).
- Optional: catalog query unit with mocked db or integration skip-if-no-DB — nice-to-have; prefer builder test as minimum done-when.
- Existing `robots-config.test.ts` — extend only if disallow list changes.

## Risks / Trade-offs

- **[Sitemap hits DB on every crawl]** → Mitigation: cheap indexed filters on `date_time` / `remaining_capacity`; optional later cache/CDN; MVP volume is fine.
- **[Stale sold-out still in sitemap until next crawl]** → Acceptable; `noindex, follow` on the page is the hard gate; sitemap should still prefer bookable-only query.
- **[DATABASE_URL missing on some deploys]** → Static-only fallback; document in handoff.
- **[Divergent “bookable” helpers]** → Mitigation: share predicate comment or small shared helper used by meta + query docs; do not invent a third definition.
- **[Inventory table still shows old DE/EN for perks[2]**]** → Update table cells to corrected strings when resolving the warning so the catalog is not contradictory.

## Migration Plan

1. Add `listBookableEventsForSitemap` (or equivalent) in `@unveiled/db` and export.
2. Extract `buildSitemapXml` / wire route to load events + static paths.
3. Add unit test; run lint + typecheck.
4. Audit robots/SEO/FAQ/hreflang; fix gaps only.
5. Update inventory doc; mark step 01 done in parent guide.
6. Staging smoke: `curl $SITE_URL/sitemap.xml` after seed — expect `/events/` URLs when bookable seed exists.

Rollback: revert route + query; static-only sitemap returns.

## Open Questions

- None blocking. At apply time, confirm whether Workers always have `DATABASE_URL` in staging (expected yes for Phase 4+); keep static fallback anyway.
