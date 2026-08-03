## Why

Steps 01–02 shipped a sortable partner list with an **Export** copy key, but admins still have no way to see tickets sold per event over a date period or download that report as CSV. This step closes that gap so the partner-list **Export** action lands on a working ADMIN-only sales-export page.

## What Changes

- Add a sales-export domain helper in `@unveiled/db` (`listSalesByEvent` + CSV formatter) that aggregates tickets sold per event for an inclusive `[from, to]` window.
- Define **tickets sold** as the sum of `bookings.tickets_count` for bookings whose `created_at` falls in the period and whose status is `CONFIRMED` or `USED` (exclude `CANCELLED` / `WAITLIST`; comp tickets count via the booking path).
- Add ADMIN-only SSR route(s) at `/:locale/admin/partners/export` (period form + table) and a CSV download (`format=csv` or sibling `.csv`) returning `text/csv` with `Content-Disposition: attachment`.
- Wire the partner-list **Export** action (toolbar `Link`) to the export page; reuse existing `exportAction` copy and add full export-page `AdminCopy` (DE + EN).
- Add unit/integration tests for aggregation, period bounds, status exclusion, and CSV shape.
- Out of scope: venue-scoped export, revenue/credit reporting, per-ticket CSV rows, partner portal, events-list changes, BDD/e2e (step 04).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `booking`: ADMIN-only sales-export page and CSV SHALL report tickets sold per event over a validated inclusive date period, counting only `CONFIRMED`/`USED` bookings by `created_at`.
- `partner-catalog`: Admin partner list SHALL provide an **Export** action that navigates to the sales-export page.

## Impact

- **Domain (`@unveiled/db`):** `packages/db/src/admin/sales-export.ts` (`listSalesByEvent`, CSV formatter); export from admin barrel; tests.
- **UI / routes (`apps/web`):** `AdminSalesExportPage`, partner export route(s), `AdminPartnersListPage` Export link, `admin-content.ts` copy, optional Ladle stories.
- **Patterns:** mirror `events/[id]/codes.tsx` CSV attachment; `guardAdminRoute` + `noindex`; native date inputs; Europe/Berlin period parsing.
- **Source brief:** `.dev-plan/current-iteration/partner-list-and-sales-export-03-sales-export.md`
- **Parent:** `.dev-plan/current-iteration/partner-list-and-sales-export-parent-guide.md`
- **Depends on:** `partner-list-and-sales-export-01-list-domain`, `partner-list-and-sales-export-02-list-ui` (archived)
- **Consumed by:** `partner-list-and-sales-export-04-hardening`
- **Verification:** `bun run typecheck`; `bun run lint`; `cd packages/db && bun test` (sales-export); manual ADMIN export + CSV + non-admin denial
