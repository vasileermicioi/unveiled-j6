## Context

Admin event create/edit (`EventAdminBaseFields`) and series create (`EventSeriesForm`) collect multi-value metadata with `AdminFormSelect` `selectionMode="multiple"` (native `<select multiple>`). Onboarding/profile already ship a better UX via `LanguageMultiSelect` (searchable native checkboxes that POST array fields). Partners expose `address` but no lat/lng; map location is set via `EventGeoPicker` (MapLibre + OSM). Parent feature `event-form-and-detail` wants checkbox multi-selects now and partner-driven address/map prefill on **add/series only** before public detail work in step 02.

Constraints: AGENTS.md §14 (native checkboxes/selects — no HeroUI `Select`/`Checkbox`); SSR form POST unchanged; theme tokens in `globals.css` only; no partner schema migration for coordinates.

## Goals / Non-Goals

**Goals:**

- One shared checkbox multi-select island with optional search, reused by onboarding languages, admin languages (search), age groups (no search), and series weekdays (no search).
- Partner dropdown on create/series prefills address from `partner.address` and soft-fails geocode into the map pin.
- Edit partner change leaves address and map alone.
- `PartnerOption` carries `address` end-to-end through `toPartnerOptions`.

**Non-Goals:**

- Public event detail layout / partner logo (step 02).
- Product Gherkin / Playwright / design-system narrative sync (step 03).
- Adding `lat`/`lng` on `partners`.
- Replacing single-value native `<select>` fields.
- Removing `AdminFormSelect` multiple mode entirely if stories still need it (defer cleanup to 03 with a comment if left).

## Decisions

1. **Shared `CheckboxMultiSelect` island; thin `LanguageMultiSelect` wrapper (or equivalent)**  
   - **Why:** Avoid duplicating filter + selected-stay-mounted POST behavior; onboarding already proven. Prefer one control with `enableSearch` / omit filter UI rather than two parallel implementations.  
   - **Alternatives:** Copy-paste admin-only control (drift); keep `LanguageMultiSelect` and add a second age/weekday control (duplication).

2. **Generic option shape `{ value, label }` (languages map `code` → `value`)**  
   - **Why:** Age groups and weekdays are not language codes; keep the shared island domain-agnostic. Wrapper can preserve the existing `code` prop API for onboarding/profile.  
   - **Alternatives:** Keep `code` everywhere (awkward for weekdays).

3. **Selected values stay mounted when filtered (same as onboarding)**  
   - **Why:** Filter must not drop already-selected checkboxes from the POST payload.  
   - **Alternatives:** Hide selected when filtered (breaks submit).

4. **Partner prefill gated by `isEdit !== true` inside base fields / series form**  
   - **Why:** `EventAdminBaseFields` already receives `isEdit`; series create is never edit. Single place for partner `onChange` avoids route-level business logic.  
   - **Alternatives:** Separate create-only partner island (more files).

5. **Address field: controlled value or remount `key` on partner-driven updates**  
   - **Why:** HeroUI `TextField`/`Input` today uses `defaultValue` and will not reflect partner changes otherwise. Controlled state (or `key={partnerId|address}`) is enough for create/series; edit path never writes.  
   - **Alternatives:** Imperative DOM mutation (fragile).

6. **Geocode via Nominatim (Berlin-biased) client-side; soft-fail**  
   - **Why:** No partner lat/lng columns; MapLibre already client-side; parent guide accepts address-only fallback if Nominatim is unsuitable.  
   - **Implementation sketch:** helper under `apps/web/app/lib/` (e.g. `geocode-berlin.ts`) calling Nominatim search with `countrycodes=de`, viewbox/Berlin bias, User-Agent-friendly headers as browser allows; on success push lat/lng into `EventGeoPicker` via new optional props (`externalLat`/`externalLng` or a `locationRevision` + coords). On failure/timeout: leave map as-is, address still filled.  
   - **Alternatives:** Server proxy (extra API surface, out of step scope); schema migration for partner coords (explicit non-goal).

7. **`EventGeoPicker` accepts external coordinate updates after mount**  
   - **Why:** Partner change happens after the map island has initialized; initial `lat`/`lng` props alone are insufficient. Expose a controlled update path (effect when external coords change) without rewriting the whole MapLibre setup.  
   - **Alternatives:** Remount the entire picker via `key` on every partner change (works but loses marker drag state unnecessarily; acceptable fallback).

8. **Align `PartnerOption` in both `event-admin-types.ts` and `admin-event-route-helpers.ts`**  
   - **Why:** Today helpers define `Pick<Partner, "id" | "name">` separately from the component type `{ id, name }`. Both must include `address` (nullable/empty string if missing). Prefer helpers as the mapping source routes already call.  
   - **Alternatives:** Single shared type export only from helpers (nice-to-have; not required if both stay in sync).

9. **Theme: reuse/extend onboarding language-select classes for admin**  
   - **Why:** Hard rule — no per-route colors; admin forms already share native control tokens. Add admin layout class hooks if needed, but colors/borders stay in `globals.css`.  
   - **Alternatives:** New ad-hoc Tailwind color classes (forbidden).

## Risks / Trade-offs

- **[Risk] Nominatim rate limits / CORS / ToS** → Soft-fail; address still prefills; note outcome for step 03 Risks; do not block on partner lat/lng schema.  
- **[Risk] Controlled address fights SSR re-render after validation errors** → Initialize from `defaults.address`; only overwrite on user partner change when `!isEdit`; preserve posted values on error re-render via existing defaults plumbing.  
- **[Risk] Onboarding regression if LanguageMultiSelect API breaks** → Keep thin wrapper with current props (`name`, `options` with `code`/`label`, `selected`, `filterPlaceholder`) or update both call sites in the same PR.  
- **[Trade-off] Leaving `AdminFormSelect` multiple mode** → Slight dead code until step 03; prefer updating stories to the new control when cheap.  
- **[Trade-off] Client geocode vs stored partner coords** → Extra network hop on partner change; acceptable for MVP admin UX.

## Migration Plan

1. Extract shared checkbox multi-select → wire onboarding unchanged → swap admin languages/age groups/weekdays → extend PartnerOption → partner onChange + geo updates → lint/typecheck.  
2. No DB, env, or deploy migration.  
3. Rollback: revert touched web app files; no data migration.

## Open Questions

- None blocking implementers. If Nominatim fails in practice, fall back to address-only prefill and record for step 03 (already decided in parent guide).
