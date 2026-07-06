## 1. Setup

- [x] 1.1 Read `admin-partners.feature` (record CRUD scenarios only), pagination-and-search, image-uploads §4, and this change's proposal/design/specs
- [x] 1.2 Confirm ADMIN test account credentials for local/staging verification
- [x] 1.3 Extend `countPartners` in `@unveiled/db` to accept optional `q` filter matching `listPartners` search (for pagination totals)

## 2. Admin route helpers

- [x] 2.1 Create `apps/web/app/lib/admin-route.ts` with `guardAdminRoute`, `parsePartnerFormBody`, and `mapCatalogError`
- [x] 2.2 Add admin copy strings (DE/EN) to `apps/web/app/lib/copy.ts` — dashboard, partners list, form labels, validation messages
- [x] 2.3 Add unit tests for form parsing and catalog error mapping where pure helpers exist

## 3. Admin components

- [x] 3.1 Create `AdminPageShell.tsx` — page title, breadcrumbs, action slot
- [x] 3.2 Create `AdminTable.tsx` — HeroUI table wrapper for admin lists
- [x] 3.3 Create `PartnerForm.tsx` — name, contact email, address, logo file + URL fields, multipart enctype
- [x] 3.4 Create `AdminSearchForm.tsx` — GET form with `q` param
- [x] 3.5 Create `AdminPagination.tsx` — prev/next links preserving active query params and server-side total count display

## 4. Admin dashboard

- [x] 4.1 Implement `apps/web/app/routes/[locale]/admin/index.tsx` GET — quick links, zero-state, conditional seed button via `shouldRunDemoSeed`
- [x] 4.2 Implement POST handler on dashboard — guard ADMIN, call `runDemoSeed`, redirect with success/skipped indicator
- [x] 4.3 Set `robots: "noindex"` metadata on admin pages

## 5. Partner list

- [x] 5.1 Implement `apps/web/app/routes/[locale]/admin/partners/index.tsx` — guard ADMIN, parse `q` and `page`, call `listPartners` + filtered `countPartners`
- [x] 5.2 Render searchable paginated table with logo thumbnail via `buildVariantUrl(..., "small-320.webp")` when `logoImageId` present
- [x] 5.3 Add links to new partner, edit, and delete routes

## 6. Partner create

- [x] 6.1 Implement `apps/web/app/routes/[locale]/admin/partners/new.tsx` GET — render `PartnerForm` via `AdminPageShell`
- [x] 6.2 Implement POST — parse multipart body, call `createPartner` with `uploadedBy`, redirect to list on success or re-render with validation errors

## 7. Partner edit

- [x] 7.1 Implement `apps/web/app/routes/[locale]/admin/partners/[id]/edit.tsx` GET — load partner by id, 404 if missing, prefill form
- [x] 7.2 Implement POST — parse multipart, call `updatePartner` (logo replace deletes old image via domain), redirect or re-render errors

## 8. Partner delete

- [x] 8.1 Implement `apps/web/app/routes/[locale]/admin/partners/[id]/delete.tsx` GET — confirmation page with partner name
- [x] 8.2 Implement POST — call `deletePartner`; handle `PARTNER_HAS_EVENTS` error; redirect to list on success

## 9. Navbar

- [x] 9.1 Add ADMIN-only link to `/admin` in `AppNavbar` and `AppNavbarMenu` using admin copy strings

## 10. Verification

- [x] 10.1 Manual: ADMIN creates partner with pasted logo URL — appears in list with thumbnail
- [x] 10.2 Manual: seed button on empty DB runs seed and hides afterward; signed-in USER cannot access `/admin/partners`
- [x] 10.3 Run `bun run lint && bun run typecheck && bun run build` — pass
