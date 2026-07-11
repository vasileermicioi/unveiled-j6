# Pagination & Search (MVP)

All list search/pagination = GET + full SSR (works without JS). Apply to `/events`, `/bookings`, `/admin/*` lists. Partner guest-list pagination is **post-MVP**.

## Conventions

New for the rewrite — the old app never paginates anything (it loads full Firestore collections client-side and filters/searches in memory: `AdminPanel.tsx`'s member/partner/event lists, `PartnerPortal.tsx`'s guest list, and the events feed all do this). That was viable at seed-data scale; it is not a real design to carry forward, and it's also the wrong shape for the project's **SSR-only** requirement, which explicitly extends to list/search/pagination interactions, not just create/edit/delete forms. This document is the single set of conventions every list view in `sitemap/sitemap.md` should follow, so pagination/search isn't reinvented per-page or, worse, silently reimplemented as client-side state that quietly breaks the SSR requirement (an infinite-scroll list fetched via a client-side `fetch` after the initial page load, or a search box that filters an already-downloaded full array in the browser, are exactly the kind of thing that *looks* fine in a demo but isn't real SSR).

## 1. The rule

**Every paginated or searchable list is a GET request that produces a fully server-rendered page.** No exceptions for "just" a search box or "just" a page-2 link. Concretely:

- Pagination and search state live in the URL's query string, not in client-side component state, a store, or a client-side cache.
- The page works with JavaScript disabled: a `<form method="get">` for search/filter inputs, and plain `<a href="?page=2">`-style links for pagination — both trigger a normal full-page navigation.
- Progressive enhancement is fine and encouraged **on top of** that baseline (see §4), but the no-JS path must produce the same server-rendered result. Nothing about "SSR-only" means "no client-side JS anywhere" — it means the result is never dependent on client-side JS to exist, per `README.md`'s framing of the whole rewrite.
- This is a direct extension of the pattern `sitemap/sitemap.md` already established for filters (`/events?category=&partnerId=&from=&to=`) — pagination and search are the same mechanism, not a different one.

## 2. Query parameter conventions

Consistent names across every list route, so a developer only learns this once:

| Param | Meaning | Example |
|---|---|---|
| `page` | 1-indexed page number. Omitted or `1` = first page. | `?page=3` |
| `q` | Free-text search term | `?q=hoffmann` |
| `sort` | Sort column, optionally prefixed `-` for descending | `?sort=-createdAt` |
| (route-specific filters) | e.g. `category`, `partnerId`, `from`, `to`, `status`, `eventId` — already named per-domain in `sitemap/sitemap.md` and the feature files | `?category=Theater` |

Fixed page size per list (no `pageSize` param exposed to users — avoids letting a scraper request an absurdly large page). Recommended defaults, tunable per list without needing user-facing config:

| List | Suggested page size | Why |
|---|---|---|
| `/events` (member feed) | 24 | Grid of `EventCard`s, ~2–4 rows depending on breakpoint |
| `/admin/events`, `/admin/partners` | 25 | Standard admin table page size |
| `/admin/users` | 25 | Same |
| `/partner/guests` | 50 | Guest lists are read in bulk before a door shift, denser rows suit a bigger page |
| `/bookings` ("My Tickets") | 20 | Personal list, small by nature |
| `/admin/bookings/export`, `/admin/events/:id/codes`, partner guest-list export | N/A — exports are not paginated (they stream/generate the full filtered CSV in one response, matching the existing `admin-events.feature`/`partner-portal.feature` export scenarios) | Exports and paginated views are different operations even when they share the same filters |

## 3. What "search" means for each list, precisely

Every search scenario already described in the feature files becomes an SSR `q` param against the appropriate columns — restating them here as the single implementation contract:

| Route | Searches | Backing scenario |
|---|---|---|
| `/admin/users?q=` | name, email, role (`admin-users.feature` "Search members") | Server-side `ILIKE`/trigram match, not a client-side filter over a preloaded list |
| `/partner/guests?q=` | booking id, redemption code (`partner-portal.feature` "Search the guest list") | Same |
| `/admin/events`, `/admin/partners` | Event title + denormalized partner name (`/admin/events`); partner **name only** (`/admin/partners`) — decided for the rewrite so admins can search growing catalog lists without scrolling hundreds of rows |

Result ordering for search is decided per list to match the existing "sorted by name, then email" convention (`admin-users.feature`) as the default `sort`, with relevance-style ordering only worth adding later if simple alphabetical/date ordering proves insufficient once there's real data volume.

## 4. Progressive enhancement (optional, does not change the SSR contract)

It's reasonable — and doesn't violate anything above — to layer a small amount of client-side JS on top of the plain `<form method="get">` for a nicer feel, as long as the fallback keeps working:

- Auto-submit the filter/search form on `change`/debounced `input` instead of requiring an explicit "Apply" click, *as long as* it does so via a real navigation (`form.requestSubmit()` / setting `window.location`), not a `fetch` that swaps in JSON and re-renders client-side. The network tab should show a normal document navigation either way.
- Pagination links can prefetch the next page's HTML on hover/viewport-entry for perceived speed — still a real link to a real server-rendered URL, just requested early.
- None of this needs a client-side router, a data-fetching library, or client-side state that mirrors server state — see `extras/integrations-and-config.md`'s note that TanStack Query becomes optional/rare in this app precisely because of this pattern.

## 5. Pagination UI

- Render page numbers (or at minimum prev/next) as real `<a>` elements with real `href`s (`?page=N`, preserving every other active query param) — never buttons wired to client-side-only state.
- Show total-count context ("Showing 1–25 of 143") server-side from the same query's `COUNT(*)`, not by exposing all rows and counting client-side.
- For SEO-indexable paginated content specifically (there currently isn't any — `/events` and admin/partner lists are all behind auth, see `extras/seo-and-metadata.md` §1), `rel="next"`/`rel="prev"` link tags would apply; not needed today since no paginated list is public, but keep the convention in mind if a public paginated view (e.g. a public partner directory) is ever added.

## 6. Database-level implementation note

Every paginated query needs a stable `ORDER BY` (ties broken by `id`, so `LIMIT`/`OFFSET` — or better, keyset/cursor pagination once lists get large — don't reshuffle rows between page loads) plus the matching indexes from `database/schema-overview.md`'s "Indexes to replicate" table. `OFFSET`-based pagination is simplest and fine at this product's scale (curated catalog, not a firehose); revisit with keyset pagination only if a specific list's row count grows large enough for `OFFSET` to become a measured performance problem.
