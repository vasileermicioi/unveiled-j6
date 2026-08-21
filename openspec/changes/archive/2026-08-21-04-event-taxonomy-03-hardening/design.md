## Context

Parent feature: event category/type taxonomy (`.dev-plan/current-iteration/04-event-taxonomy-parent-guide.md`), step 03 of 03 — seed, docs, and e2e. See `proposal.md` for motivation. Canonical product behavior is `docs/product/`; OpenSpec `openspec/specs/` is a planning mirror only.

Runtime already matches parent release criteria for keys and labels (steps 01–02 done):

- `@unveiled/db` `event-taxonomy.ts`: `EVENT_CATEGORIES` / `EVENT_TYPES`, DE/EN labels, `mapLegacyEventCategory` / `mapLegacyEventType`.
- Writes reject unknown keys. SQL backfill remapped stored rows.
- Admin/feed `<select>`s emit keys + locale labels. Cards/detail paint labels. `parseEventFeedQuery` aliases INTERESTS `?category=` values.

What remains is the **verification and documentation layer**. `schema-overview.md` still says `category` / `event_type` are “Free-form strings today.” Abundo JSON and `fetch-abundo-seed.ts` still write `Theater` / `Performance` (seed-data maps at runtime). Playwright `Filter by category` still GETs `?category=Ausstellung`. Admin helpers still `selectOptionByLabel(…, "Performance")`, which is no longer a type label. Catalog/waitlist e2e fixtures still default `createEvent` to `Theater` / `Performance`, which domain validation rejects.

Constraints: Playwright titles match Gherkin `Scenario:` verbatim; proximity/layout selectors only (`docs/product/testing/bdd-and-e2e.md`); no `data-testid`; do not change `INTERESTS`; HeroUI/theme rules unchanged; locale fixture defaults to `de`.

## Goals / Non-Goals

**Goals:**

- Bind Gherkin, schema/gaps/i18n/UI-map, coverage matrix, Abundo/seed fixtures, and Playwright to the shipped taxonomy.
- Keep existing demo-title e2e (`TITLES.tonight`, `TITLES.ausstellung`, …) green by remapping keys under the same titles/roles.
- Close the parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- New domain/UI behavior, adding `Other`, partner venue-type entity, changing `INTERESTS`.
- Dropping the one-release `?category=Theater` alias (step 02).
- Playwright for every leftover INTERESTS alias (unit tests already cover the nine ids).
- Reclassifying Abundo genres onto “better” types than the locked leftover map (`Performance` → `theater_play`, `Other` → `special_event`).

## Decisions

1. **Docs-and-Gherkin first, then seed/Abundo, then Playwright helpers, then matrix, then close-out**
   - **Choice:** Update product docs + Gherkin → rewrite Abundo JSON + fetch maps → fix e2e option labels / create payloads → new/updated Playwright → coverage-matrix → parent close-out.
   - **Rationale:** E2E titles must match Gherkin verbatim; seed keys must exist before label-based filter tests; admin create tests fail until type labels change.
   - **Alternatives:** Rewrite JSON before docs (fine, but Gherkin titles then drift). Change Playwright before helpers (admin create still broken).

2. **Locked Gherkin / Playwright titles**
   - **Choice:** Product + Playwright use these titles verbatim:
     - `Filter by category` (**keep** — add the venue-label AND)
     - `Category filter lists venue types` (**add**)
   - Do not rename OpenSpec step-02 scenarios (`Legacy category query still filters`, …); those stay runtime/unit-tested.
   - **Rationale:** Step Spec Delta keeps `Filter by category` and asks for a venue-types scenario. Verbatim titles are the BDD contract.
   - **Alternatives:** Fold venue-types into Filter by category only (allowed by the delta AND, but the step plan also asks for a dedicated scenario). Skip the new scenario (fails the brief).

