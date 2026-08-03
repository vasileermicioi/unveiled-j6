## Context

Parent feature step 03: deliver the ADMIN sales-export page and wire the partner-list **Export** action. Steps 01–02 are merged — partner list has Name filter, sort/dir, Active events, and `exportAction` copy, but no Export `Link` and no export route.

Current state:

- Bookings live in `packages/db/src/schema/bookings.ts` with `ticketsCount`, `status` (`CONFIRMED` | `WAITLIST` | `CANCELLED` | `USED`), `createdAt`, `eventId`, `partnerId`.
- Admin barrel (`packages/db/src/admin/`) has capacity/member helpers; no sales aggregation yet.
- CSV download precedent: `apps/web/app/routes/[locale]/admin/events/[id]/codes.tsx` — `guardAdminRoute` then `c.body` with `text/csv` + `Content-Disposition`.
- Partner list: `AdminPartnersListPage` toolbar only has **New partner**; `exportAction` strings already exist in `admin-content.ts`.
- Date param parsing for `YYYY-MM-DD` exists in `apps/web/app/lib/event-feed.ts` (member feed); Europe/Berlin is the repo timezone convention (`admin-event-form.ts`).

Constraints: SSR-only GET page + GET CSV (AGENTS §1); business logic in `@unveiled/db` (§ packages); HeroUI markup + native date inputs (§8, §14); theme-only visuals (§9); ADMIN via `guardAdminRoute` + `noindex`; no partner portal / venue-scoped export.

## Goals / Non-Goals

**Goals:**

- Single-source `listSalesByEvent(db, { from, to })` returning `{ eventId, title, partnerName, dateTime, ticketsSold }[]` plus a CSV formatter, exported from the admin barrel.
- Tickets sold = sum of `tickets_count` for bookings with `created_at` in inclusive `[from, to]` and status ∈ `{CONFIRMED, USED}`.
- ADMIN route `/:locale/admin/partners/export` with period form, results table, CSV download link.
- Default period = last 30 Europe/Berlin calendar days when `from`/`to` omitted; clear error on invalid/missing-after-submit ranges.
- Toolbar **Export** link on the partner list → export page.
- Localized DE/EN copy for the export page; unit/integration tests for aggregation + CSV.

**Non-Goals:**

- Partner-/venue-scoped export, revenue or credit-value columns, per-ticket CSV expansion.
- Partner portal / check-in (post-MVP).
- Events list page changes.
- BDD / Playwright / coverage-matrix / sitemap sync (step 04).
- Schema migrations.

## Decisions

1. **Domain home: `packages/db/src/admin/sales-export.ts`**
   - **Choice:** New admin module with `listSalesByEvent` + `formatSalesByEventCsv` (names may vary slightly but stay in this file), re-exported from `packages/db/src/admin/index.ts` and the package root like other admin helpers.
   - **Rationale:** Step plan path; aggregation is an admin ops concern, not catalog CRUD or the booking write path.
   - **Alternatives:** Put under `booking/` — rejected (read-only admin report); put SQL in the route — rejected (AGENTS domain boundary).

2. **Tickets-sold predicate (locked)**
   - **Choice:** Count `sum(bookings.tickets_count)` where `status IN ('CONFIRMED','USED')` and `created_at >= fromStart` and `created_at <= toEnd`. Exclude `CANCELLED` and `WAITLIST`. Comp tickets already create `CONFIRMED` bookings → counted without a special case.
   - **Rationale:** Matches step-plan Spec Delta; single helper so step 04 docs and the route agree.
   - **Alternatives:** Count by `event.date_time` in range — rejected (period is sales window, not event date); count redemption check-ins — rejected (out of scope).

3. **Inclusive Berlin calendar days → UTC timestamps**
   - **Choice:** Parse `from`/`to` as `YYYY-MM-DD`. Map `from` to start of that day in Europe/Berlin and `to` to end of that day in Europe/Berlin (inclusive). Reuse or mirror the feed’s date-string validation; keep conversion testable (pure helpers or injectable bounds).
   - **Rationale:** Repo timezone convention; avoids off-by-one at midnight UTC.
   - **Alternatives:** Treat params as UTC midnight — rejected (wrong for Berlin ops).

4. **Default window when params omitted**
   - **Choice:** On first GET without `from`/`to`, default to `[today−29 days, today]` inclusive in Europe/Berlin (30 calendar days) and prefill the form; still run the query so the page is never empty of a period. Prefer reflecting defaults in the URL after first submit; initial paint may omit params and apply defaults server-side.
   - **Rationale:** Step plan “sensible recent window”; 30 days is enough for ops without drowning the table.
   - **Alternatives:** Require explicit submit before querying — poorer first paint; calendar-month default — less predictable across month boundaries.

