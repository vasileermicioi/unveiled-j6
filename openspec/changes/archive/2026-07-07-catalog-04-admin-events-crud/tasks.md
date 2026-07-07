## 1. Setup

- [x] 1.1 Read `admin-events.feature`, pagination-and-search, image-uploads §4, ui-component-map Admin Events section, and this change's proposal/design/specs
- [x] 1.2 Confirm at least one partner exists (via seed or catalog-03) and ADMIN test account credentials for verification
- [x] 1.3 Extend `countEvents` in `@unveiled/db` to accept optional `q` filter matching `listEvents` search; add `date_time DESC` ordering to `listEvents`

## 2. Admin route helpers

- [x] 2.1 Extend `admin-route.ts` with `parseEventFormBody`, `parseBerlinDateTime`, `parseSeriesSlots`, and `formatEventDateTime`
- [x] 2.2 Extend `mapCatalogError` / `admin-content.ts` with event form labels, list headers, series preview/confirm copy, and event validation error messages (DE/EN)
- [x] 2.3 Add unit tests for Berlin datetime parsing, series slot expansion, and event form body parsing where pure helpers exist

## 3. Admin event components

- [x] 3.1 Create `EventAdminForm.tsx` — all single-event fields, partner select, ticket-type branching (SECRET_CODE modes vs VOUCHER), image file + URL inputs, multipart enctype
- [x] 3.2 Create `EventSeriesForm.tsx` — shared base fields, manual slot rows, date-range/weekday builder inputs, preview section with confirm action
- [x] 3.3 Create `AdminEventsTable.tsx` — thumbnail, title, partner, Berlin date/time, capacity, edit/delete/codes row actions
- [x] 3.4 Create `AdminEventsListPage.tsx` — composes search form, table, pagination, links to new event and new series

## 4. Admin events list

- [x] 4.1 Implement `apps/web/app/routes/[locale]/admin/events/index.tsx` — guard ADMIN, parse `q` and `page`, call `listEvents` + filtered `countEvents`
- [x] 4.2 Render searchable paginated table with `small-320` thumbnail via `buildVariantUrl` when `imageId` present
- [x] 4.3 Add links to new event, new series, edit, delete, and codes export routes

## 5. Single event create

- [x] 5.1 Implement `apps/web/app/routes/[locale]/admin/events/new.tsx` GET — load partner options, render `EventAdminForm` via `AdminPageShell`
- [x] 5.2 Implement POST — parse multipart body, call `createEvent` with `uploadedBy`, redirect to list on success or re-render with validation errors

## 6. Event series create

- [x] 6.1 Implement `apps/web/app/routes/[locale]/admin/events/series/new.tsx` GET — render `EventSeriesForm`
- [x] 6.2 Implement POST preview action — parse base fields and slots (manual or date-range builder), re-render with slot preview list
- [x] 6.3 Implement POST confirm action — call `createEventSeries` with parsed slots; redirect to list on success or re-render errors

## 7. Event edit

- [x] 7.1 Implement `apps/web/app/routes/[locale]/admin/events/[id]/edit.tsx` GET — load event and partner options, 404 if missing, prefill form
- [x] 7.2 Implement POST — parse multipart, call `updateEvent` (image replace + capacity recalculation via domain), redirect or re-render errors

## 8. Event delete

- [x] 8.1 Implement `apps/web/app/routes/[locale]/admin/events/[id]/delete.tsx` GET — confirmation page with event title and date
- [x] 8.2 Implement POST — call `deleteEvent`; redirect to list on success; 404 if missing

## 9. Redemption codes export

- [x] 9.1 Implement `apps/web/app/routes/[locale]/admin/events/[id]/codes.tsx` GET — guard ADMIN, load event, return CSV from `exportRedemptionCodesCsv` with attachment headers

## 10. Dashboard verification

- [x] 10.1 Verify admin dashboard events quick link resolves to the new list route (link already exists from catalog-03)

## 11. Verification

- [x] 11.1 Manual: ADMIN creates single event with file upload — appears on `/admin/events` with correct Berlin date and thumbnail
- [x] 11.2 Manual: ADMIN creates series with two slots — two events appear sharing title/partner
- [x] 11.3 Manual: edit event image — old image row and bucket objects removed
- [x] 11.4 Manual: delete event — removed from list; codes CSV download returns header row
- [x] 11.5 Run `bun run lint && bun run typecheck && bun run build` — pass
