## Context

Parent feature: event category/type taxonomy (`.dev-plan/current-iteration/04-event-taxonomy-parent-guide.md`), step 01 — constants, write validation, and data migration only. See proposal.md for motivation.

Current state:

- `events.category` / `events.event_type` are unconstrained `text` (`packages/db/src/schema/events.ts`). `createEvent` / `updateEvent` only `requireNonEmpty`.
- Admin options: `getEventCategoryOptions` maps `INTERESTS`; `getEventTypeOptions` maps `EVENT_TYPES` from `@unveiled/auth/constants` (`Performance`, `Concert`, …).
- Member onboarding/profile chips use `INTERESTS` via `getInterestLabel` — must stay as-is.
- `@unveiled/auth` already depends on `@unveiled/db`; db must not depend on auth (same reason `EVENT_LANGUAGE_CODES` lives in db).
- Latest Drizzle file is `0027_lovely_prism.sql` (event copy locale backfill). This step is data-only; columns stay `text`.
- Tests/seeds/stories commonly insert `Theater` / `Performance` / `Music` / `music` / `Art` / `Film`.

Constraints: business logic in packages, not routes; keys locale-invariant snake_case; labels display-only; do not invent keys beyond the parent tables; do not change `INTERESTS`.

## Goals / Non-Goals

**Goals:**

- Single catalog-owned module: 27 category keys, 32 type keys, DE/EN labels, legacy→new maps, validators.
- Writes reject unknown keys with `INVALID_EVENT_CATEGORY` / `INVALID_EVENT_TYPE`.
- SQL backfill using the locked parent map; fail if any distinct unmapped value remains; already-allowlisted keys stay as-is (idempotent).
- Admin/feed option helpers emit new keys + labels in parent-table order so POST stays valid.
- Unit tests for allowlists, labels, mapping, and validation. `INTERESTS` still `Theater`…`Other`.
- In-repo `createEvent` callers (integration tests, demo seed, pagination seed) use new keys.

**Non-Goals:**

- Card/detail eyebrow labels, `?category=Theater` feed alias, story visual polish (step 02).
- Abundo `CATEGORY_EVENT_TYPE`, Gherkin/Playwright, schema-overview “free-form” wording (step 03).
- Dual-accept old+new keys on writes.
- Postgres CHECK / enum / lookup table; partner venue-type entity; changing onboarding copy.
- New AGENTS.md convention.

## Decisions

1. **Own taxonomy in `@unveiled/db`, not `@unveiled/auth`**
   - **Choice:** New `packages/db/src/catalog/event-taxonomy.ts`, re-exported from `packages/db/src/catalog/index.ts` (safe: no WASM / `node:fs`). Delete `EVENT_TYPES` / `EventType` from `packages/auth/src/constants.ts` and the auth barrel. Web imports allowlists/labels from `@unveiled/db`. Keep `INTERESTS` in auth.
   - **Rationale:** Catalog validation must not depend on auth. Step plan prefers db when languages already split this way (`EVENT_LANGUAGE_CODES`). One source; web re-exports via helpers, not a second copy.
   - **Alternatives:** Keep lists in auth and import from db (cycle). Duplicate lists in both packages (drift). Leave old `EVENT_TYPES` in auth alongside new keys (two `EVENT_TYPES`).

2. **Constants, labels, maps, and validators in one module**
   - **Choice:** Export:

     | Export | Role |
     |---|---|
     | `EVENT_CATEGORIES` | 27 keys, parent table order |
     | `EVENT_TYPES` | 32 keys, parent table order |
     | `EVENT_CATEGORY_LABELS` / `EVENT_TYPE_LABELS` | `Record<"de" \| "en", Record<Key, string>>` verbatim from parent DE/EN columns |
     | `getEventCategoryLabel(locale, key)` / `getEventTypeLabel(locale, key)` | label or raw key if unknown (read-safe) |
     | `LEGACY_EVENT_CATEGORY_MAP` / `LEGACY_EVENT_TYPE_MAP` | exact parent old→new pairs (case-sensitive keys; include `Music` and `music`) |
     | `mapLegacyEventCategory` / `mapLegacyEventType` | map or `undefined` |
     | `assertEventCategory` / `assertEventType` | trim; empty → `REQUIRED_FIELD`; unknown → `INVALID_EVENT_*` |

     Do not lowercase incoming writes. New keys are snake_case; unknown mixed-case strings must fail, not silently coerce.
   - **Rationale:** Step plan names the label helpers and a pure mapping function used by tests. Unknown-label fallback keeps unmigrated read paths from throwing; writes still reject.
   - **Alternatives:** Labels only in `admin-content.ts` (duplicates; feed/cards in step 02 would re-copy). Lowercase-normalize writes (would hide typos and collide with fixture `music` vs future keys).

