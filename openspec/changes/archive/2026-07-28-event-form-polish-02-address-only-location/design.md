## Context

Parent feature: Event form polish (`.dev-plan/current-iteration/event-form-polish-parent-guide.md`). Child step 02 — depends on archived `event-form-polish-01-language-independent` (shared form surface).

Today admins set location via `EventGeoPicker`: MapLibre + OSM with a **draggable** marker, map click-to-place, and hidden POST fields `lat`, `lng`, `map_zoom`. Partner select on create/series prefills address and soft-fail Nominatim-updates the pin (`geocodeBerlinAddress`). Edit does not overwrite address/coords on partner change. Public `EventDetailPage` shows address in the identity row always, but the LOCATION **card** (address + map) only renders when `mapMarkers.length > 0` (coords present) — so address-without-coords never appears in LOCATION.

Constraints: SSR form POST; MapLibre + OSM, no API key; Nominatim soft-fail; HeroUI chrome + Tailwind layout only; keep derived `lat`/`lng` for detail + member `/events/map`; drop `map_zoom` authoring; series create shares `EventAdminBaseFields`.

## Goals / Non-Goals

**Goals:**

- Address is the only admin-authored location field on create/edit/series.
- Map preview is geocode-driven only (non-draggable marker; no click-to-set).
- Persist address always when valid; set `lat`/`lng` only from a trusted geocode (or preserved existing) path — never invent Berlin-center as “real” coords on soft-fail.
- Drop `events.map_zoom` (migration) and remove all writers/readers.
- Detail LOCATION section shows address whenever an address exists; map under it when coords exist.
- Product Gherkin, schema overview, gaps-and-decisions, and OpenSpec deltas updated.

**Non-Goals:**

- Language-independent (01) or image retention (03).
- Partner table lat/lng or partner portal.
- Reverse-geocode from pin drag.
- Changing member map clustering/filters beyond reading derived coords.
- Server-side Nominatim on every save (Workers/rate-limit risk) — prefer client geocode → derived hidden fields, documented as non-manual.

## Decisions

1. **Drop `events.map_zoom` column (migration), use constant default zoom in UI**  
   - **Why:** Parent non-goal removes zoom authoring; column unused for product behavior; cleaner than leaving a dead field. Preview/detail maps use existing `DEFAULT_ZOOM` (12) or MapLibre fit behavior.  
   - **Alternatives:** Stop writing `map_zoom` but keep column (lingering debt); keep per-event zoom without admin UI (no product need).

2. **`EventGeoPicker` becomes display-only geocode preview**  
   - **Why:** Matches address-only SoT. Marker `draggable: false`; remove map click-to-place and zoom/move sync that rewrites authoring coords. Pin moves only when `externalLat`/`externalLng`/`externalRevision` update from geocode (partner select and/or address re-geocode).  
   - **Alternatives:** Keep drag as “advanced” override (rejected by product); remove map entirely (worse UX for partner prefill confirmation).

3. **Derived hidden `lat`/`lng` POST only when coordinates are “resolved”**  
   - **Why:** Today the picker always POSTs Berlin-center defaults, which would falsely geolocate failed geocodes. Introduce a resolved flag (or omit empty hidden fields / post empty strings) so create/update persist `lat`/`lng` as null when no successful geocode and no preserved edit coords. Parser already supports optional coords — ensure null wins over Berlin defaults.  
   - **Alternatives:** Server-side geocode on save (extra dependency/latency); always keep last coords even after address change (stale pin risk).

4. **Address edit may re-geocode (debounced blur or change)**  
   - **Why:** Step brief allows it; with address as SoT, partner-only geocode leaves a stale pin after manual address edits. On create/series (and edit when address text changes), debounce Nominatim via existing `geocodeBerlinAddress`; soft-fail leaves preview unchanged and clears resolved coords if the address string changed since last success (prefer null over stale). Edit partner change still MUST NOT overwrite address (existing rule).  
   - **Alternatives:** Partner-select geocode only (simpler, weaker address-SoT); geocode only on submit (no live preview update).

5. **Catalog domain: stop accepting `mapZoom`; lat/lng remain optional**  
   - **Why:** `CreateEventInput` / `UpdateEventInput` drop `mapZoom`; inserts/updates never write `map_zoom`. Seed/fixtures/tests remove the field. No backfill of lat/lng.  
   - **Alternatives:** Ignore posted `map_zoom` but keep column (rejected per decision 1).

6. **Detail LOCATION: render card when address is non-empty; map subsection when coords exist**  
   - **Why:** Current gate `mapMarkers.length > 0` hides LOCATION entirely without coords — violates product. Identity-row address can stay; LOCATION card must show address ± map.  
   - **Alternatives:** Only identity-row address (loses LOCATION section semantics in Gherkin); invent coords (forbidden).

7. **Copy: map control labeled as location preview, not coordinate editor**  
   - **Why:** Remove any lat/lng/zoom field labels; keep/adjust `mapLocationLabel` toward preview wording if needed; purge dead i18n keys.  
   - **Alternatives:** Keep old “set location on map” copy (misleading).

8. **Series + single event share the same picker/parser path**  
   - **Why:** Same as step 01 — avoid drift between `EventAdminBaseFields` and series.  
   - **Alternatives:** Series-only simplification (drift).

## Risks / Trade-offs

- **[Risk] Stale coords after address change + geocode fail** → Clear resolved lat/lng when address text changes and geocode soft-fails; detail shows address without map.  
- **[Risk] Nominatim rate limits / offline CI** → Keep soft-fail; e2e asserts address prefill, not live pin success (existing pattern).  
- **[Risk] Hidden fields still forgeable by client** → Acceptable for MVP (same trust model as today); document as derived preview values; domain does not treat them as admin “authoring UI.” Future: server geocode.  
- **[Trade-off] Dropping `map_zoom` vs ignoring it** → Short migration + fixture churn vs permanent dead column; prefer drop.  
- **[Trade-off] Non-draggable preview frustrates power users** → Product-explicit; address corrections via address field.

## Migration Plan

1. Inventory all `mapZoom` / `map_zoom` / drag authoring call sites (schema, catalog, form, seed, tests, stories).  
2. Generate Drizzle migration dropping `events.map_zoom`; update schema + create/update inputs.  
3. Redesign `EventGeoPicker` + `EventAdminBaseFields` geocode wiring (resolved coords, optional address re-geocode).  
4. Fix `EventDetailPage` LOCATION gating.  
5. Update unit tests, Gherkin, schema overview, gaps-and-decisions, OpenSpec deltas sync to `docs/product/`.  
6. `bun run lint` / `typecheck` / focused form tests; manual smoke.  
7. Rollback: restore column + previous picker behavior via revert migration/code; no destructive rewrite of lat/lng.

## Open Questions

- None blocking. If address re-geocode on every keystroke is noisy, prefer blur/debounce ≥300ms; implementer may start with partner-select + address-blur only.