3. **Filter-by-category e2e selects Theater (upcoming demo row)**
   - **Choice:** In `e2e/specs/event-discovery.spec.ts` `Scenario: Filter by category`:
     1. `loginMember`; `goto /${locale}/events`. Date range is `berlinYmd(0)` → `berlinYmd(30)` so native date `min` (Berlin today) stays valid.
     2. `page.getByLabel(/kategorie|category/i)` (native `<select id="event-feed-category">`).
     3. `selectOption({ label: "Theater" })` — DE and EN taxonomy label for key `theater`.
     4. Submit Apply (`getByRole("button", { name: /anwenden|apply/i })`).
     5. Assert URL `category=theater`.
     6. Assert `TITLES.theaterFuture` visible; `TITLES.localeCopyDe` (upcoming live-music row) and `TITLES.ausstellung` count 0.
   - Skip when `!hasDatabaseUrl()` via `loginMember` (never “UI not built”).
   - **Rationale:** Demo `ausstellung` / `tonight` / `konzert` timestamps are baked at seed time and may already be past. Date inputs reject `from` before today. `theaterFuture` remains upcoming; Theater is a real taxonomy label. Venue-types scenario still covers Ausstellungshalle / Kino as option text.
   - **Alternatives:** Ausstellungshalle + `TITLES.ausstellung` (fails once that seed row is past). GET `?category=Ausstellung` (alias; fails “select by locale label”).

4. **Venue-types scenario asserts distinctive taxonomy labels and INTERESTS-only absences**
   - **Choice:** `Category filter lists venue types`: booking-eligible member, open `/events`, read the category `<select>` options.
     - **Present:** `Kino` or `Cinema` (same string per locale — `cinema` labels), plus `Ausstellungshalle` / `Exhibition hall`, plus `Oper / Opernhaus` / `Opera / opera house` (taxonomy-only).
     - **Absent (exact option text):** `Other`, `Talk/Lesung`, `Tanz/Performance`, `Ausstellung`, `Konzert`.
   - Do **not** treat `Theater` / `Kino` / `Museum` / `Comedy` as proof of INTERESTS — those strings also exist as taxonomy labels.
   - **Rationale:** Distinguishes the two lists. Matches the Spec Delta AND.
   - **Alternatives:** Snapshot all 27 options (brittle). Assert option `value`s via DOM (allowed for native select; still use `getByLabel` to find the control — do not add `data-testid`).

5. **Rewrite Abundo JSON to keys; keep `mapLegacy*` as a safety net**
   - **Choice:** Update every `category` / `eventType` in `abundo-berlin-demo.json` with the locked leftover maps:

     | Fixture category | Key | Fixture type | Key |
     |---|---|---|---|
     | `Theater` | `theater` | `Performance` | `theater_play` |
     | `Kino` | `cinema` | `Screening` | `film_screening` |
     | `Ausstellung` | `exhibition_hall` | `Other` | `special_event` |
     | `Konzert` | `live_music_venue` | `Concert` | `concert` |
     | `Comedy` | `comedy_club` | `Performance` | `theater_play` |
     | `Tanz/Performance` | `dance_venue` | `Performance` | `theater_play` |
     | `Talk/Lesung` | `literature_house` | `Talk` | `talk_lecture` |
     | `Museum` (if present) | `museum` | `Other` | `special_event` |

     `seed-data.ts` may still call `mapLegacyEventCategory` / `mapLegacyEventType` so an old fixture refresh cannot insert illegal strings. After rewrite, those helpers become no-ops on current JSON (`?? event.category` path). Do **not** invent better types (`comedy_evening`, `guided_tour`) — stay on the locked leftover map so seed behavior matches migrated production rows.
   - **Rationale:** Verification greps `eventType: "Performance"` in product seed. Runtime mapping alone leaves greppable leftovers.
   - **Alternatives:** Only change the fetch script and leave JSON (grep fails). Reclassify Comedy → `comedy_evening` (nicer, diverges from migrated `Performance` rows).

