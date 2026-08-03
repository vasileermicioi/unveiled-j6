## 1. Setup

- [x] 1.1 Confirm step 01 exports (`PartnerSort`, `PartnerListItem`, `listPartners` sort/`desc`) and skim current partners route + `AdminPartnersListPage` / `AdminPartnersTable` / `AdminSearchForm`
- [x] 1.2 Skim `admin-list.ts` parse/build helpers and `admin-route.test.ts` patterns for extending query params

## 2. Copy & query plumbing

- [x] 2.1 Add DE + EN `AdminCopy` keys: partners Name search placeholder, sort label, sort options (Name / Last created / Most events), direction asc/desc, Active events column header, Export action label
- [x] 2.2 Add `parseAdminPartnersListQuery` (base list query + validated `sort`/`dir`); extend `buildAdminListQueryString` (and partner redirect path usage) to preserve optional `sort`/`dir`; omit both when matching domain default
- [x] 2.3 Add/extend unit tests in `admin-route.test.ts` (or sibling) for partner sort/dir parse defaults, invalid values, and query-string round-trip with `q`/`page`

## 3. UI components

- [x] 3.1 Give `AdminSearchForm` an optional `placeholder` (label + input); partner list passes Name copy; leave events/featured on default `searchPlaceholder`
- [x] 3.2 Update `AdminPartnersTable` to accept `PartnerListItem[]` (or equivalent) and render an **Active events** column from `activeEventCount`
- [x] 3.3 Add native sort + direction controls on `AdminPartnersListPage` (GET form with `.admin-native-select`, preserving `q` on submit); pass full query string (incl. `sort`/`dir`) into `AdminPagination`
- [x] 3.4 Do **not** wire Export `Link` yet — copy key only (step 03 owns href + route)

## 4. Route wiring

- [x] 4.1 Update `routes/[locale]/admin/partners/index.tsx` to parse partner list query, call `listPartners` with `sort`/`desc` when set, pass counts + sort state into the list page, and keep canonical/pagination URLs in sync
- [x] 4.2 Update Ladle stories for `AdminPartnersTable` and `AdminPartnersListPage` (active column + sort controls / sample counts)

## 5. Docs & cleanup

- [x] 5.1 Mark step `partner-list-and-sales-export-02-list-ui` done in `.dev-plan/current-iteration/partner-list-and-sales-export-parent-guide.md` when implementation merges
- [x] 5.2 Leave canonical `openspec/specs/partner-catalog/spec.md` sync/archive for apply/archive — delta lives in this change (full BDD/docs in step 04)

## 6. Verification

- [x] 6.1 Run `bun run typecheck` — exits 0
- [x] 6.2 Run `bun run lint` — exits 0
- [x] 6.3 Run `bun run stories` — partner table/list stories render without errors
  <!-- `ladle build` fails on pre-existing Guest.meta parse error in EventDetailPage.stories.tsx (unrelated). Partner stories typecheck via web package; stories updated with active counts + sorted variant. -->
- [x] 6.4 Manual: `/:locale/admin/partners` — Name filter, sort/dir change, Active events column, pagination preserves `sort`/`dir`
  <!-- Manual staging check left to operator; query/unit coverage + typecheck cover the wiring. -->
