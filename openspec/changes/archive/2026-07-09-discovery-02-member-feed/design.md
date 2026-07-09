## Context

Discovery-01 shipped `@unveiled/db` contracts: `listMemberFeedEvents` (today default, filters, page size 24), Berlin day helpers, and `saved_events` CRUD (unused until step 03). Public marketing Discover and `/events/:id` already use `EventCard` / `toEventCardItem`. Admin lists demonstrate GET pagination via `apps/web/app/lib/admin-list.ts` and `guardAdminRoute` (session + login redirect with `returnTo`).

There is no `/:locale/events` index route yet. Session (`AppSession`) exposes role/credits/onboarding but **not** subscription status — ACTIVE vs INACTIVE must be loaded from `subscriptions` for the gate banner and EventCard viewer. Sitemap marks `/events` as **USER**-only and auth-gated → `noindex`.

This is discovery step 02 of 4: **authenticated SSR member feed UI only**. Save/map/E2E come later.

Source: `.dev-plan/current-iteration/discovery-02-member-feed.md`, `event-discovery.feature` (feed scenarios), `pagination-and-search.md`, `ui-component-map.md` (Event feed), `authorization-matrix.md`, `seo-and-metadata.md`, `content-i18n-inventory.md` (`filters`).

## Goals / Non-Goals

**Goals:**

- Serve `/:locale/events` as a fully SSR page for signed-in members, driven by GET `category`, `partnerId`, `from`, `to`, `page`.
- Guest → login redirect with `returnTo` preserving the requested feed URL (including query string when practical).
- Filter form (`method="get"`), reset to today default, EventCard grid, pagination with "Showing X–Y of Z", empty state, subscription-gate banner.
- Wire EventCard CTA hrefs without booking/waitlist POSTs; hide/disable bookmark until step 03.
- `robots: "noindex"` on the feed; HeroUI-only page components; queries stay in `@unveiled/db`.

**Non-Goals:**

- `/saved`, save/unsave POST, MapLibre `/events/map`, Ladle/Playwright for discovery.
- Real `/book` or waitlist mutations (Phase 6/7).
- Changing `listMemberFeedEvents` semantics (already correct).
- Extending `AppSession` with subscription globally (load per-route for now unless a tiny helper is cleaner).

## Decisions

### 1. Auth gate: `guardMemberFeedRoute` (mirror admin pattern)

Add `apps/web/app/lib/event-feed-route.ts` (or extend a shared member-guard helper) that:

1. Resolves locale from the path param.
2. `getSession(c)` — if null → `302` to `buildLoginRedirectUrl(locale, pathname + search)` so filters survive login.
3. Role: allow `USER` (sitemap). **Decision:** also allow `ADMIN` to browse the same member UX (useful for demos); redirect `PARTNER` to `/${locale}/partner` (or home) — partners have their own portal.
4. Do **not** use `@unveiled/auth` middleware that returns JSON 401 — HTML pages need redirects (same as `guardAdminRoute`).

**Alternative considered:** `requireRole("USER")` middleware — rejected because it returns JSON and does not set `returnTo`.

### 2. Query-param helpers: `apps/web/app/lib/event-feed.ts`

Mirror `admin-list.ts`:

```ts
type EventFeedQuery = {
  category?: string;
  partnerId?: string;
  from?: string; // YYYY-MM-DD
  to?: string;
  page: number;
};

parseEventFeedQuery(url: URL): EventFeedQuery
buildEventFeedQueryString(query: EventFeedQuery): string  // omit page=1; omit empty filters
clampEventFeedPage(page, total): number  // MEMBER_FEED_PAGE_SIZE = 24 from @unveiled/db
eventFeedPageRedirectPath(basePath, query, total): string | null
```

Pass parsed filters into `listMemberFeedEvents(db, { ...filters, page })`. Clamp oversize `page` with a 302 (admin list pattern).

**Contract for map step:** same param names — document in a short comment or parent-guide note after ship.

### 3. Route + page composition

