## Why

Catalog step 02 added partner domain functions and an idempotent demo seed script, but admins still have no SSR UI to manage partner venue records or bootstrap staging data. Without `/admin` and `/admin/partners/*` routes, event creation (step 04) cannot proceed and staging cannot be populated without CLI access.

## What Changes

- Add ADMIN-only SSR routes under `/:locale/admin/*`: dashboard stub with quick links and empty-DB demo seed button; partner list with search/pagination; create, edit, and delete pages with multipart logo upload or URL paste.
- Wire route handlers to `@unveiled/db` catalog domain (`listPartners`, `createPartner`, `updatePartner`, `deletePartner`, `runDemoSeed`) and `@unveiled/images` for list thumbnails (`small-320`).
- Add shared admin UI components (`AdminPageShell`, `PartnerForm`, `AdminTable`) using HeroUI-only markup and theme styling.
- Extend existing auth middleware pattern: unauthenticated visitors redirect to login; signed-in USER/PARTNER roles blocked from `admin` prefix (already in `auth-middleware.ts` — verify behavior on new routes).
- Add ADMIN-only navbar link to `/admin`.
- **Out of scope:** `/admin/partners/:id/portal-access`, `/admin/partners/:id/venue-qr`, event admin CRUD, public catalog pages, PARTNER user provisioning.

## Capabilities

### New Capabilities

_(none — admin UI extends existing catalog and platform capabilities)_

### Modified Capabilities

- `event-catalog`: Add requirements for ADMIN-only partner SSR CRUD routes and dashboard demo seed control when DB is empty.
- `platform-foundation`: Add requirement that `/:locale/admin/*` partner management pages are protected by authenticated ADMIN role checks (USER/PARTNER blocked per auth phase patterns).

## Impact

- **App:** `apps/web/app/routes/[locale]/admin/` (dashboard + partner CRUD), `apps/web/app/components/admin/`, multipart form parsing in POST handlers, copy/nav updates.
- **Packages consumed:** `@unveiled/db` (catalog domain, `runDemoSeed`), `@unveiled/images` (`buildVariantUrl`), `@unveiled/auth` (session in routes; prefix guard already in middleware).
- **Environment:** `DATABASE_URL`, `AUTH_URL`, R2 vars for logo upload tests; ADMIN test account required for verification.
- **Downstream:** Consumed by `catalog-04-admin-events-crud` (events require partner records).
- **Verification:** Manual ADMIN CRUD + seed button; USER blocked from admin; `bun run lint`, `typecheck`, `build`.
