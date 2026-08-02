## Context

Parent feature: UX polish (`.dev-plan/current-iteration/ux-polish-parent-guide.md`), step 04 — event subtitles checkbox + single language.

Current state:

- **Schema:** `events` has spoken-language fields `language_independent` (bool) + `languages` (text array); no subtitle columns.
- **Domain:** `createEvent` / `updateEvent` / `cloneEvent` in `@unveiled/db` resolve spoken languages via `resolveEventLanguages`; clone copies `languageIndependent` + `languages` but has nowhere to copy subtitle metadata.
- **Allowlist:** `EVENT_LANGUAGES` (= `PREFERRED_LANGUAGES`) in `@unveiled/auth` — reuse for subtitle language codes.
- **Admin:** `EventAdminBaseFields` already uses `NativePreferenceOption` checkbox for language-independent and `AdminFormSelect` (native `<select>` + `.admin-native-select`) for single-value enums; parsers live in `admin-event-form.ts`.
- **Public:** `EventDetailPage` DETAILS `MetaCell` rows for accessibility / languages / age / type / zip — no subtitles row.

Constraints: domain validation in `@unveiled/db`; native-first forms (AGENTS §14); SSR POST; HeroUI chrome only (no HeroUI Select/Switch/Checkbox for these fields); proximity-only e2e; independently mergeable vs other ux-polish steps; no feed filters or caption uploads.

## Goals / Non-Goals

**Goals:**

- Persist `has_subtitles` (NOT NULL, default false) and nullable `subtitle_language` (allowlisted code or null).
- Enforce invariant: when `has_subtitles` is true → `subtitle_language` required and in `EVENT_LANGUAGES`; when false → `subtitle_language` MUST be null (coerce on write).
- Keep subtitle fields independent of spoken languages / `language_independent` (any combination allowed).
- Clone (and optional demo seed) copies the subtitle pair.
- Admin UI: Subtitles checkbox; when checked, required language select from the same allowlist options as spoken languages.
- Public detail: show subtitles row only when `has_subtitles` is true (availability + language label); omit when false.
- Align product docs, Gherkin, coverage matrix, Playwright; mark step done in parent guide.

**Non-Goals:**

- Multi-select subtitle languages; caption/subtitle file upload or R2 assets.
- Discover/feed filters or EventCard badges for subtitles.
- Changing spoken-language / language-independent behavior.
- `ux-polish-05-featured-thumbnails`; partner portal; Phase 6+ booking changes.

## Decisions

1. **Two columns with write-time coercion (not a DB CHECK alone)**
   - **Choice:** `has_subtitles boolean NOT NULL DEFAULT false`; `subtitle_language text NULL`. Catalog create/update validate/coerce: off → force `subtitle_language = null` even if POST sends a value; on → require allowlisted code (normalize case to match existing language code convention used for `languages`). Reject unknown codes with `CatalogValidationError`.
   - **Rationale:** Mirrors `resolveEventLanguages` pattern; keeps invariant in domain, not only UI.
   - **Alternatives:** Single nullable language column meaning “has subtitles iff non-null” (rejected — parent brief names both fields); DB CHECK without domain coercion (rejected — UI/parser still need clear errors).

2. **Reuse `EVENT_LANGUAGES` for the single subtitle language**
   - **Choice:** Same allowlist and option labels as spoken-language multi-select; store one code string (e.g. `DE` / `EN`), not a free-text label.
   - **Rationale:** Step plan + parent non-goals; avoids a second catalog.
   - **Alternatives:** Separate subtitle-language list (rejected — unnecessary); free text (rejected — inconsistent with spoken languages).

3. **Independence from spoken languages / language-independent**
   - **Choice:** No cross-field validation between subtitle flags and `languages` / `language_independent`. Admin shows subtitle controls outside the language-independent hide/show branch (always visible near accessibility/language block).
   - **Rationale:** Brief: “independent of spoken languages”; exhibitions can still have written subtitles, and spoken DE can have EN subs.
   - **Alternatives:** Require spoken languages when subtitled (rejected — not in brief).

4. **Admin: `NativePreferenceOption` checkbox + `AdminFormSelect` for language**
   - **Choice:** Checkbox `has_subtitles` value `"on"` (same as language-independent). When checked, show required `AdminFormSelect` `subtitle_language` from language options (client island/state toggles visibility like language-independent). Parser: checkbox on → require non-empty allowlisted select; off → omit/null.
   - **Rationale:** Native-first; reuses existing admin primitives; AGENTS §14.
   - **Alternatives:** HeroUI Switch/Select (rejected — hard rule); always-visible select with empty option (weaker UX; checkbox matches brief).

5. **Public DETAILS: conditional MetaCell only**
   - **Choice:** When `has_subtitles`, render a MetaCell (label Subtitles / Untertitel) with value conveying availability + language (e.g. language code or localized language name consistent with how spoken languages are shown today — codes joined today, so prefer the same code display or shared label helper if one already exists for prefs). When false, render nothing (no “No subtitles” row).
   - **Rationale:** Spec delta: omit chrome when false; avoid clutter.
   - **Alternatives:** Always show Yes/No (rejected — brief says omit when false).

6. **Clone + optional seed**
   - **Choice:** `cloneEvent` copies `hasSubtitles` + `subtitleLanguage` into `createInput`. Optional: one demo seed event with subtitles on for manual/staging smoke.
   - **Rationale:** Clone must not drop admin-authored metadata; seed is optional per step plan.
   - **Alternatives:** Reset subtitles on clone (rejected — inconsistent with languages/barrier-free copy behavior).

7. **Docs + e2e in the same change**
   - **Choice:** Update `schema-overview.md`, `admin-events.feature`, `event-discovery.feature`, coverage matrix, Playwright proximity scenarios (or named deferral). Ship `docs/product/` with behavior; OpenSpec deltas archive with the change.
   - **Rationale:** Parent release criteria; AGENTS product SoT is `docs/product/`.

## Risks / Trade-offs

- **[Risk] Parser/UI drift leaves orphan `subtitle_language` when checkbox unchecked** → Mitigation: domain coerce-to-null on every write, not only UI hide.
- **[Risk] Case mismatch (`de` vs `DE`) fails allowlist** → Mitigation: normalize to the same casing used for spoken `languages` persistence before allowlist check; unit-test both.
- **[Risk] Implementer couples subtitle select visibility to language-independent** → Mitigation: design + admin-events scenario: controls remain available when language-independent is checked.
- **[Trade-off] Public shows language code if spoken languages already use codes** → Acceptable consistency; do not invent a new i18n language-name table in this step unless a shared helper already exists.
- **[Trade-off] No feed filter** → Members only learn about subtitles on detail; deferred by parent non-goals.

## Migration Plan

1. Add Drizzle columns + generate/apply migration (`has_subtitles` default false; `subtitle_language` null for existing rows).
2. Domain create/update/clone + unit tests; wire admin parsers/UI/copy/stories; public detail MetaCell.
3. Update product docs, Gherkin, coverage matrix, Playwright; optional seed.
4. Run lint, typecheck, catalog unit tests, touched e2e.
5. Mark `ux-polish-04-event-subtitles` done in `ux-polish-parent-guide.md`.
6. Rollback: revert PR + reverse migration (columns unused by booking; safe drop if needed).

## Open Questions

- None blocking. Exact DE/EN label strings (Subtitles / Untertitel vs “With subtitles”) are apply-time copy choices as long as public omits the row when off and admin labels are clear.
