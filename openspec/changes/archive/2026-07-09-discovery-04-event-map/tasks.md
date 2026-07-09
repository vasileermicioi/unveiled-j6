## 1. Setup and query contract

- [x] 1.1 Confirm `listMemberFeedEvents` / `memberFeedConditions` patterns, `parseEventFeedQuery` / `buildEventFeedQueryString`, `guardMemberFeedRoute`, and `getStoredConsent` / `CONSENT_STORAGE_KEY` against current code
- [x] 1.2 Confirm `maplibre-gl` is already in `apps/web` and reuse `EventGeoPicker` OSM raster + attribution approach (no new map API keys)
- [x] 1.3 Add `MEMBER_FEED_MAP_MAX` (500) and `listMemberFeedMapEvents` in `@unveiled/db` reusing feed filter semantics without page slicing; export from package entrypoints / README
- [x] 1.4 Add or extend discovery integration/unit coverage for map list (filters, past exclusion, cap, coords not required at query layer)

## 2. EventMap island

- [x] 2.1 Create `apps/web/app/islands/EventMap.tsx` with serializable marker props (`id`, `title`, `partnerName`, `address?`, `lat`, `lng`, `href`)
- [x] 2.2 Gate MapLibre dynamic import on `getStoredConsent()?.decision === "accepted"`; otherwise render HeroUI static fallback (title/address list + consent prompt) with no tile requests
- [x] 2.3 On accept: init MapLibre + OSM raster tiles, dark/yellow markers, popup preview linking to detail, loading `Skeleton`, error `Alert`, visible OSM attribution, `fitBounds` / Berlin default, cleanup on unmount

## 3. Map SSR route and navigation

- [x] 3.1 Add `EventMapPage` (HeroUI chrome): list-view link preserving filters, empty/no-coords messaging, optional cap warning, mount `EventMap` island
- [x] 3.2 Implement `GET /:locale/events/map` — `guardMemberFeedRoute`, parse feed filters (ignore page for data), `listMemberFeedMapEvents`, filter valid lat/lng into markers, `robots: "noindex"`
- [x] 3.3 Add map ↔ list `Link`s on `/events` and `/events/map` via `buildEventFeedQueryString` (preserve `category`/`partnerId`/`from`/`to`; omit or ignore `page` on map)
- [x] 3.4 Skip collapsible map on feed unless trivial reuse; do not duplicate filter logic

## 4. Docs and env hygiene

- [x] 4.1 Confirm `.env.example` and `apps/web/DEPLOYMENT.md` have no map API keys; note MapLibre + OSM + any CSP/`tile.openstreetmap.org` Workers caveats for step 05

## 5. Verification and cleanup

- [x] 5.1 Run `bun run typecheck` and `bun run lint`
- [x] 5.2 Manual checklist: filters on `/events` → map markers match (with coords); popup → detail; decline consent → fallback + no OSM tile requests; attribution visible when map loads
- [x] 5.3 Mark step 04 done in `discovery-parent-guide.md`; hand off CSP/bundle notes to `discovery-05-stories-e2e-release`
