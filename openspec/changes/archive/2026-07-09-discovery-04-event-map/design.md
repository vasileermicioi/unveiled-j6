## Context

Discovery steps 01–03 shipped `listMemberFeedEvents`, authenticated `/:locale/events`, save/unsave, and `/saved`. Filter query helpers live in `apps/web/app/lib/event-feed.ts` (`category`, `partnerId`, `from`, `to`, `page`). Auth gate: `guardMemberFeedRoute` in `event-feed-route.ts`. Cookie consent is already stored under `unveiled:cookie-consent` via `apps/web/app/lib/cookie-consent.ts` (`getStoredConsent()` → `accepted` | `declined`).

`maplibre-gl` is already a dependency of `apps/web` (admin `EventGeoPicker` uses OSM raster tiles at `tile.openstreetmap.org` with attribution). There is no member `EventMap` island or `/events/map` route yet — Phase 4 left a placeholder / deferred consent E2E.

Product source: `.dev-plan/current-iteration/discovery-04-event-map.md`, `event-discovery.feature` (map mirrors filtered feed), `static-pages.feature` (consent gates map), `ui/ui-component-map.md`, `seo-and-metadata.md` (`noindex` on `/events/map`).

## Goals / Non-Goals

**Goals:**

- Ship `/:locale/events/map` as an auth-gated SSR page with a lazy-hydrated MapLibre + OSM island.
- Markers for the full filtered set (same filter semantics as the feed, no page slice), only events with `lat`/`lng`.
- Popup preview → event detail; list ↔ map links preserve filters.
- Consent gate: no MapLibre/tiles unless `decision === "accepted"`; static fallback otherwise.
- OSM attribution visible; no map API keys; `robots: "noindex"`.

**Non-Goals:**

- Booking / waitlist from popup; geocoding missing coordinates.
- Ladle/Playwright full discovery coverage (step 05) — keep accessible labels.
- Changing cookie-banner copy or Sentry gating.
- Replacing admin `EventGeoPicker` (reuse tile/style patterns only).
- Mandatory collapsible map on `/events` — optional reuse of the same island.

## Decisions

### 1. Query: full filtered set with a hard cap (not feed page)

Add `listMemberFeedMapEvents` (or extend discovery helpers) in `@unveiled/db` that reuses `memberFeedConditions` / the same filter window as `listMemberFeedEvents`, but:

- **No** `LIMIT 24` / page offset.
- `LIMIT` to a documented cap (e.g. **`MEMBER_FEED_MAP_MAX = 500`**) ordered by `date_time ASC, id ASC`.
- Prefer selecting only fields needed for markers (`id`, title, partner name/join or denormalized fields already on event, `lat`, `lng`, address) — full `Event` rows are acceptable if simpler.

**Rationale:** Spec says map mirrors the filtered feed, not the current page. Cap prevents pathological wide date ranges from shipping huge payloads to the island.

**Alternative considered:** Reuse `listMemberFeedEvents` with a huge page size — rejected; pollutes feed pagination contract.

**Alternative considered:** Same page only — rejected; contradicts product “mirrors filtered feed.”

### 2. Route + shared filter chrome

| Piece | Location |
|---|---|
| GET | `apps/web/app/routes/[locale]/events/map.tsx` (or `map/index.tsx` per HonoX file routing) |
| Page | `apps/web/app/components/discovery/EventMapPage.tsx` |
| Island | `apps/web/app/islands/EventMap.tsx` |
| Consent wrapper | thin client island or logic inside `EventMap` that reads `getStoredConsent()` before dynamic-importing `maplibre-gl` |

Reuse `guardMemberFeedRoute` + `parseEventFeedQuery` (ignore `page` for data load; still parse URL). Build list link with `buildEventFeedQueryString({ …filters })` without `page` (or preserve page if returning to list — prefer preserve filters only; page optional).

Pass serializable props:

```ts
type EventMapMarker = {
  id: string;
  title: string;
  partnerName: string;
  address?: string | null;
  lat: number;
  lng: number;
  href: string; // `/${locale}/events/${id}`
};
```

Server filters out null/invalid lat/lng before render. Empty markers → empty-state chrome (HeroUI), still show list link.

SEO: `robots: "noindex"` on every map render.