3. **Validate on create and update after non-empty trim; clone goes through create**
   - **Choice:** Replace `requireNonEmpty(input.category, "category")` (and type) in `insertEventRow` / `updateEvent` with `assertEventCategory` / `assertEventType`. Update still only validates when the field is present in input; omitted fields keep `existing.*` (already migrated in production). Empty string remains `REQUIRED_FIELD`.
   - **Rationale:** Clone copies source keys into `CreateEventInput`, so create validation covers clone. Comp tickets / booking do not write category.
   - **Alternatives:** Dual-accept legacy keys until step 02 (step plan chose switch option helpers instead). Validate only in the web parser (seeds/tests would bypass).

4. **Hand-written data migration after `0027_`; no schema generate**
   - **Choice:** Add `packages/db/drizzle/0028_event_taxonomy.sql` and a `_journal.json` entry. Do **not** run `db:generate` (no column change). SQL:

     1. `UPDATE "events" SET "category" = CASE "category" … END` for every `LEGACY_EVENT_CATEGORY_MAP` pair; `ELSE "category"`.
     2. Same for `"event_type"`.
     3. `DO $$ … RAISE EXCEPTION` if any remaining distinct `category` not in `EVENT_CATEGORIES`, listing the values; same for `event_type`.

     Comment at top: keep CASE arms in sync with `event-taxonomy.ts`. Unit tests are the contract for the TS map; SQL is the locked table transcribed once.
   - **Rationale:** Fail-loud is a parent lock. Idempotent: already-new keys hit `ELSE` and pass the allowlist check. Fixture spellings are explicit WHEN arms, not a blanket lower().
   - **Alternatives:** Runtime TS migrator (not how this repo migrates). CHECK constraint (out of scope; catalog is the only writer). `db:generate` empty file (noise).

5. **Switch option helpers this step (choice a)**
   - **Choice:** `getEventCategoryOptions` / `getEventTypeOptions` map `EVENT_CATEGORIES` / `EVENT_TYPES` with `getEventCategoryLabel` / `getEventTypeLabel`. Drop `INTERESTS` and auth `EVENT_TYPES` from `admin-content.ts`. Delete local `eventTypeLabels`. Option `id` = key; `label` = locale string; order = constant order (not alpha, not INTERESTS order). `getInterestLabel` / onboarding chips stay on `INTERESTS`.
   - **Rationale:** If options still posted `Theater` after writes reject it, admin create/edit would 400. Helpers are two functions. Visual card/filter polish can wait; selects already show the new labels.
   - **Alternatives:** Dual-accept until step 02 (more domain complexity). Leave options on INTERESTS (forms unsubmittable).

6. **Admin error mapping; wizard step 1 already correct**
   - **Choice:** Add `INVALID_EVENT_CATEGORY` / `INVALID_EVENT_TYPE` to `CatalogErrorCode`. Wire `catalogErrorMessages` to existing `fieldErrors.category` / `eventType`. `eventFormErrorStep` already returns 1 for unknown catalog codes — no wizard change required. Optional: add explicit cases in `mapCatalogErrorCode` matching `INVALID_SUBTITLE_LANGUAGE`.
   - **Rationale:** Operators must see a field error, not the generic fallback, when an old draft posts `Music`.
   - **Alternatives:** New copy strings (unnecessary; field errors already exist).

