## Context

Catalog steps 01–03 are merged: `@unveiled/db` exposes full event domain functions (`createEvent`, `createEventSeries`, `updateEvent`, `deleteEvent`, `listEvents`, `exportRedemptionCodesCsv`) with validation, image attach/replace, and capacity recalculation; step 03 shipped ADMIN partner CRUD, shared admin components (`AdminPageShell`, `AdminTable`, `AdminPagination`, `AdminSearchForm`), and route helpers in `apps/web/app/lib/admin-route.ts`. The admin dashboard already links to `/admin/events`, but no event routes exist yet.

Source of truth: `docs/migration/features/admin-events.feature`, `docs/migration/sitemap/sitemap.md`, `docs/migration/ui/ui-component-map.md` (Admin — Events manager), `docs/migration/extras/pagination-and-search.md`, `docs/migration/extras/image-uploads.md` §4, `design-tokens.md`.

Existing patterns: partner admin routes (`apps/web/app/routes/[locale]/admin/partners/*`), multipart `c.req.parseBody()`, `CatalogValidationError` mapping via `mapCatalogError`, HeroUI-only components, `robots: "noindex"` on admin pages.

## Goals / Non-Goals

**Goals:**

- Ship ADMIN-only SSR pages: `/admin/events` list (search + pagination), `/admin/events/new`, `/admin/events/series/new`, `/admin/events/:id/edit`, `/admin/events/:id/delete`, `/admin/events/:id/codes`.
- Delegate all business logic to `@unveiled/db` catalog functions; routes parse forms, call domain, redirect or re-render with errors.
- Shared event form components with ticket-type branching (`SECRET_CODE` modes vs `VOUCHER` fields), multipart image handling, and series slot preview/confirm flow.
- Extend admin helpers and copy for event-specific labels, validation messages, and Berlin datetime formatting on list rows.
- Optional small `@unveiled/db` improvements: `countEvents(db, { q })` for filtered pagination totals; `listEvents` ordered by `date_time DESC` for admin list UX.

**Non-Goals:**

- Public `/discover`, `/events/:id`, `@unveiled/ui` EventCard, member feed (step 05).
- Partner portal `/partner/events/*` and PARTNER role self-service (Phase 8).
- Booking-side delete cleanup (waitlist/booking cascade) — bookings table may not exist; FK constraints only.
- Full redemption codes CSV with booking rows until Phase 6 — domain stub returns header-only CSV.
- Client-side mutation modals or JS-required submit.

## Decisions

### 1. Route layout

```
apps/web/app/routes/[locale]/admin/events/
├── index.tsx                    # GET list (?q=&page=)
├── new.tsx                      # GET form + POST create
├── series/
│   └── new.tsx                  # GET form + POST preview/confirm
└── [id]/
    ├── edit.tsx                 # GET form + POST update
    ├── delete.tsx               # GET confirm + POST delete
    └── codes.tsx                # GET CSV download
```

**Rationale:** Matches sitemap and partner CRUD layout from step 03; keeps one concern per route file.

### 2. Auth protection

Reuse existing stack — no new middleware:

- `[locale]/_middleware.tsx` already blocks USER/PARTNER from `admin` prefix.
- Page-level `guardAdminRoute(c)` on every handler (same as partners).

### 3. Extend admin route helpers

Add to `apps/web/app/lib/admin-route.ts`:

| Helper | Purpose |
|---|---|
| `parseEventFormBody(body)` | Extract all event fields; read image file to `Buffer`; parse tags/languages/age groups from comma-separated or repeated fields |
| `parseBerlinDateTime(dateStr, timeStr, timingMode)` | Build `Date` for domain from local Berlin date + time inputs; ALL_DAY uses midnight Berlin |
| `parseSeriesSlots(body)` | Parse manual slot rows or expand date-range builder inputs into `Date[]` |
| `formatEventDateTime(date, locale)` | Display helper for list/edit using `Europe/Berlin` |
| `mapCatalogError` | Extend error code mapping for event-specific codes (`MISSING_EVENT_IMAGE`, `DUPLICATE_SERIES_SLOT`, redemption codes, etc.) |

Rename or alias page size constant to shared `ADMIN_LIST_PAGE_SIZE = 25` (currently `ADMIN_PARTNERS_PAGE_SIZE` — reuse for events).

**Alternative considered:** Separate `event-admin-route.ts`. Rejected — keeps admin parsing colocated; file size remains manageable.

### 4. Filtered count for pagination

Extend `countEvents`:

```typescript
countEvents(db, { q?: string }) // same ILIKE filter as listEvents on title + partner_name
```

Admin list calls `listEvents` + `countEvents` in parallel, same as partners list.

Optionally add `.orderBy(desc(events.dateTime))` to `listEvents` so admin list shows upcoming/recent events predictably.

### 5. Multipart form handling (single create/edit)

Forms use `<form method="POST" enctype="multipart/form-data">`:

1. `c.req.parseBody()` — same as partner forms.
2. Image file field: if `File` with size > 0 → `Buffer`; else absent.
3. Text field `image_url`: trim; empty = no URL.
4. On **create**: pass both to domain — domain enforces exactly one required source.
5. On **edit**: omit both to keep existing image; if either provided, domain replaces via `replaceEventImage`.
6. Set `uploadedBy: session.user.id` on image attach.

