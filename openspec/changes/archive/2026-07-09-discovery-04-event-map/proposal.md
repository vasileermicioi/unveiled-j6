## Why

Discovery steps 01–03 shipped the authenticated feed, filters, and saved events, but members still have no map view of the filtered set. Phase 5 needs `/:locale/events/map` as a consent-gated MapLibre + OSM island that mirrors feed filters, so members can browse by location before booking lands in Phase 6.

## What Changes

- Add `apps/web/app/islands/EventMap.tsx` — lazy-hydrated MapLibre GL JS + OpenStreetMap tiles client island with dark/yellow markers, popup preview (title, partner, link to `/:locale/events/:id`), loading skeleton, error alert, and required OSM attribution.
- Add authenticated SSR route `/:locale/events/map` — same auth gate as `/events`; server loads the full filtered event set (same `category` / `partnerId` / `from` / `to` semantics as the feed, without page slicing, with a documented upper bound); passes serializable marker props to the island; `noindex` robots metadata.
- Gate MapLibre/tile loading behind cookie consent (`unveiled:cookie-consent`); when declined or unset-as-declined, show a static fallback (address list and/or consent prompt) and do not request OSM tiles.
- Add list ↔ map navigation links that preserve the active filter query string.
- Optionally embed a collapsible map panel on `/events` reusing the same island (do not duplicate filter logic).
- Add `maplibre-gl` as a client-bundle dependency in `apps/web`; no map API key env vars.
- **Out of scope:** booking from map popup; geocoding events missing `lat`/`lng`; inventing coordinates; Ladle/Playwright full coverage (step 05); changing global cookie-banner copy; Google Maps / `GOOGLE_MAPS_*`.

## Capabilities

### New Capabilities

- _(none)_ — map view extends the existing `event-discovery` and `static-marketing-pages` capabilities.

### Modified Capabilities

- `event-discovery`: Add authenticated filtered map view at `/:locale/events/map` (MapLibre + OSM, markers for events with coordinates, popup → detail, list↔map filter preservation).
- `static-marketing-pages`: Update cookie-consent map gating from Phase 1 placeholder (“no map yet”) to real behavior — declining non-essential cookies MUST NOT load MapLibre/OSM tiles and MUST show a static fallback.

## Impact

- **App:** `apps/web` — new `EventMap` island, `/:locale/events/map` route + page chrome, feed↔map links (and optional collapsible map on feed), consent-aware wrapper around the island; may extend `event-feed` helpers for shared filter query strings without `page`.
- **Packages:** `@unveiled/db` — reuse `listMemberFeedEvents` filter semantics (likely a map-oriented call: same filters, no page slice / higher cap); `@unveiled/auth` for session gate; no new packages.
- **Deps:** `maplibre-gl` in `apps/web` (client island only); CSP / Workers bundle notes for OSM tile hosts if needed.
- **Env / docs:** Confirm no new map API keys in `.env.example` / `DEPLOYMENT.md`; handoff CSP caveats for step 05.
- **Downstream:** Consumed by `discovery-05-stories-e2e-release`.
- **Verification:** `bun run typecheck`, `bun run lint`; manual filter→map marker match, popup→detail, consent-declined no tile requests, OSM attribution visible.
- **Source:** `.dev-plan/current-iteration/discovery-04-event-map.md`; `docs/migration/features/event-discovery.feature`, `static-pages.feature`, `ui/ui-component-map.md`, `sitemap/sitemap.md`, `extras/integrations-and-config.md`, `seo-and-metadata.md`.
