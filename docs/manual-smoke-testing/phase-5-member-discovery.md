# Phase 5 — Manual smoke test

Member discovery feed, save, map. Client demo: *This is the member app — filter by neighborhood, save favorites, map view.*

**Booking / Stripe remain Phase 6** — CTAs may point at membership or detail only.

## Setup

1. App running with auth + catalog seed (`bun run seed:demo` if empty).
2. Signed-in member (`USER` or demo `E2E_USER_*`) with onboarding complete.
3. Stable seed titles after seed:

| Title | Role |
|---|---|
| `Tonight: Stadt ohne Schlaf` | Today (Berlin evening) — default feed |
| `Past Premiere: Archive Night` | Past — hidden from feed/map |
| `Tartuffe — Molière` | Future Theater |
| `Exhibition Opening: Material Echoes` | Future Ausstellung |
| `Global Sound Forum` | Future Konzert |

---

## A. Feed & filters

1. Open `/events` — default **Today (Europe/Berlin)**; see `Tonight: Stadt ohne Schlaf`.
2. Filter by category / partner / date range → results update (SSR query params).
3. Reset filters; empty range shows no-results copy.
4. Confirm past event title stays off the feed.

## B. Save

1. Save an upcoming event from the feed or detail.
2. Open `/saved` — event listed.
3. Unsave → removed from Saved.

## C. Map

1. From the feed, open **Map view** (`/events/map`).
2. Accept non-essential cookies if prompted → MapLibre + OSM tiles + markers for the filter set.
3. Decline cookies (fresh profile) → address-list fallback (no OSM tile requests).
4. Open an event from the map/list link → public detail (no booking POST yet).

## D. Guest vs member

1. Guest `/events` → login/signup with return path.
2. Guest can still open public `/events/:id` from Discover.

## E. Quick negatives (optional)

- No Stripe Checkout / atomic book in this phase.
- Past events not on map.
- Yellow background app-wide.

## Related docs

- `apps/web/DEPLOYMENT.md` — Phase 5
- `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` — Baseline Phase 5
- `docs/product/features/event-discovery.feature`
- `docs/product/sitemap/sitemap.md`