### 3. MapLibre island (client-only)

Mirror `EventGeoPicker` tile approach:

- Dynamic `import("maplibre-gl")` + CSS import for MapLibre styles inside the island only after consent accepted.
- Raster OSM source + attribution string `© OpenStreetMap contributors` (attribution control on, or custom HeroUI text + MapLibre attribution).
- Berlin-centered default when no markers; otherwise `fitBounds` to marker set with padding.
- Custom dark/yellow markers (DOM/`Marker` element styled with brand tokens — avoid inventing coordinates; style only).
- Popup: HeroUI-friendly content via MapLibre `Popup` HTML or a small overlay — title, partner, `Link` to detail. No book POST.
- Loading: HeroUI `Skeleton` until map `load`; error: HeroUI `Alert` on init failure.
- Cleanup: `map.remove()` on unmount.

**Lazy hydrate:** island boundary so SSR HTML includes page chrome + fallback/skeleton without blocking first paint (`seo-and-metadata.md`).

**CSP / Workers:** If Workers CSP blocks `tile.openstreetmap.org` or MapLibre workers, document `img-src` / `connect-src` / `worker-src` needs in handoff for step 05 / `DEPLOYMENT.md`. Prefer same tile URL as admin geo picker for consistency.

### 4. Cookie consent gating

Client-side only (consent lives in `localStorage`):

1. On mount, read `getStoredConsent()`.
2. If `decision !== "accepted"` (including `null` / declined / expired): **do not** import MapLibre; render static fallback — list of marker addresses/titles as HeroUI content + short prompt that maps need cookie acceptance (link to privacy; do not change banner copy).
3. If accepted: dynamic-import MapLibre and init.

Treat **unset** like declined for tile loading (strict: no third-party tiles until explicit accept). Banner still prompts on first visit via existing `CookieConsentBanner`.

**Alternative considered:** Server-side consent cookie — rejected; current storage is localStorage-only; keep consistency.

### 5. List ↔ map navigation

- On `/events`: add Map view `Link` → `/${locale}/events/map${buildEventFeedQueryString(filtersWithoutPage)}`.
- On `/events/map`: add List view `Link` → `/${locale}/events${…}`.
- Optional: collapsible map section on feed reusing `<EventMap markers={…} />` — only if cheap; **default ship dedicated route first**. If optional panel is added, load map markers with the same map query (full filtered set / cap), not the current page only — or skip panel to avoid double-fetch confusion.

### 6. No new env vars

Do not add `GOOGLE_MAPS_*` or any map key to `.env.example` / `DEPLOYMENT.md`. Confirm docs still say MapLibre + OSM, no key.

## Risks / Trade-offs

- **[Risk] OSM tile usage policy / rate limits** → Mitigation: reuse existing admin tile endpoint; keep map behind auth + consent; document attribution; if blocked in prod, swap to a compliant raster provider later without API-key product change.
- **[Risk] Workers CSP blocks tiles or MapLibre worker** → Mitigation: verify on staging; note CSP allowlist in DEPLOYMENT / step 05 handoff.
- **[Risk] Cap truncates large filtered sets silently** → Mitigation: document `MEMBER_FEED_MAP_MAX`; optional Alert when `total > cap` (“Showing first N on map”).
- **[Risk] Consent unset shows fallback while banner visible** → Mitigation: intentional (no tiles until accept); fallback copy points users to accept.
- **[Trade-off] Optional feed collapsible map deferred** → Dedicated `/events/map` satisfies sitemap; reduces scope risk.
- **[Trade-off] Popup “link to book” in Gherkin** → Phase 5 detail link only (booking Phase 6); matches iteration plan.

## Migration Plan

1. Add map list helper + export from `@unveiled/db`; no schema migration.
2. Implement island + map route + feed/map links; wire consent gate.
3. `bun run typecheck` && `bun run lint`.
4. Manual checks: filters→markers, popup→detail, decline→no tiles, attribution, no new env keys.
5. Mark step 04 done in `discovery-parent-guide.md`; note CSP/bundle caveats for step 05.
6. Rollback: revert route/island/helper — no DB migration.

## Open Questions

- None blocking — cap value **500** and “optional collapsible map = skip unless trivial” are decided above; adjust only if product asks.
