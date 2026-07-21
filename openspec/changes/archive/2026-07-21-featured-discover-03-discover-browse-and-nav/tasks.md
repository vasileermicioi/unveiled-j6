## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/featured-discover-03-discover-browse-and-nav.md` and parent guide defaults (active = booking-eligible; ADMIN keeps Discover; footer Discover stays)
- [x] 1.2 Confirm prerequisites: `listFeaturedEvents(..., { upcomingOnly: true })`, `isBookingEligibleStatus`, Featured admin tab exists, Discover still uses `listUpcomingEvents`
- [x] 1.3 Skim wiring: `_middleware.tsx`, `_renderer.tsx`, `AppNavbar` / `AppNavbarMenu`, `member-app-route.ts`, `discover.tsx`, `events/index.tsx`, `events/map.tsx`

## 2. Shell subscription flag and nav/logo swap

- [x] 2.1 Load USER subscription in locale middleware; set `canBrowseEvents` via `isBookingEligibleStatus` (fail closed to false); extend `ContextVariableMap` + pass through renderer → `AppShell` → navbar/menu
- [x] 2.2 Add shell copy for Browse events / Events entdecken (reuse existing product phrasing); resolve first marketing nav item label+href from `canBrowseEvents` in sticky header and drawer
- [x] 2.3 USER logo: booking-eligible → `/events`, else → `/discover`; keep ADMIN → `/admin`, guest home unchanged
- [x] 2.4 Update navbar/shell stories for inactive vs active USER nav/logo if present

## 3. Discover data and access redirects

- [x] 3.1 Switch Discover catalog fetch to `listFeaturedEvents(db, { upcomingOnly: true })`; keep partner marquee path
- [x] 3.2 Redirect booking-eligible USER `GET /:locale/discover` → `302` `/:locale/events`; leave ADMIN Discover reachable; guests/non-active USER render page

## 4. Browse / map gate and banner cleanup

- [x] 4.1 Gate `/events` and `/events/map` so non-booking-eligible USER → `302` `/:locale/discover`; guests keep auth redirect; do not send ADMIN to Discover via the inactive path
- [x] 4.2 Remove or no-op dead inactive subscription-banner-as-primary-gate messaging on the feed once inactive users never reach it
- [x] 4.3 Confirm public `/events/:id` remains ungated

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Smoke matrix: guest Discover + featured list; inactive USER Discover nav and `/events` → Discover; active USER Browse events → `/events` and `/discover` → `/events`
- [x] 5.3 Mark step done in `.dev-plan/current-iteration/featured-discover-parent-guide.md`; list ADMIN / PAST_DUE redirect choices for step 04; do not expand into full e2e/docs
