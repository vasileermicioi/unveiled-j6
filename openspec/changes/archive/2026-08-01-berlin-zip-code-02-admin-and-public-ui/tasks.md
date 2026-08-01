## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/berlin-zip-code-02-admin-and-public-ui.md` and parent guide Location Model + non-goals
- [x] 1.2 Confirm domain field names (`country` / `city` / `zipCode` / `zip_code`) and `PostalValidationError` codes from step 01; inventory shim UI in `EventAdminBaseFields`, parsers, cards, detail, seed

## 2. Admin location UI

- [x] 2.1 Replace zip HeroUI `TextField` with native `zip_code` input + HeroUI `Label` / helper `Description` (Berlin PLZ copy DE+EN) in `EventAdminBaseFields`
- [x] 2.2 Add visible non-editable Germany/Berlin country and city chrome; keep hidden named `country=DE` / `city=berlin` so POST always includes them
- [x] 2.3 Add `admin-content.ts` labels/hints for country, city, zip helper (and tighten `fieldErrors.zipCode` if needed)
- [x] 2.4 Confirm `admin-event-form.ts` / route helpers / series path round-trip zip + country/city; `PostalValidationError` maps to admin-visible zip error
- [x] 2.5 Update `EventAdminBaseFields` stories / defaults for the new controls

## 3. Public surfaces

- [x] 3.1 Verify `EventCard` shows zip (not neighborhood); fix any remaining neighborhood chrome/labels
- [x] 3.2 Verify `EventDetailPage` DETAILS/LOCATION shows zip; do not reintroduce Bezirk labels; keep address + map rules unchanged
- [x] 3.3 Update story fixtures if cards/detail stories still imply neighborhood

## 4. Seed and cleanup

- [x] 4.1 Update demo seed / Abundo fixtures so events persist `DE` / `berlin` + Berlin zips (adapter OK only if Abundo still ships `neighborhood`)
- [x] 4.2 Remove `getEventNeighborhoodOptions` and other dead neighborhood option helpers if unused
- [x] 4.3 Grep for leftover event-neighborhood UI strings in admin/public components touched by this step

## 5. Verification and handoff

- [x] 5.1 Run `bun run lint` — exit 0
- [x] 5.2 Run `bun run typecheck` — exit 0
- [x] 5.3 Manual smoke: create/edit with valid Berlin PLZ succeeds (country/city stay Germany/Berlin); invalid PLZ shows admin error; public detail shows zip
- [x] 5.4 Confirm series form (if still shipped) uses the same location fields via shared base fields
- [x] 5.5 Mark step done in parent guide; leave Gherkin/docs/e2e for step 04; note change ID for PR/handoff
