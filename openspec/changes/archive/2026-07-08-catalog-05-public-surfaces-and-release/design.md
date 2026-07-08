## Context

Catalog steps 03–04 delivered admin partner/event CRUD, image pipeline, and list discovery. The marketing `/discover` route still uses `MOCK_DISCOVER_EVENTS` and `EventCardPreview` — a Phase 1 placeholder. There is no `/:locale/events/:id` route; the sitemap and `seo-and-metadata.md` require a **public**, indexable event detail page. `packages/ui` does not exist yet (planned in Phase 4 per `IMPLEMENTATION-PLAN.md`).

**Existing assets:**

| Area | Current state |
|---|---|
| Discover route | `discover.tsx` renders `DiscoverPage` with static content + mocks |
| EventCard | `EventCardPreview` — simplified mock card, no srcset, no bookmark |
| DB queries | `listEvents`, `getEventById` — admin-oriented (no `date_time >= now` filter for public) |
| Images | `@unveiled/images` `buildVariantUrl` for six WebP variants |
| SEO | `buildPageMeta`, `discoverPageMeta` — no event-detail builders |
| 404 | `NotFoundPage` used in admin routes |

Source of truth: `.dev-plan/current-iteration/catalog-05-public-surfaces-and-release.md`, `ui-component-map.md` (EventCard §, Event Detail §), `seo-and-metadata.md` §1–2.

## Goals / Non-Goals

**Goals:**

- Ship `@unveiled/ui` with production `EventCard` (guest-first CTA, srcset, bookmark `aria-label`).
- Wire `/discover` to live DB data (≤6 upcoming events, partner logos).
- Public `/:locale/events/:id` — 200 without auth, hero srcset, full fields, per-event SEO + JSON-LD.
- `noindex` on sold-out or past events per seo-and-metadata.
- Update `DEPLOYMENT.md` for Phase 4 staging demo.

**Non-Goals:**

- Member `/events` feed, filters, saved events, map island — Phase 5.
- Booking/waitlist transaction routes — Phase 6–7.
- Signed-in CTA states (Book/Waitlist/Unlock) on detail page — acceptable banner/link to `/membership`; full states in Phase 5/6.
- Dynamic `sitemap.xml` event URLs — Phase 9.
- Removing `EventCardPreview` from repo if unused elsewhere (can delete after discover migration).

## Decisions

### 1. `@unveiled/ui` package layout

```
packages/ui/
  package.json          # name: @unveiled/ui
  tsconfig.json         # extends @unveiled/config/tsconfig.react.json
  src/
    index.ts            # re-exports
    EventCard.tsx
    types.ts            # EventCardItem, EventCardViewerState
    image-urls.ts       # thin re-export of buildVariantUrl + srcset helpers
```

- **Dependencies:** `@heroui/react`, `@unveiled/images` (workspace), `react` (catalog).
- **No dependency on `@unveiled/db` or `apps/web`** — routes map DB rows to `EventCardItem` props.
- **Alternative:** Keep card in `apps/web/app/components/`. Rejected — Phase 5 member feed reuses EventCard; shared package is the plan.

### 2. EventCard props and CTA precedence

```typescript
type EventCardViewerState =
  | { kind: "guest" }
  | { kind: "member"; subscriptionActive: boolean; saved?: boolean };

type EventCardItem = {
  id: string;
  title: string;
  partnerName: string;
  dateTime: Date;
  neighborhood: string;
  creditPrice: number;
  remainingCapacity: number;
  ticketType: "SECRET_CODE" | "VOUCHER";
  category: string;
  imageId: string;
};
```

CTA resolution (guest checked **first**):

```typescript
function resolveCtaLabel(viewer: EventCardViewerState, soldOut: boolean, locale: Locale): string {
  if (viewer.kind === "guest") return guestLabel(locale); // always "See details"
  if (soldOut) return waitlistLabel(locale);
  if (!viewer.subscriptionActive) return unlockLabel(locale);
  return bookLabel(locale);
}
```

Href: guest → `/:locale/events/:id`; signed-in book/waitlist → deferred paths (detail page uses login/membership for now).

Bookmark: render toggle with `aria-label` from save state; for guests on discover — disabled or no-op (no saved state).

Image: `<img>` inside HeroUI `Card.Header` with `srcset` built from `buildVariantUrl(imageId, "medium-640.webp")` and `small-320.webp`.

### 3. Public catalog queries in `@unveiled/db`

Add to `packages/db/src/catalog/events.ts` (or `public.ts`):

```typescript
export async function listUpcomingEvents(
  db: Db,
  options: { limit?: number; now?: Date } = {},
): Promise<Event[]> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 6;
  return db
    .select()
    .from(events)
    .where(gte(events.dateTime, now))
    .orderBy(events.dateTime) // ascending — soonest first
    .limit(limit);
}

export async function getPublicEventById(db: Db, eventId: string): Promise<Event | null> {
  return getEventById(db, eventId); // no auth filter; 404 handled at route layer
}
```