6. **Abundo fetch maps emit keys at the source**
   - **Choice:** `GENRE_TO_CATEGORY` values become taxonomy keys (`Theater`/`Theatre`/`Play` → `theater`, `Kino`/`Cinema`/`Film` → `cinema`, `Ausstellung`/`Exhibition` → `exhibition_hall`, `Museum` → `museum`, `Konzert`/`Concert`/`Jazz` → `live_music_venue`, `Comedy`/`Kabarett` → `comedy_club`, `Tanz`/`Dance`/`Performance` → `dance_venue`, `Talk`/`Lesung`/`Reading` → `literature_house`). `CATEGORY_EVENT_TYPE` keys match those new category keys:

     | Category key | Type key |
     |---|---|
     | `theater` | `theater_play` |
     | `cinema` | `film_screening` |
     | `museum` | `special_event` |
     | `exhibition_hall` | `special_event` |
     | `live_music_venue` | `concert` |
     | `literature_house` | `talk_lecture` |
     | `comedy_club` | `theater_play` |
     | `dance_venue` | `theater_play` |

     Fallback `CATEGORY_EVENT_TYPE[category] ?? "Other"` becomes `?? "special_event"`. Do not import `@unveiled/db` from the fetch script unless it already does — keep a local table that matches the parent maps.
   - **Rationale:** Next `bun scripts/fetch-abundo-seed.ts` must not reintroduce INTERESTS strings.
   - **Alternatives:** Map in `seed-data.ts` only (JSON stays dirty). Share `LEGACY_EVENT_*_MAP` from `@unveiled/db` (cleaner, but the fetch script is a Node CLI — only do it if the import is already easy).

7. **Admin / catalog e2e: labels for selects, keys for `createEvent`**
   - **Choice:**
     - `createEventViaUI` / `fillNewEventRequiredFields` / inline admin-events selects: keep default category option text `"Theater"` (DE=EN label for `theater`). Default type option text MUST be locale-aware: DE `Theateraufführung / Schauspiel`, EN `Theater performance / play` (or one regex covering both). Centralize on `adminLabels` if a shared helper exists.
     - `e2e/fixtures/catalog.ts` and `waitlist.ts` defaults: `category: "theater"`, `eventType: "theater_play"` (domain keys, not labels).
     - Leave `e2e/fixtures/onboarding.ts` `selectOption(page, "Theater")` — that is INTERESTS, in-scope to **not** change.
   - **Rationale:** Selects show labels; `createEvent` validates keys. `"Performance"` is neither.
   - **Alternatives:** Select by `option[value=theater_play]` (allowed on native select; brief prefers visible locale labels). Keep posting `Theater` (fails `INVALID_EVENT_CATEGORY`).

8. **List↔map URL assertions after rebuild use the new key**
   - **Choice:** Tests that `goto ?category=Theater` then click Map / Apply MUST expect `category=theater` in the rebuilt URL (step 02 parse rewrite). Direct address-bar `Theater` is only valid before the next GET rebuild. Reset-filters `title=Ausstellung` stays a **title** substring, not a category — do not confuse it with the category remap.
   - **Rationale:** Step 02 already rewrites parsed query; expecting `/category=Theater/` after a tab click is stale.
   - **Alternatives:** Keep asserting `Theater` (fails after Apply/map). Add a 302 canonicalizer (out of scope).

9. **Docs touch list**
   - **Choice:**
     - `schema-overview.md` row `category`, `event_type`: allowlisted keys; cite `EVENT_CATEGORIES` / `EVENT_TYPES` in `packages/db/src/catalog/event-taxonomy.ts`; labels DE/EN in code; not Postgres enums; `INTERESTS` is onboarding-only.
     - `gaps-and-decisions.md` Discovery row: event category/type taxonomy is independent of member `INTERESTS`; stored keys; locale labels in UI.
     - `content-i18n-inventory.md`: document `getEventCategoryOptions` / `getEventTypeOptions` / `getEventCategoryLabel` / `getEventTypeLabel` under admin-content (and feed copy `categoryLabel` Kategorie/Category). Explicitly **not** `getInterestLabel` / `INTERESTS`.
     - `ui-component-map.md`: EventCard category badge, detail eyebrow, DETAILS type, member feed/map category `<select>`, admin General category/type selects — taxonomy locale labels; option values are keys.
     - `pagination-and-search.md`: change the example `?category=Theater` to `?category=theater` (legacy INTERESTS still aliases for one release — mention in a footnote if the table is “canonical query”, not “legacy”).
     - `coverage-matrix.md`: `Filter by category` stays `pass`; add `Category filter lists venue types`.
   - **Rationale:** Step scope. Leaving “free-form strings today” is a greppable lie.
   - **Alternatives:** Only files named in the task bullets — still leaves pagination example stale.

