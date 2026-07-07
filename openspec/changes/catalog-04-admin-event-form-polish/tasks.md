## 1. Setup

- [ ] 1.1 Read proposal, design, spec delta; confirm image work is out of scope (see `catalog-04-admin-event-image-upload`)
- [ ] 1.2 Read HeroUI DatePicker / TimeField docs via project skill if needed

## 2. Date and time controls

- [ ] 2.1 Replace native date input with HeroUI DatePicker in event admin island
- [ ] 2.2 Wire selected date to SSR POST (hidden field or named input)
- [ ] 2.3 Verify create/edit preserve correct `date_time` via domain layer

## 3. Multi-select fields

- [ ] 3.1 Add multi-select for `languages` with predefined options
- [ ] 3.2 Add multi-select for `target_age_groups` with enum options
- [ ] 3.3 Update route parsers to accept array values into `text[]` / enum arrays

## 4. Map geolocation picker

- [ ] 4.1 Add `map_zoom` to events schema if missing (migration)
- [ ] 4.2 Create `EventGeoPicker` island (MapLibre + marker + zoom)
- [ ] 4.3 Remove free-text lat/lng fields from `EventAdminBaseFields`
- [ ] 4.4 Edit form initializes map from stored lat/lng/map_zoom

## 5. Select polish

- [ ] 5.1 Verify select popovers anchor below triggers on event/partner forms
- [ ] 5.2 Adjust global popover styles if regressions found

## 6. Verification

- [ ] 6.1 Manual: create/edit event with date, multi-selects, map location
- [ ] 6.2 Run `bun run lint && bun run typecheck && bun run build`