7. **Fixtures that write events use new keys; parser tests may keep arbitrary strings**
   - **Choice:** Update every `createEvent` / `updateEvent` / row insert of `category`/`eventType` in `packages/db` tests, `packages/db/src/catalog/seed.ts`, `seed-pagination-data.ts`, and admin stories whose `<select>` value must match options (`music` → `live_music_venue`, etc.). Canonical pair for generic fixtures: `theater` / `theater_play`. Discovery tests that filter by category MUST filter by the stored new key (no `Theater` alias until step 02). Leave `admin-event-form.test.ts` posted strings alone unless they call catalog write. Leave GDPR `last_filter: { category: "Theater" }` (profile snapshot, not `events.category`). Leave `scripts/fetch-abundo-seed.ts` for step 03.
   - **Rationale:** Step plan: code fixtures must use new keys or validation fails. Demo seed goes through `createEvent`, so leaving `Theater` would break `seed:demo` on this merge. Abundo is an external map called out for step 03.
   - **Alternatives:** Dual-accept only in seed (hidden backdoor). Defer seed to step 03 (demo seed red between 01 and 03).

8. **Tests: unit file required; INTERESTS regression in existing onboarding test**
   - **Choice:** `packages/db/src/catalog/event-taxonomy.unit.test.ts`:
     - lengths 27 / 32; no `Other`; keys snake_case; both locales have a non-empty label for every key
     - `getEventCategoryLabel("de", "cinema") === "Kino"`; `"en"` → `"Cinema"`
     - `getEventTypeLabel("en", "theater_play")` matches parent EN
     - every parent legacy pair maps; `mapLegacyEventCategory("Music")` / `"music"` → `live_music_venue`; unknown → `undefined`
     - `assertEventCategory("Music")` throws `INVALID_EVENT_CATEGORY`; `"theater"` returns `"theater"`; `""` throws `REQUIRED_FIELD`
     - `assertEventType("Performance")` throws `INVALID_EVENT_TYPE`
   - Keep `onboarding-content.test.ts` INTERESTS assertions (`Kino` → Cinema, `Other` present). Do not require a SQL migration test harness.
   - **Rationale:** Step verification names mapping + validation + INTERESTS grep/test.
   - **Alternatives:** Fold mapping tests into catalog integration (needs DB; still update those fixtures).

## Risks / Trade-offs

- **[Risk] SQL CASE drifts from `LEGACY_*_MAP`** → Mitigation: same locked table; unit tests own the TS map; SQL comment points at the module; implementer copies WHEN arms from the test’s expected pairs.
- **[Risk] Production has an unmapped distinct value** → Mitigation: migration raises with the values; extend the map only with a product decision, do not invent keys. Staging migrate before prod.
- **[Risk] Deploy workers before migrate, then old rows + new validation** → Mitigation: `bun run build` already runs `db:migrate` first. Updates that omit category keep existing strings until migrate; new creates use new keys.
- **[Risk] `seed:demo` / Abundo between 01 and 03** → Mitigation: this step remaps demo/pagination `createEvent` inputs. Abundo still emits old types until step 03 — do not run `fetch-abundo-seed` against a post-01 catalog.
- **[Trade-off] EventCard still shows raw keys (`theater`)** → Accepted until step 02. Options already show labels.
- **[Trade-off] Member `?category=Theater` URLs match nothing until step 02 alias** → Accepted; parent documents a one-release alias in 02.
- **[Trade-off] No DB CHECK** → Catalog is the only writer; migration + domain are the guards.

## Migration Plan

1. Add `event-taxonomy.ts`; export from catalog barrel; add error codes.
2. Wire `assertEventCategory` / `assertEventType` into create/update.
3. Hand-write `0028_event_taxonomy.sql` + journal entry (CASE maps + RAISE).
4. Remove auth `EVENT_TYPES`; switch option helpers; map catalog errors.
5. Update `createEvent` fixtures/seeds/stories that must match options.
6. Add `event-taxonomy.unit.test.ts`; confirm INTERESTS tests still pass.
7. `bun run lint` and `bun run typecheck`.
8. Rollback: restore previous category/type strings only from backup (lossy if new keys were already written). Safe to drop `0028` only before it has been applied in an environment that serves new-key writes.

## Open Questions

- None blocking. Exact demo-seed replacement keys (`Konzert` → `live_music_venue`, `Concert` → `concert`) follow the parent map; implementer MUST NOT pick different “closest” keys.
