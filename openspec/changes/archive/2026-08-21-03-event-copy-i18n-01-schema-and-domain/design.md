## Context

Parent feature: event title/description DE+EN (`.dev-plan/current-iteration/03-event-copy-i18n-parent-guide.md`), step 01 — schema + catalog domain only. See proposal.md for motivation.

Current state:

- `events.title` and `events.description` are `text not null` (`packages/db/src/schema/events.ts`). Description is Markdown at rest.
- `CreateEventInput` / `UpdateEventInput` take `title` / `description`; `insertEventRow` / `updateEvent` persist via `requireNonEmpty` (`REQUIRED_FIELD`).
- `cloneEvent` copies `source.title` / `source.description` into `CreateEventInput`.
- Title substring search is `ilike(events.title, …)` in `eventTitleCondition` (admin list `title=`), `eventSearchCondition` (featured-add `q`), `memberFeedConditions` (`packages/db/src/catalog/discovery.ts`), and sales-export title filter.
- Admin form still posts `title` / `description` (`parseEventFormBody`). Public/member UI, SEO, emails, ICS, and EventCard still read canonical `title` / `description` (step 02).
- Latest Drizzle file is `0026_event_subtitle_languages.sql` (series `01` merged).

Constraints: business logic in `@unveiled/db`; `public` schema only; `bun run db:generate` then review SQL; do not model `neon_auth`; no two-editor admin UI / Playwright / EventCard locale this step.

## Goals / Non-Goals

**Goals:**

- Persist four locale columns, all `text not null` after backfill. Keep canonical `title` / `description`.
- Shared write coerce: both locales required (trimmed title; description non-empty, Markdown allowed); canonical = German.
- Export `resolveEventCopy(event, locale)` with requested → other → canonical fallback.
- Thread locale columns through create / update / clone; OR title search on `title_de` and `title_en`.
- Keep the build green: shim single `title` / `description` into both locales. Seed, tests, and the unchanged form keep compiling.
- Unit tests in `packages/db/src/catalog/event-copy.unit.test.ts`; clone integration when `DATABASE_URL` is set.

**Non-Goals:**

- Admin DE/EN fields, POST names `title_de` / `title_en` / `description_*` (step 02 removes the shim).
- Public detail / EventCard / SEO / booking chrome locale resolution (step 02). Emails/ICS keep canonical `title`.
- Gherkin, Playwright, seed bilingual fixtures (step 03).
- Translating partner name, address, category/type, secret codes, or image credits.
- Changing the Markdown/MDX pipeline.
- New AGENTS.md convention.

## Decisions

1. **Keep canonical `title` / `description`; add four locale columns (all NOT NULL after backfill)**
   - **Choice:** Drizzle `titleDe`, `titleEn`, `descriptionDe`, `descriptionEn` as `text(…).notNull()` next to existing `title` / `description`. Do **not** drop canonical columns.
   - **Rationale:** Parent risk: emails, ICS, waitlist, Stripe-adjacent copy, and admin tables still need a single string. Write-time DE-first denormalization matches “DE wins when both present.”
   - **Alternatives:** Drop canonical and teach every reader `resolveEventCopy` this step (out of scope; waitlist/email are step 02 at most). Nullable locale columns (fights “both required after backfill”).

2. **Migration: add nullable → backfill both locales from canonical → SET NOT NULL (next file after `0026_`)**
   - **Choice:** `bun run db:generate`, then hand-edit so SQL is:
     1. `ALTER TABLE "events" ADD COLUMN "title_de" text;` (same for `title_en`, `description_de`, `description_en`)
     2. `UPDATE "events" SET "title_de" = "title", "title_en" = "title", "description_de" = "description", "description_en" = "description";`
     3. `ALTER TABLE … ALTER COLUMN … SET NOT NULL` for all four
   - Snapshot/`meta/_journal.json` stay in sync with the generated name; only SQL body is edited. Generated `ADD COLUMN … NOT NULL` without a default would fail on existing rows.
   - **Rationale:** Step plan lock. Existing events keep working with identical DE and EN copy until an admin edits both in step 02.
   - **Alternatives:** `NOT NULL DEFAULT ''` then update (briefly allows empty, extra step). Dual-read period without new columns (no persist path for EN).

