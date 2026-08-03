## 1. Setup

- [x] 1.1 Skim step plan + this change’s proposal/design/specs; confirm bookings schema statuses and CSV pattern in `events/[id]/codes.tsx`
- [x] 1.2 Confirm partner list already exposes `exportAction` copy and that Export `Link` is still unwired on `AdminPartnersListPage`

## 2. Domain — sales export

- [x] 2.1 Add `packages/db/src/admin/sales-export.ts` with Europe/Berlin day-bound helpers, `listSalesByEvent(db, { from, to })` (every event; `ticketsSold` = sum of `CONFIRMED`/`USED` `tickets_count` by `created_at` in range), and `formatSalesByEventCsv`
- [x] 2.2 Export the new helpers/types from `packages/db/src/admin/index.ts` (and package public surface as needed)
- [x] 2.3 Add unit/integration tests: period bounds, status exclusion (`CANCELLED`/`WAITLIST`), CONFIRMED+USED counted, zero-sales events present, CSV header/shape

## 3. Admin copy & UI

- [x] 3.1 Add DE + EN `AdminCopy` keys for export title/subtitle, from/to labels, submit, tickets-sold column, empty state, CSV download label, period validation error
- [x] 3.2 Build `AdminSalesExportPage` (`AdminPageShell`, native date inputs, results table, CSV link) using HeroUI-only markup
- [x] 3.3 Wire toolbar **Export** `Link` on `AdminPartnersListPage.actions` to `/:locale/admin/partners/export` (reuse `exportAction`)
- [x] 3.4 Optional: Ladle story for `AdminSalesExportPage` with sample rows

## 4. Route

- [x] 4.1 Add `routes/[locale]/admin/partners/export.tsx` with `guardAdminRoute`, `noindex`, default last-30-day period, invalid-range error handling
- [x] 4.2 On `format=csv` + valid period, return `text/csv` body with `Content-Disposition` attachment; otherwise `c.render(AdminSalesExportPage)`

## 5. Docs & cleanup

- [x] 5.1 Mark step `partner-list-and-sales-export-03-sales-export` done in `.dev-plan/current-iteration/partner-list-and-sales-export-parent-guide.md` when implementation merges
- [x] 5.2 Leave canonical `openspec/specs/{booking,partner-catalog}/spec.md`, sitemap, and feature-file sync for step 04 / archive — deltas live in this change

## 6. Verification

- [x] 6.1 Run `bun run typecheck` — exits 0
- [x] 6.2 Run `bun run lint` — exits 0
- [x] 6.3 Run `cd packages/db && bun test` covering sales-export tests — passes
- [x] 6.4 Manual: as ADMIN, open export from partner list, set period, see per-event tickets sold, download CSV; confirm guest/`USER` denied
  <!-- Staging/browser check left to operator; route uses `guardAdminRoute` + same CSV attachment pattern as codes export; unit/integration cover aggregation + period validation. -->