10. **Web unit tests that still POST `Music` / `Concert`**
    - **Choice:** If they round-trip form fields into `createEvent` / catalog validation, switch to `live_music_venue` / `concert`. If they only assert “unknown category string is copied onto the DTO,” leave them (they are not product seed). `event-feed.test.ts` `category: "Theater"` stays — that is the alias test. GDPR `last_filter.category: "Theater"` is a stored intel snapshot — leave it.
    - **Rationale:** Verification grep is product seed; do not expand into rewriting historical filter JSON.
    - **Alternatives:** Mass-replace every `Music` in `apps/web` (noise; some tests document the alias).

11. **OpenSpec mirror vs product SoT**
    - **Choice:** This change’s `event-catalog` ADDED and `event-discovery` MODIFIED deltas are the planning contract. Apply updates `docs/product/` as SoT. Do not treat archived OpenSpec specs as behavioral SoT. After apply, mark the parent step done.
    - **Rationale:** AGENTS.md / step Cleanup.
    - **Alternatives:** Sync `openspec/specs/` only.

## Risks / Trade-offs

- **[Risk] `selectOption({ label: "Ausstellungshalle" })` fails because the native select’s accessible name is not the Label** → Mitigation: `getByLabel(/kategorie|category/i)` targets `id="event-feed-category"` + `<Label htmlFor>`; if that misses, `locator("#event-feed-category")` is still a native control (not `data-testid`). Confirm against `EventFeedFilters`.
- **[Risk] Admin type label punctuation (`Theateraufführung / Schauspiel` vs `Talk / lecture`)** → Mitigation: copy exact strings from `EVENT_TYPE_LABELS`; prefer regex `/theateraufführung|theater performance/i` if exact match flakes.
- **[Risk] Shared DB still has INTERESTS strings until reseed** → Mitigation: staging `bun run seed:demo` after merge; live rows were migrated in step 01. Tests skip only on missing `DATABASE_URL`.
- **[Risk] Next Abundo fetch reintroduces old strings** → Mitigation: rewrite `GENRE_TO_CATEGORY` / `CATEGORY_EVENT_TYPE` in the same PR; keep `mapLegacy*` in `seed-data.ts`.
- **[Risk] Map-view e2e still expects `category=Theater` after tab click** → Mitigation: decision 8; grep `category=Theater` in `e2e/` and update rebuilt-URL assertions.
- **[Trade-off] Comedy/Tanz fixtures keep `theater_play` rather than `comedy_evening` / `dance_performance`** → Matches migrated `Performance` rows; slightly wrong semantically; acceptable for hardening.
- **[Trade-off] Filter e2e uses Ausstellungshalle, not Kino** → Same seedRole as today; Kino remains asserted in the venue-types scenario.

## Migration Plan

1. Land docs + seed JSON/fetch + e2e together (no schema migration).
2. Reseed staging (`bun run seed:demo`) so fixture keys are stored even if a row somehow missed step 01.
3. No rollback beyond reverting the docs/e2e/seed commit; steps 01–02 UI/domain remain correct.
4. After merge: mark step 03 + parent guide done; archive this OpenSpec change when applying `/opsx:archive`.

## Open Questions

_(none blocking — labels and leftover maps are locked in the parent guide and `event-taxonomy.ts`.)_
