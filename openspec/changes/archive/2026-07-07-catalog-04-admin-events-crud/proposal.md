## Why

Catalog steps 02–03 delivered the event domain layer in `@unveiled/db` and ADMIN partner management UI, but admins still cannot create, edit, or delete events through the web app. Without `/admin/events/*` SSR routes, the catalog cannot be curated in staging, step 05 public surfaces have nothing to show, and verification still depends on CLI seed scripts.

## What Changes

- Add ADMIN-only SSR routes under `/:locale/admin/events/*`: searchable paginated list, single create, series create (manual slots + date-range/weekday builder with preview), edit, delete confirmation, and redemption codes CSV export.
- Wire route handlers to existing catalog domain functions (`listEvents`, `createEvent`, `createEventSeries`, `updateEvent`, `deleteEvent`, `exportRedemptionCodesCsv`) and `@unveiled/images` for list thumbnails (`small-320`).
- Add shared admin UI components (`EventAdminForm`, `EventSeriesForm`, ticket-type conditional fields) using HeroUI-only markup; multipart POST for image upload with mutual exclusivity vs URL paste.
- Extend admin route helpers and copy strings for event forms, validation mapping, and list pagination (including filtered `countEvents` for search totals).
- Dashboard already links to `/admin/events` from step 03 — routes must resolve that link.
- **Out of scope:** public `/discover` and `/events/:id`, `@unveiled/ui` EventCard, member feed, booking admin cancel, waitlist admin, partner portal `/partner/events/*`, booking-side delete cleanup beyond FK constraints.

## Capabilities

### New Capabilities

_(none — admin event UI extends existing catalog capability)_

### Modified Capabilities

- `event-catalog`: Add requirements for ADMIN-only event SSR CRUD routes (list, single create, series create, edit, delete, codes CSV export) with search/pagination, required image handling, and redemption validation per `admin-events.feature`.

## Impact

- **App:** `apps/web/app/routes/[locale]/admin/events/` (six route groups), `apps/web/app/components/admin/` (event forms, list table), extensions to `admin-route.ts` and `admin-content.ts`.
- **Packages consumed:** `@unveiled/db` (catalog domain), `@unveiled/images` (`buildVariantUrl`), `@unveiled/auth` (session in routes; prefix guard already in middleware).
- **Optional small `@unveiled/db` change:** `countEvents(db, { q })` with search filter matching `listEvents` (pagination totals).
- **Environment:** `DATABASE_URL`, `AUTH_URL`, R2 vars for image upload tests; at least one partner record and ADMIN test account required.
- **Downstream:** Consumed by `catalog-05-public-surfaces-and-release`.
- **Verification:** Manual ADMIN create/edit/delete/series flows; `bun run lint`, `typecheck`, `build`.