3. **`event-copy.ts`: write coerce + read fallback in one module**
   - **Choice:** New `packages/db/src/catalog/event-copy.ts`, re-exported from `packages/db/src/catalog/index.ts` (safe: no WASM / `node:fs`).

     Write (`resolveEventCopyFields`):

     | Input | Result |
     |---|---|
     | Any of `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` defined | Require all four non-empty after trim; `REQUIRED_FIELD` on the empty field |
     | None of the locale fields defined | Require legacy `title` and `description`; copy each into both locales |
     | Success | `title = titleDe`, `description = descriptionDe` (trimmed); locale strings stored trimmed |

     Description emptiness is trim-only; Markdown content is otherwise unchanged.

     Read (`resolveEventCopy(event, locale)` with `locale: "de" | "en"`):

     1. If requested locale **title** is non-empty after trim → that locale’s title + description (description may be `""` in fallback tests).
     2. Else if the other locale title is non-empty → that pair.
     3. Else canonical `title` / `description`.

     A locale is selected by **title**, not description, so a missing translation falls back as a pair.
   - **Rationale:** Step plan names `resolveEventCopy` and DE-first canonical. Writes require both; read fallback is for tests and any pre-backfill row shape during rollout.
   - **Alternatives:** Locale-only create inputs with parser-only shim (seed/tests would all need updating this step). Fall back per-field (mixed-language body; rejected). New error code `INVALID_EVENT_COPY` (unnecessary; `REQUIRED_FIELD` already maps to wizard step 1).

4. **Catalog inputs gain locale fields; legacy `title` / `description` stay for the shim**
   - **Choice:** Add optional `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` on `CreateEventInput` / `UpdateEventInput`. Keep `title` / `description`. `insertEventRow` / update SET persist the resolved six strings (`title`, `description`, four locale columns).
   - Update merge: if any locale field is `!== undefined`, merge with `existing.*` for omitted locale keys, then run `resolveEventCopyFields` (no legacy shim). If no locale field is passed, use legacy `title` / `description` when provided (shim overwrites both locales); otherwise keep existing six columns.
   - Seed, catalog tests, and `toCreateEventInput` keep passing `title` / `description` this step.
   - **Rationale:** Step plan: extend inputs **and** shim so the app stays green. Locale-only types would force every `createEvent({ title, description })` caller to change now.
   - **Alternatives:** Parser wrap only (clone/tests that talk to domain would still need a shim). Require locale fields immediately (large fixture churn, not needed until step 02).

5. **`cloneEvent` copies locale columns, not only canonical**
   - **Choice:** Pass `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` from `source` into `CreateEventInput` so the locale path runs and divergent DE/EN survive. Also pass canonical `title` / `description` as unused fallbacks.
   - **Rationale:** Cloning via the shim would collapse both locales to German. Parent release criterion: both locales are real data.
   - **Alternatives:** Clone canonical only (wrong once step 02 authors EN). Raw `db.insert` of source columns (bypasses create validation).

6. **Title search ORs `title_de` and `title_en`; sort stays on canonical `title`**
   - **Choice:** Shared helper (in `event-copy.ts` or next to `eventTitleCondition`) returns `or(ilike(events.titleDe, pattern), ilike(events.titleEn, pattern))`. Wire it into:
     - `eventTitleCondition` (admin `title=`)
     - `eventSearchCondition` (featured-add `q` title half)
     - `memberFeedConditions` in `discovery.ts`
     - sales-export title filter
   - Do **not** change ILIKE escaping this step (discovery already escapes; admin title filter does not). Canonical `title` MAY remain in the OR (redundant after backfill) — prefer **omit** it so search is locale-true.
   - Admin Title column sort keeps `events.title` (DE-first list).
   - **Rationale:** Step plan names admin + member `title=`. Featured-add and sales-export use the same “search event title” meaning; leaving them on canonical would miss EN-only matches.
   - **Alternatives:** Search canonical only until step 02 (fails parent release criterion if 01 ships alone). Also OR `events.title` (harmless redundancy).

