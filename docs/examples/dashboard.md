# Example: Dashboard / List Page

**Status:** Blueprint — admin list patterns (Phase 4+) and member feed/saved (Phase 5) follow this layout.  
**Spec:** `docs/product/extras/pagination-and-search.md`, `docs/product/features/event-discovery.feature`

---

## Applicable routes

| Route | Persona | Content |
|---|---|---|
| `/:locale/admin/events` | ADMIN | Event table, filters, pagination |
| `/:locale/admin/users` | ADMIN | User table |
| `/:locale/partner/guests` | PARTNER | Tonight's guest list |
| `/:locale/events` | USER | Member event feed |
| `/:locale/bookings` | USER | My tickets |
| `/:locale/saved` | USER | Saved events |

---

## Layout pattern

```tsx
<Surface className="mx-auto max-w-7xl ..." variant="transparent">
  <Surface className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" variant="transparent">
    <Heading level={1}>Events</Heading>
    <Link className="button button--primary button--md" href={newEventHref}>
      New event
    </Link>
  </Surface>

  {/* Filters — GET form */}
  <Card className="admin-filters">
    <Card.Content>
      <form method="get" className="flex flex-wrap gap-4">
        {/* Select, Input fields — submit refreshes SSR page */}
        <Button type="submit" className="button button--secondary button--md">
          Apply
        </Button>
      </form>
    </Card.Content>
  </Card>

  {/* Results */}
  <Card>
    <Card.Content>
      {/* Table or EventCard grid */}
    </Card.Content>
  </Card>

  {/* Pagination links */}
  <Surface className="flex justify-center gap-2" variant="transparent">
    {/* Link page=N with preserved query params */}
  </Surface>
</Surface>
```

---

## Search & filters

- **GET only** — filters in query string (`?q=&category=&page=2`)
- Bookmarkable, shareable, SSR-rendered
- Page size conventions in `pagination-and-search.md`
- No client-side filter state as source of truth

---

## Empty state

```tsx
<Card className="text-center">
  <Card.Content>
    <Paragraph>No events match your filters.</Paragraph>
    <Link className="button button--secondary button--md" href={clearFiltersHref}>
      Clear filters
    </Link>
  </Card.Content>
</Card>
```

---

## Member event feed specifics

- Subscription gate `Banner`/`Alert` when not ACTIVE
- Collapsible map panel (island, consent-gated)
- Responsive grid of `@unveiled/ui` `EventCard`
- Default filter: upcoming events, Europe/Berlin

---

## Admin table specifics

- HeroUI `Table` or semantic rows in `Card`
- Row actions link to dedicated pages (edit, delete confirm) — not dropdown modals
- Pagination at bottom

---

## Styling

- White bordered cards on yellow background
- Table borders: 2px dark, zero radius
- Row hover via theme if needed — `.admin-table__row` in globals.css
- No zebra striping with arbitrary Tailwind colors

---

## SEO

- Member/admin list pages: `robots: noindex` (see `seo-and-metadata.md`)
- Pass `robots: "noindex, nofollow"` to `c.render()` where required

---

## Do not

- Client-side infinite scroll as primary pagination
- Load full collection client-side (old SPA anti-pattern)
- Inline delete without confirmation page
