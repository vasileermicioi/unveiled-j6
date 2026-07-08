## Why

Admin catalog CRUD (steps 03–04) can publish events with images, but the marketing site still shows mock data on `/discover` and has no public event detail URL. Phase 4 cannot demo end-to-end value until live catalog data surfaces on indexable public pages with correct SEO and shareable links.

## What Changes

- **New `@unveiled/ui` package** — `EventCard` component per `ui-component-map.md` (guest-first CTA precedence, `medium-640`/`small-320` srcset, bookmark `aria-label`); image URL helpers wrapping `@unveiled/images` `buildVariantUrl`.
- **Public catalog read queries** in `@unveiled/db` — `listUpcomingEvents(limit, now)` and `getPublicEventById(id)` filtering future events; 404 for unknown ids.
- **Live `/discover`** — replace mock event grid with up to six upcoming DB events via `EventCard`; partner venue grid uses `medium-640` logos or initial placeholder; static marketing copy unchanged.
- **New public route `/:locale/events/:id`** — no auth required; hero srcset (`hero-1920` through `small-320`); full event fields; guest CTA to login/membership; map placeholder (MapLibre deferred to Phase 5); per-event SEO (title, description, canonical, hreflang, `og-1200x630`, Twitter card); Event JSON-LD stub; `noindex` when sold-out or past.
- **Deployment docs** — `apps/web/DEPLOYMENT.md` Phase 4 release gate (R2 vars, admin credentials, `seed:demo`, staging smoke checklist).
- **Workspace wiring** — add `packages/ui` to Bun workspaces; `@unveiled/web` depends on `@unveiled/ui`.

## Capabilities

### New Capabilities

_(none — public surfaces extend existing catalog and marketing capabilities)_

### Modified Capabilities

- `event-catalog`: EventCard component, discover live preview queries, public event detail page with SEO/JSON-LD.
- `static-marketing-pages`: Discover page event preview grid switches from mock data to live catalog events while retaining static marketing copy.

## Impact

- **Packages:** new `packages/ui` (`@unveiled/ui`); `@unveiled/db` (public read queries); `@unveiled/web` (discover route, new event detail route, SEO helpers).
- **Routes:** `/:locale/discover` (data wiring), new `/:locale/events/[id].tsx`.
- **Components:** replace `EventCardPreview` usage on discover with `@unveiled/ui` `EventCard`; remove or deprecate mock discover event data.
- **SEO:** extend `apps/web/app/lib/seo.ts` with event-detail meta and JSON-LD builders.
- **Docs:** `apps/web/DEPLOYMENT.md`, `.dev-plan/current-iteration/catalog-parent-guide.md` (mark step 05 complete).
- **Out of scope:** member `/events` feed, booking/waitlist routes, MapLibre map island, dynamic sitemap event URLs (Phase 5–6, 9).
