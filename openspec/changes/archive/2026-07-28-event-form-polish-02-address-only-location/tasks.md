## 1. Inventory & schema

- [x] 1.1 Inventory all writers/readers of `mapZoom` / `map_zoom`, `lat`, `lng` in admin forms, catalog, seed, stories, e2e fixtures, and tests
- [x] 1.2 Drop `events.map_zoom` from `packages/db` schema and generate/apply Drizzle migration
- [x] 1.3 Remove `mapZoom` from `CreateEventInput` / `UpdateEventInput` / series path and stop writing the column; keep optional derived `lat`/`lng`
- [x] 1.4 Update seed fixtures, stories, and unit test event objects that construct `mapZoom`

## 2. Admin geo preview & form parse

- [x] 2.1 Redesign `EventGeoPicker` as display-only geocode preview: non-draggable marker; remove click-to-set / drag authoring; remove `map_zoom` hidden field; use default zoom
- [x] 2.2 Post derived `lat`/`lng` only when coordinates are resolved (successful geocode or preserved edit coords) — never persist Berlin-center defaults as real coords on soft-fail
- [x] 2.3 Wire address-driven geocode updates in `EventAdminBaseFields` (partner prefill on create/series unchanged; address blur/debounce MAY re-geocode; edit partner change still must not overwrite address)
- [x] 2.4 Remove `mapZoom` from `EventFormValues`, parsers, `eventToFormDefaults`, `admin-event-input`, and route helpers; update `admin-event-form.test.ts`
- [x] 2.5 Adjust admin copy / remove dead lat/lng/zoom labels; keep map labeled as location preview

## 3. Public detail LOCATION

- [x] 3.1 Update `EventDetailPage` so LOCATION renders whenever an address exists; show map under the address only when derived coordinates exist
- [x] 3.2 Confirm identity-row address behavior stays coherent (no duplicate confusing empty LOCATION)

## 4. Product docs

- [x] 4.1 Update `docs/product/features/admin-events.feature` for address-only input, partner-prefill, edit-no-overwrite, and geocode soft-fail wording
- [x] 4.2 Update `docs/product/features/event-discovery.feature` for LOCATION address ± optional map scenarios
- [x] 4.3 Update `docs/product/database/schema-overview.md` and `extras/gaps-and-decisions.md` (lat/lng system-derived; `map_zoom` removed); touch ui-component-map / i18n inventory if geo picker notes need it

## 5. Verification & handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run updated admin-event form (and related) unit tests — no `map_zoom` / no manual lat/lng authoring assertions (exit 0)
- [ ] 5.3 Manual smoke: create event → select partner → address fills and map preview moves; no zoom/lat/lng fields; detail shows address + map; geocode-fail partner saves address and detail shows address without map
- [x] 5.4 Mark step done in `.dev-plan/current-iteration/event-form-polish-parent-guide.md` when merging; prepare PR/handoff linking `event-form-polish-02-address-only-location`