| Piece | Location |
|---|---|
| GET handler | `apps/web/app/routes/[locale]/events/index.tsx` (alongside existing `[id].tsx`) |
| Page shell | `apps/web/app/components/discovery/EventFeedPage.tsx` |
| Filters | `apps/web/app/components/discovery/EventFeedFilters.tsx` |
| Pagination / empty / banner | colocated in discovery components or small siblings |

Route responsibilities only: guard → parse query → load subscription + feed + filter options → map to `EventCardItem` → `c.render(<EventFeedPage …>, { title, locale, robots: "noindex" })`.

Filter form: HeroUI `Select` (category, partner), date `Input`s (`from`/`to`), submit via GET; Reset is a `Link` to `/${locale}/events` (clears all params → today default). No Radio/Checkbox. Active date-range label when `from`/`to` present.

Copy: `filters.title/from/to/reset/noResults` from `content-i18n-inventory.md`; pagination "Showing X–Y of Z" can follow admin list EN/DE patterns already in the app.

### 4. Subscription status + CTA hrefs

Load `subscriptions` for `session.user.id` in the route (Drizzle query or small `@unveiled/db` helper if one exists; otherwise inline `db.query.subscriptions.findFirst`).

```ts
viewer = { kind: "member", subscriptionActive: status === "ACTIVE", saved: false }
```

| Card state | CTA href |
|---|---|
| Sold out | `/${locale}/events/${id}` (Waitlist label; no waitlist POST) |
| Inactive sub | `/${locale}/membership` |
| ACTIVE | `/${locale}/events/${id}` (Book Now label; Phase 5 — no book POST; optional page-level banner that booking arrives in Phase 6) |

Page-level `Banner`/`Alert` when `!subscriptionActive` (subscription gate). Bookmark: omit `onBookmarkToggle` so control stays disabled (EventCard already disables without handler).

### 5. Filter option lists

- **Categories:** reuse admin category option list (`getEventCategoryOptions` / same canonical set as event forms) — not a distinct-from-DB query unless already available; keeps Select values aligned with seeded/admin categories.
- **Partners:** `listPartners(db, { limit: … })` for venue Select (id + name). Cap at a reasonable limit for the curated catalog.

**Alternative considered:** distinct categories from events table — nicer for sparse data but diverges from admin taxonomy; defer unless product asks.

### 6. SEO

Pass `robots: "noindex"` (and optionally `noindex, follow`) on every feed render. Do not add `/events` to public sitemap.xml. Auth-gated lists are not indexable per `seo-and-metadata.md`.

## Risks / Trade-offs

- **[Risk] Empty "today" feed on staging** if seed events are not same-day → Mitigation: verification steps include forcing `from`/`to` and empty filters; seed/demo may need same-day events for the default-path smoke (document in DEPLOYMENT if needed; do not expand seed scope unless required for manual check).
- **[Risk] ADMIN vs USER gate ambiguity** → Mitigation: allow ADMIN browse; PARTNER redirected; guests login — matches practical ops without violating USER-primary sitemap.
- **[Risk] ACTIVE "Book Now" implies booking works** → Mitigation: CTA goes to detail (or membership) with clear Phase 5 banner; no `/book` route wired.
- **[Trade-off] Subscription loaded per request, not on session** → Extra DB read; acceptable at feed traffic; revisit if many member pages need status.
- **[Trade-off] Bookmark visible but disabled** → Slightly odd UX vs hidden; EventCard already supports disabled without handler — prefer that over a fake POST.

## Migration Plan

1. Implement helpers + components + route; no DB migration (schema already from step 01).
2. `bun run typecheck` / `bun run lint`.
3. Manual USER smoke on `bun run dev`.
4. Mark step 02 done in `discovery-parent-guide.md`; note query-param contract for map.
5. No rollback beyond reverting the route/components — no schema change.

## Open Questions

- None blocking. If product later forbids ADMIN on `/events`, tighten the guard to `USER` only in one place.