- Discover uses `listUpcomingEvents(db, { limit: 6 })`.
- Detail uses `getPublicEventById`; route returns `NotFoundPage` when null.
- **Alternative:** Reuse `listEvents` with filters. Rejected — admin list orders by `created_at DESC`; public discover needs `date_time ASC` and future-only filter as a dedicated contract.

Partner logos for discover grid: add `listPartnersWithLogos` or query partners with `logoImageId IS NOT NULL` (limit 8) — reuse existing `listPartners` with a small limit if sufficient.

### 4. Discover route data wiring

`discover.tsx` gains DB access (same pattern as admin routes — `getDb()` from app lib):

```typescript
const [upcomingEvents, partners] = await Promise.all([
  listUpcomingEvents(db, { limit: 6 }),
  listPartners(db, { limit: 8 }), // or filtered subset with logos
]);
```

Pass mapped `EventCardItem[]` and partner rows to `DiscoverPage`. Replace `EventCardPreview` with `@unveiled/ui` `EventCard`. Keep static `content` from `getPageContent`. Hero stats: replace mock `eventCount` with `upcomingEvents.length` or a separate count query if needed.

### 5. Event detail route

New file: `apps/web/app/routes/[locale]/events/[id].tsx`.

- **No auth middleware** — optional session read for future CTA states only.
- Load event via `getPublicEventById`; 404 + `NotFoundPage` if missing.
- Component: `EventDetailPage` in `apps/web/app/components/` (page-level, composes HeroUI + `@unveiled/ui` helpers).
- Hero `<img>` srcset: `hero-1920`, `large-1280`, `medium-640`, `small-320` (not `og-1200x630` on-page).
- Map: static placeholder text ("Map available in member experience" / similar) — no MapLibre island.
- CTA: guest `Link` to `/:locale/login`; optional note for membership.
- Sold-out/past: render 200, messaging instead of book CTA; set `robots: noindex, follow` in meta.

### 6. SEO and JSON-LD

Extend `apps/web/app/lib/seo.ts`:

```typescript
export function eventDetailPageMeta(event: Event, locale: Locale, pathname: string): PageMeta {
  const title = `${event.title} at ${event.partnerName}`;
  const description = truncate(event.description, 160);
  const ogImage = buildVariantUrl(event.imageId, "og-1200x630.webp");
  const bookable = event.remainingCapacity > 0 && event.dateTime > new Date();
  return buildPageMeta({
    locale,
    pathname,
    title,
    description,
    ogImage,
    robots: bookable ? undefined : "noindex, follow",
  });
}

export function eventJsonLd(event: Event): object {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.dateTime.toISOString(),
    description: event.description,
    image: buildVariantUrl(event.imageId, "hero-1920.webp"),
    location: { "@type": "Place", name: event.partnerName, address: event.address },
    organizer: { "@type": "Organization", name: event.partnerName },
  };
}
```

Render JSON-LD via `<script type="application/ld+json">` in route render options or page component (allowed exception per AGENTS.md).

Extend `buildPageMeta` to accept optional `robots` string when not already supported.

### 7. Styling

- Reuse `.event-card-preview` theme classes where possible; migrate to `.event-card` in `globals.css` `@layer components` if EventCard diverges from preview markup.
- Event detail hero/detail layout: Tailwind layout only on HeroUI nodes; visual styling via theme tokens.

### 8. Workspace wiring

- Add `packages/ui` to root workspaces (already `packages/*`).
- `apps/web/package.json`: `"@unveiled/ui": "workspace:*"`.
- Root `typecheck` filter already runs all packages.

## Risks / Trade-offs

- **[Risk] Missing R2 env on staging** → Discover/detail images 404. **Mitigation:** DEPLOYMENT.md checklist; verify `IMAGE_PUBLIC_BASE_URL` before demo.
- **[Risk] Empty catalog on fresh deploy** → Discover shows empty state only. **Mitigation:** `seed:demo` documented; admin dashboard seed control.
- **[Risk] `static-marketing-pages` main spec not in `openspec/specs/`** → Archive sync may need baseline from marketing-site archives. **Mitigation:** Delta spec includes full MODIFIED requirement block for discover.
- **[Trade-off] Detail page map placeholder** → Less rich UX until Phase 5. Acceptable per iteration scope.
- **[Trade-off] Guest bookmark toggle visible but inert** → Matches ui-component-map; saved feature is Phase 5.

## Migration Plan

1. Merge and deploy after `catalog-04` on staging with R2 configured.
2. Run `bun run db:migrate` (no new migrations expected).
3. `bun run seed:demo` if empty DB.
4. Verify `/de/discover` and `/de/events/:id` on staging.
5. No rollback beyond revert deploy — read-only public queries, no schema change.

## Open Questions

- **Partner grid source:** All partners vs. partners with upcoming events only? Default: list up to 8 partners with logos (or all partners, initials fallback) — match current mock layout.
- **Hero stats live count:** Use `upcomingEvents.length` in preview section vs. total future event count query? Default: show count from `listUpcomingEvents` length or separate `countUpcomingEvents` if hero needs total catalog size.
