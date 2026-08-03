## Context

Parent feature `partner-opening-hours`, step 02 — admin form UI after schema/domain (step 01 done).

Current state:

- Domain APIs accept `hasOpeningHours` / `openingHours` with `parseOpeningHours` / `assertOpeningHoursForWrite` and reject via `CatalogValidationError("INVALID_OPENING_HOURS", …)`.
- Admin create/edit (`new.tsx` / `[id]/edit.tsx`) parse via `parsePartnerFormBody` and call `createPartner` / `updatePartner` **without** hours fields (omit → hours-off on create; edit leaves existing hours untouched unless passed).
- UI: `PartnerForm` is already a client island (`"use client"`) with HeroUI text fields + native zip/country/city + logo upload; submit is multipart form POST.
- `mapCatalogErrorCode` does not yet handle `INVALID_OPENING_HOURS`.

Constraints: SSR-only mutations (`AGENTS.md` §1); HeroUI layout + native checkbox/time (`§8`, `§14`); theme-owned visuals (`§9`); no overnight spans; Europe/Berlin wall times (no timezone picker).

## Goals / Non-Goals

**Goals:**

- Native toggle + Mon–Sun rows on create and edit; reveal when checked.
- Parse POST → domain week; clear hours when toggle off; prefill edit from stored partner.
- Surface validation errors with DE/EN admin copy (hours block / form flash).
- Pure-function unit tests for form ↔ domain mapping.

**Non-Goals:**

- Public event detail display, Gherkin/e2e, schema-overview polish (step 03).
- Partner list column, partner portal, overnight spans, per-date exceptions.
- Changing domain validation rules from step 01.

## Decisions

1. **POST field names (parent handoff)**
   - **Choice:** `has_opening_hours` (checkbox); per day `closed_<day>`, `open_<day>`, `close_<day>` where `<day>` ∈ `mon`…`sun`.
   - **Rationale:** Matches parent guide; works with native FormData without array quirks; stable keys for parse + error re-render.
   - **Alternatives:** Nested JSON hidden field (worse progressive enhancement / harder to debug); HeroUI time widgets (forbidden for these fields per §14).

2. **Parse helper lives in apps/web; domain remains source of truth**
   - **Choice:** Add a small pure mapper (e.g. `partner-opening-hours-form.ts` or extend `admin-route.ts`) that builds `{ hasOpeningHours, openingHours }` from the POST body. When toggle off → `{ hasOpeningHours: false, openingHours: null }` and ignore day fields. When on → assemble full week objects and pass to `createPartner` / `updatePartner` (domain re-validates).
   - **Rationale:** Business rules stay in `@unveiled/db`; routes stay thin; mapper is unit-testable without R2.
   - **Alternatives:** Call `parseOpeningHours` only after a loose assemble (preferred — let domain throw `INVALID_OPENING_HOURS`); duplicate open&lt;close checks in the form layer (rejected).

3. **Toggle UX: client reveal inside existing PartnerForm island**
   - **Choice:** Local React state (or controlled checkbox) shows/hides the weekday block. All controls remain named form fields so POST works without a separate API. Closed-day checkbox disables (and preferably clears or ignores) open/close inputs for that day.
   - **Rationale:** PartnerForm is already an island; matches event multi-datetime “island owns chrome, SSR owns validation” pattern. No client-only save modal.
   - **Alternatives:** Always-visible rows with toggle only affecting submit semantics (noisier UX); full-page reload toggle via GET (worse).

4. **Closed vs open day mapping**
   - **Choice:** If `closed_<day>` is checked → `{ closed: true }` (omit open/close in domain object). Else → `{ open, close }` from time inputs (`HH:MM` from `type="time"`). Empty open/close when enabled and not closed → let domain reject (or optional early form error with same copy key).
   - **Rationale:** Matches step 01 JSON contract; avoids inventing hours.
   - **Alternatives:** Default all days closed when toggle first checked (nice UX — optional implementer choice; not required by spec).

5. **Edit prefill and error round-trip**
   - **Choice:** Extend `PartnerFormDefaults` with `hasOpeningHours` + per-day closed/open/close (or a typed week). Edit GET maps `partner.hasOpeningHours` / `partner.openingHours`. On POST error, rebuild defaults from parsed `PartnerFormValues` so the toggle state and weekday fields survive re-render.
   - **Rationale:** Spec requires prefill; existing partner form already round-trips other fields this way.
   - **Alternatives:** Only flash error without restoring hours (rejected).

6. **Error surfacing**
   - **Choice:** Map `INVALID_OPENING_HOURS` in `mapCatalogErrorCode` to a dedicated `fieldErrors.openingHours` (or top-form flash using that string). Optionally show the same message near the hours block via `error` prop or a field-level slot.
   - **Rationale:** Domain already emits this code; admin copy must be DE/EN.
   - **Alternatives:** Parse-layer-only errors without domain (insufficient — domain still validates on write).

## Risks / Trade-offs

- **[Risk] `type="time"` browser quirks / missing leading zeros** → Mitigation: normalize to `HH:MM` in the mapper before domain parse; unit-test common values.
- **[Risk] Unchecked closed checkboxes omit keys from FormData** → Mitigation: treat missing `closed_<day>` as false; when toggle on, still emit all seven days from open/close (or explicit closed).
- **[Risk] Disabled time inputs not submitted** → Mitigation: when closed, do not rely on open/close values; when open, ensure inputs are enabled before submit (or use hidden mirrors — prefer enable when not closed).
- **[Risk] Edit without touching hours leaves stale schedule if mapper omits fields** → Mitigation: always pass explicit `hasOpeningHours` + `openingHours` from every create/update POST that includes the form (toggle always present).
- **[Trade-off] No list-column / public display yet** → Accepted until step 03.

## Migration Plan

1. Add form defaults, parse/serialize helpers, and unit tests.
2. Extend PartnerForm UI + admin copy + error mapping.
3. Wire create/edit POST to pass hours into catalog APIs; prefill edit GET.
4. Run lint, typecheck, and form-mapper tests.
5. Mark step done in parent guide.
6. Rollback: revert admin form PR; domain columns remain valid with hours-off default.

## Open Questions

- None blocking — field names and island reveal are decided; product Gherkin deferred to step 03 unless a one-line admin scenario is needed for unblockers (optional).