5. **Row universe: every event, including zero sales**
   - **Choice:** Return one row per event (left-join / grouped sum with `coalesce`), `ticketsSold = 0` when no qualifying bookings. Include partner name and event `dateTime` for context.
   - **Rationale:** Spec says “every event with its tickets-sold count”; zeros make “no sales” visible.
   - **Alternatives:** Only events with sales > 0 — rejected (hides quiet venues); only events whose `date_time` falls in the period — rejected (sales window ≠ event date).

6. **Table order**
   - **Choice:** Order by `ticketsSold` descending, then `dateTime` descending, then `title` ascending for stability.
   - **Rationale:** Ops care about high-volume events first.
   - **Alternatives:** Chronological by event date — acceptable fallback if product prefers calendar reading.

7. **CSV transport: same route + `format=csv`**
   - **Choice:** One HonoX route file for `/:locale/admin/partners/export`. If `format=csv`, return `c.body` CSV attachment (guard + period validation first); otherwise render `AdminSalesExportPage`. Filename like `sales-export-{from}-{to}.csv`.
   - **Rationale:** Shares guard/parse with the HTML page; mirrors codes attachment headers; avoids a second route file unless HonoX routing forces a sibling.
   - **Alternatives:** Sibling `export.csv` route — fine if file routing is cleaner; POST download — unnecessary for a read report.

8. **Period validation UX**
   - **Choice:** Invalid date strings, `from > to`, or empty required fields after an explicit submit → render the page with an error message and no/empty results (not a 500). CSV requests with invalid period → `400` text body (or redirect to HTML with error); do not attach a partial CSV.
   - **Rationale:** Clear admin feedback; keep CSV machine-readable failures simple.
   - **Alternatives:** Always 302 to a sanitized default — hides user mistakes.

9. **Export action placement: list toolbar only**
   - **Choice:** Add a secondary/toolbar `Link` next to **New partner** on `AdminPartnersListPage.actions` pointing to `/:locale/admin/partners/export`. No per-row Export (report is all-events, not partner-scoped).
   - **Rationale:** Locked in step 02 design open questions; matches “page-level period”.
   - **Alternatives:** Row action — misleading for an all-events report; both — clutter.

10. **UI composition**
    - **Choice:** `AdminSalesExportPage` inside `AdminPageShell`: GET form with native `<input type="date">` for from/to + submit; HeroUI `Table` for rows; `Link`/`Button` to CSV URL with same `from`/`to` + `format=csv`. Empty state when zero events in DB (or optional note when all zeros).
    - **Rationale:** Native-first (§14); SSR form; consistent admin chrome.
    - **Alternatives:** HeroUI date widgets — rejected (§14).

11. **CSV columns**
    - **Choice:** Header row: `event_id,title,partner_name,date_time,tickets_sold` (ISO-ish `date_time`, integer tickets). Escape titles/names per normal CSV rules.
    - **Rationale:** Matches domain row shape; stable for spreadsheet import.
    - **Alternatives:** Localized headers — deferred (ops + machines prefer English keys).

## Risks / Trade-offs

- **[Risk] “Every event” table grows large** → Mitigation: acceptable for MVP venue count; step 04 may add filters if needed; CSV still usable.
- **[Risk] Berlin DST edge on day bounds** → Mitigation: use a known offset/helper pattern from `admin-event-form` / Temporal-style conversion; cover with unit tests around DST transitions if feasible.
- **[Risk] Counting by `created_at` vs event night confuses partners** → Mitigation: page subtitle copy clarifies “bookings created in period”; document in Spec Delta.
- **[Risk] Invalid CSV request returns HTML by mistake** → Mitigation: branch on `format=csv` before `c.render`; tests for Content-Type.
- **[Trade-off] Zeros included** → Longer tables; clearer completeness.
- **[Trade-off] Toolbar-only Export** → Parent guide mentioned row and/or list-level; list-level alone matches all-events scope.

## Migration Plan

1. Land domain helper + tests in `@unveiled/db`.
2. Add copy + `AdminSalesExportPage` + export route; wire partner-list Export link.
3. Run typecheck, lint, db package tests; manual ADMIN/non-admin check.
4. Mark step 03 done in the parent guide after merge.
5. Rollback: revert route/UI + `sales-export` module; no migrations to undo.

## Open Questions

- None blocking. Tickets-sold definition is locked by the step-plan Spec Delta (CONFIRMED/USED by `created_at`). Product can reopen in step 04 if partners need event-date filtering instead.