Partner select: load all partners via `listPartners(db, { limit: 1000 })` or a lightweight `listPartnerOptions` query — admin is cross-partner; no session `partnerId` scoping.

Required text/select fields per schema: title, partner, description, address, neighborhood, category, eventType (event type), tags, date/time, timing mode, credit price, capacity, ticket type + redemption branches, image.

Optional: barrier-free checkbox, languages, target age groups, lat/lng (text inputs acceptable for v1).

### 6. Ticket-type conditional UI

`EventAdminForm` shared by create and edit:

| `ticketType` | Visible fields |
|---|---|
| `SECRET_CODE` | `RadioGroup` for `secretCodeMode`; when `MANUAL`, require `secretCode` text input; `SHARED_GENERATED` / `UNIQUE_PER_BOOKING` hide manual code field |
| `VOUCHER` | `promoCode` + `eventWebsiteUrl` required |

Use HeroUI `RadioGroup`, `Select`, `Input`, `TextArea`, `CheckboxGroup` — no raw HTML form elements.

Defaults on create (domain applies if omitted): capacity 10, `SECRET_CODE`, `MANUAL`, `TIME_SLOT`.

### 7. Series create flow

`EventSeriesForm` on `/admin/events/series/new`:

**Mode A — manual slots:** repeatable date/time row inputs (SSR-only — add rows via GET `?slots=N` or fixed max rows with empty skip).

**Mode B — date-range builder:** start date, end date, weekday checkboxes (Mon–Sun), one or more daily times, optional excluded dates (comma-separated or multi input).

**Two-step POST:**

1. `action=preview` — parse base fields + slots (manual or generated from builder); validate base fields and slot list via domain-style checks in route or call a small `previewSeriesSlots` helper; re-render form with read-only preview list (HeroUI `List`/`Table`) and hidden inputs carrying ISO slot strings.
2. `action=confirm` — parse hidden slots + base fields; call `createEventSeries(db, { ...base, slots })`; redirect to event list on success.

Date-range generation runs server-side in route helper (Europe/Berlin weekday matching, exclude list applied) — domain still receives explicit `Date[]` per catalog-02 design.

**Alternative considered:** Client JS date picker. Rejected — SSR-only per AGENTS.md; native `input type="date"` and `type="time"` inside HeroUI wrappers are acceptable.

### 8. Admin components

```
apps/web/app/components/admin/
├── EventAdminForm.tsx         # single create/edit fields + redemption branching + image
├── EventSeriesForm.tsx        # base fields + manual/builder tabs + preview section
├── AdminEventsTable.tsx       # list columns: thumbnail, title, partner, date, capacity, actions
└── AdminEventsListPage.tsx    # composes search, table, pagination, new/series links
```

Reuse `AdminPageShell`, `AdminSearchForm`, `AdminPagination`, `AdminTable` patterns from partners.

List thumbnails: `<img>` inside HeroUI wrapper with `buildVariantUrl(imageId, "small-320.webp")` when `imageId` present.

Row actions: edit link, delete link, codes export link (`/admin/events/:id/codes`).

### 9. Delete flow

`GET /:locale/admin/events/:id/delete` — confirmation showing event title and date.

`POST` — call `deleteEvent(db, id)` which removes event row and image assets via domain. Redirect to list on success; 404 on missing id.

No booking/waitlist guard in Phase 4 (bookings table absent).

### 10. CSV export

`GET /:locale/admin/events/:id/codes`:

- Guard ADMIN; load event by id; 404 if missing.
- `const csv = exportRedemptionCodesCsv(eventId)` — header-only stub until Phase 6.
- Response headers: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="event-{id}-codes.csv"`.

### 11. Copy and i18n

Extend `apps/web/app/lib/admin-content.ts` with event-specific strings (DE/EN): list headers, form labels, series preview/confirm, delete confirmation, validation messages for event error codes, ticket-type labels.

Category/eventType: free-form text inputs for v1 (matches schema); optional datalist from seed demo values.

### 12. Dashboard link

Step 03 already renders events quick link to `/admin/events`. No dashboard structural change — verify link resolves after routes ship.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Multipart payload size on series confirm with many hidden slot fields | Cap preview slot count (e.g. 52) in route helper; document limit |
| `countEvents` without search filter breaks pagination | Add filtered count in same change |
| Date-range builder timezone edge cases | Generate slots in Europe/Berlin only; reuse `datetime.ts` conventions |
| R2 unavailable during image upload | Surface domain error on form; document env vars |
| `listEvents` without ORDER BY yields unstable admin list | Add `date_time DESC` ordering |
| Series form complexity | Preview step catches slot errors before insert; domain rejects duplicates |

## Migration Plan

1. Implement on branch `catalog-04-admin-events-crud`.
2. Optional `@unveiled/db` changes: `countEvents({ q })`, `listEvents` ordering.
3. No new Drizzle migration.
4. Verify with ADMIN account: create event (file upload), list thumbnail, series (2 slots), edit image replace, delete, CSV download.
5. Confirm at least one partner exists (seed or step 03).
6. `bun run lint && bun run typecheck && bun run build`.
7. Rollback: revert branch; no DB rollback.

## Open Questions

- None blocking. Category/eventType remain free-text inputs until a fixed taxonomy is product-decided.
