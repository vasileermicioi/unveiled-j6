## Why

Discovery step 01 shipped `listMemberFeedEvents` and related query contracts in `@unveiled/db`, but members still have no authenticated browsing surface. Phase 5 needs `/:locale/events` as an SSR, GET-driven feed so signed-in users can see today's events, filter, paginate, and open detail — before save/map UI lands.

## What Changes

- Add `apps/web` SSR route for `/:locale/events` (HonoX), gated to signed-in members; guests redirect to login with return URL.
- Parse GET params `category`, `partnerId`, `from`, `to`, `page` via feed URL helpers (mirror `admin-list` conventions); no client filter store.
- Build HeroUI-only page composition (`EventFeedPage`, `EventFeedFilters`, etc.): GET filter form, reset to today default, EventCard grid, pagination ("Showing X–Y of Z"), empty state, subscription-gate banner when subscription is not `ACTIVE`.
- Wire EventCard viewer/CTA from session (guest unreachable here; sold-out → detail/waitlist label; inactive → `/membership`; ACTIVE → detail or membership with Phase 5 "booking coming" messaging — no `/book` POST).
- Hide or disable bookmark control until discovery-03; prefer non-functional UI over half-working POST.
- Ensure member feed is `noindex` (auth-gated SEO).
- Partner/category select options from DB; i18n filter/empty copy from content inventory where listed.
- **Out of scope:** save/unsave + `/saved`; MapLibre `/events/map`; Playwright/Ladle for discovery; real booking/waitlist mutations.

## Capabilities

### New Capabilities

- _(none)_ — feed UI extends the existing `event-discovery` capability rather than introducing a separate capability name.

### Modified Capabilities

- `event-discovery`: Add authenticated SSR events feed page requirements (auth redirect, today default, GET filters/reset, empty state, EventCard CTA precedence without booking POSTs) on top of the existing query/persistence contracts from discovery-01.

## Impact

- **App:** `apps/web` — new route under `app/routes/[locale]/events/`, page components under `app/components/`, query helpers (e.g. `app/lib/event-feed.ts`), SEO/`noindex` for the feed.
- **Packages (consume only):** `@unveiled/db` (`listMemberFeedEvents` + filter option lists), `@unveiled/ui` (`EventCard` / `resolveEventCardCta`), `@unveiled/auth` (session / `requireAuth` / role gate).
- **Downstream:** Same query-param names consumed by `discovery-03-saved-events` and `discovery-04-event-map`.
- **Verification:** `bun run typecheck`, `bun run lint`, manual USER walkthrough (default today / filters / reset / empty / pagination).
- **Source:** `.dev-plan/current-iteration/discovery-02-member-feed.md`; behavior from `docs/migration/features/event-discovery.feature`, `pagination-and-search.md`, `authorization-matrix.md`, `seo-and-metadata.md`, sitemap `/events`.
