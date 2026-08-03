## Why

Step 01 shipped server-side partner sort and per-partner event counts, but the admin partners page still reuses the events-list placeholder **"Search title or partner"**, shows no **Active events** column, and has no sort controls. Admins need Name-labeled filtering, SSR sort/direction, and active-event counts on `/:locale/admin/partners` before the sales-export entry (step 03).

## What Changes

- Relabel the partner list search filter to **Name** (DE/EN: **Name**) via an `AdminSearchForm` placeholder/label override (events/featured pages keep their existing copy).
- Add SSR query-param sort (`sort`) and direction (`dir`) controls on `AdminPartnersListPage`, defaulting to last-created descending when params are absent.
- Preserve `sort`/`dir` (with `q`/`page`) through `parseAdminListQuery` / `buildAdminListQueryString` and pagination links.
- Add an **Active events** column to `AdminPartnersTable` using `activeEventCount` from `listPartners`.
- Extend `AdminCopy` (DE + EN) for Name search, sort/direction labels/options, active-events header, and Export link label (anchor text for step 03; destination page remains out of scope).
- Update Ladle stories for the table and list page.
- Out of scope: sales-export page/route (step 03); events list page; client-side table sorting or mutation modals.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `partner-catalog`: Admin partner list UI SHALL label its search filter **Name**, SHALL display an **Active events** column per partner, and SHALL offer server-driven sorting by Name / Last created / Most events (asc/desc) via `sort`/`dir` query params preserved across pagination and filtering, defaulting to last-created descending when omitted.

## Impact

- **UI (`apps/web`):** `AdminPartnersListPage`, `AdminPartnersTable`, `AdminSearchForm`, partner route `routes/[locale]/admin/partners/index.tsx`, `admin-list.ts` query helpers, `admin-content.ts` copy, Ladle stories.
- **Domain:** consumes step 01 `listPartners` sort options + `activeEventCount` / `eventCount` — no further `@unveiled/db` changes expected.
- **Source brief:** `.dev-plan/current-iteration/partner-list-and-sales-export-02-list-ui.md`
- **Parent:** `.dev-plan/current-iteration/partner-list-and-sales-export-parent-guide.md`
- **Depends on:** `partner-list-and-sales-export-01-list-domain` (archived)
- **Consumed by:** `partner-list-and-sales-export-03-sales-export`
- **Verification:** `bun run typecheck`; `bun run lint`; `bun run stories`; manual partner-list filter/sort/pagination check
