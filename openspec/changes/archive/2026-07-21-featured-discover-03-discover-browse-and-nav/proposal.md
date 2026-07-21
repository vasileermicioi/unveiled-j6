## Why

Admins can curate featured events (steps 01–02), but Discover still previews the automatic upcoming catalog and every signed-in USER can open the full `/events` feed. Closing the membership loop requires featured-only Discover for non-active audiences, an active-subscription gate on browse/map, and top-nav chrome that swaps Discover ↔ Browse events.

## What Changes

- **Discover data:** `/:locale/discover` loads `listFeaturedEvents(..., { upcomingOnly: true })` instead of `listUpcomingEvents` limit 6 (partner marquee unchanged unless empty).
- **Discover access:** Guests and non-active `USER` may view Discover; booking-eligible `USER` (`ACTIVE` | `CANCELLED_PENDING`) get `302` → `/:locale/events`. `ADMIN` keeps Discover reachable (QA); do not redirect admins to the member feed.
- **Browse access:** `/:locale/events` and `/:locale/events/map` require signed-in `USER` with booking-eligible subscription; non-active `USER` → `302` → `/:locale/discover`; guests keep existing auth redirect. Public `/:locale/events/:id` unchanged.
- **Top nav (sticky + drawer):** Guests + non-active `USER` → label Discover / Entdecken → `/discover`; active `USER` → Browse events / Events entdecken → `/events`. Active highlighting uses the resolved href.
- **USER logo home:** active → `/events`; non-active → `/discover`.
- Pass booking-eligible / browse flag into shell from the existing locale middleware/renderer path (SSR props only).
- Optional cleanup: simplify feed subscription-banner messaging once non-active users never reach `/events`.
- Footer: keep Discover → `/discover` (no parity work this step).
- **No** full BDD/e2e suite or broad product-doc rewrite (step 04); no new admin Featured UI.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-discovery`: Discover shows curated featured upcoming events; Discover redirects active members to `/events`; member list/map require booking-eligible subscription (non-active → Discover).
- `app-shell`: Primary nav Discover vs Browse events label/href swap; USER logo home splits by active membership.

## Impact

- **Routes:** `apps/web/app/routes/[locale]/discover.tsx`; feed/map guards via `member-app-route` / `event-feed-route` / `events/index.tsx` / `events/map.tsx`.
- **Domain (consume):** `listFeaturedEvents` + `isBookingEligibleStatus` from `@unveiled/db` (reuse; no parallel “active” boolean).
- **Shell:** `AppShell`, `AppNavbar`, `AppNavbarMenu`, locale `_middleware.tsx` / `_renderer.tsx`, `copy.ts` (+ stories as needed).
- **Copy:** Reuse `browseEvents` phrasing (“Browse events” / “Events entdecken”); keep Discover / Entdecken for non-active.
- **Unchanged:** Admin Featured tab, public event detail, booking eligibility rules for ticket purchase, footer Discover link, partner portal.
- **Source brief:** `.dev-plan/current-iteration/featured-discover-03-discover-browse-and-nav.md`
- **Parent:** `.dev-plan/current-iteration/featured-discover-parent-guide.md`
- **Depends on:** `featured-discover-02-admin-tab` (done)
- **Consumed by:** `featured-discover-04-hardening`
- **Verification:** `bun run lint`, `bun run typecheck`; smoke matrix guest / inactive / active nav + redirects