7. **Temporary domain shim; parser still posts `title` / `description`**
   - **Choice:** Do not change `parseEventFormBody` field names. Do not add `title_de` inputs to `EventAdminBaseFields`. Domain coerce is the shim. Step 02 removes it when the form posts locale names and `toCreateEventInput` passes `titleDe` / …
   - Compile-fix only if Drizzle `Event` requires the new fields in object literals (tests/fixtures that construct rows, not just `createEvent` input).
   - Waitlist, email, ICS, EventCard, SEO keep reading `event.title`.
   - **Rationale:** Same “build stays green” pattern as subtitle-languages step 01 (`subtitle_language` wrap). Parser wrap is optional here because the POST names are unchanged.
   - **Alternatives:** Parser duplicates into `titleDe`/`titleEn` and drop `title` from create input (more web churn this step).

8. **Tests: unit helper required; clone integration when DB is available**
   - **Choice:**
     - `packages/db/src/catalog/event-copy.unit.test.ts` — DE-first canonical; empty/whitespace `titleEn` or `descriptionEn` throws `REQUIRED_FIELD`; shim copies single `title`/`description` to both locales; `resolveEventCopy` prefers requested locale, then other, then canonical; title-search helper matches EN-only and DE-only substrings (case-insensitive).
     - `clone-event.integration.test.ts` — create with divergent `titleDe`/`titleEn` (and descriptions); expect clone equal. Skip when `DATABASE_URL` unset.
   - Do not require a SQL migration test harness.
   - **Rationale:** Step verification names the unit file; clone is optional-with-reason.
   - **Alternatives:** Fold search OR only into `discovery.integration.test.ts` (needs DB; still do that if easy, but unit helper is the required check).

9. **Schema-overview column rows now; Gherkin stays single-field**
   - **Choice:** Update `docs/product/database/schema-overview.md` to list the four locale columns and note canonical `title` / `description` are DE denormalized copies. Do **not** edit `admin-events.feature` / `event-discovery.feature`. Mark step 01 done in the parent guide at handoff.
   - **Rationale:** Schema SoT would be wrong if this PR lands alone. Canonical Gherkin is step 03. Step plan allows documenting columns now and UI in 02.

## Risks / Trade-offs

- **[Risk] Generated migration adds NOT NULL columns without backfill** → Mitigation: always hand-edit; review SQL before applying; never commit ADD NOT NULL on populated `events` without UPDATE.
- **[Risk] Clone uses the shim and duplicates German into EN** → Mitigation: clone passes the four locale fields from source in the same PR as schema.
- **[Risk] Title search still ILIKEs only `events.title`** → Mitigation: one helper used by admin list, member feed, featured-add `q`, and sales-export; typecheck fails if a leftover `ilike(events.title)` is missed only if we grep — add a tasks.md grep/check.
- **[Trade-off] Public UI still shows German canonical copy** → Accepted until step 02. Domain can already store and resolve EN.
- **[Trade-off] Parser still understands only `title` / `description`** → Accepted; step 02 removes the shim when two editors post locale fields.
- **[Trade-off] No DB CHECK that locale strings are non-empty** → Catalog is the only writer; `NOT NULL` still allows `''` until domain rejects.

## Migration Plan

1. Add Drizzle columns `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn`; comment that canonical `title` / `description` are DE write-time copies.
2. `bun run db:generate`; hand-edit: ADD four nullable text columns, UPDATE from `title`/`description`, SET NOT NULL. Next number after `0026_`.
3. Add `event-copy.ts`; wire create/update/clone; switch title ILIKE helpers; export from catalog barrel.
4. Leave `parseEventFormBody` on `title`/`description`; compile-fix row literals if needed.
5. Add `event-copy.unit.test.ts`; extend clone integration when `DATABASE_URL` is set.
6. Schema-overview column rows; mark step 01 done in the parent guide.
7. `bun run typecheck` and `bun run lint`.
8. Rollback: drop the four locale columns (canonical `title`/`description` unchanged). Only safe before step 02 depends on divergent EN copy.

## Open Questions

- None blocking. Whether the title-search helper lives in `event-copy.ts` vs `events.ts` is an implementation detail; unit tests cover the OR semantics either way.
