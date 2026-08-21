## 1. Setup

- [x] 1.1 Read step plan + parent guide; confirm artifacts (`packages/db/src/schema/events.ts`, `CreateEventInput` / `UpdateEventInput` / `eventTitleCondition` / `cloneEvent` in `packages/db/src/catalog/events.ts`, `packages/db/src/catalog/discovery.ts` title ILIKE, `packages/db/src/catalog/seed.ts`, waitlist/email callers that read `event.title`)
- [x] 1.2 Confirm latest drizzle file is `0026_`; lock write semantics: both locales required (trimmed title; non-empty description); canonical `title` / `description` = German; legacy single `title`/`description` shims into both locales

## 2. Schema & migration

- [x] 2.1 Add Drizzle `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` as `text(…).notNull()`; comment that canonical `title` / `description` remain DE write-time copies
- [x] 2.2 Run `bun run db:generate`; hand-edit the new file (next after `0026_`): ADD four nullable text columns; `UPDATE` both title locales from `title` and both description locales from `description`; `SET NOT NULL` on all four; do not commit ADD NOT NULL without backfill

## 3. Catalog domain

- [x] 3.1 Add `packages/db/src/catalog/event-copy.ts` and export it from `packages/db/src/catalog/index.ts`: `resolveEventCopyFields` (locale path vs legacy shim; canonical = DE; `REQUIRED_FIELD` on empty); `resolveEventCopy(event, "de" | "en")` (requested locale title → other locale → canonical)
- [x] 3.2 Add optional `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` on `CreateEventInput` / `UpdateEventInput`; persist the resolved six strings on create/update; keep legacy `title` / `description` for the shim
- [x] 3.3 `cloneEvent` passes source locale columns into `CreateEventInput` (do not clone via the single-title shim)

## 4. Title search

- [x] 4.1 Replace `ilike(events.title, …)` title filters with `OR` ilike on `title_de` and `title_en` in `eventTitleCondition`, `eventSearchCondition`, `memberFeedConditions`, and sales-export; leave Title column sort on canonical `title`; grep `packages/` for leftover `ilike(events.title`

## 5. Compile-green callers

- [x] 5.1 Leave `parseEventFormBody` / `toCreateEventInput` posting `title` / `description` (domain shim); do not add DE/EN form fields or POST names
- [x] 5.2 Compile-fix TypeScript row/fixture literals that must include the new Drizzle fields; do not rewrite EventCard, SEO, emails, or waitlist to `resolveEventCopy`

## 6. Tests

- [x] 6.1 Add `packages/db/src/catalog/event-copy.unit.test.ts`: DE-first canonical; empty/whitespace `titleEn` or `descriptionEn` throws `REQUIRED_FIELD`; shim copies single `title`/`description` to both locales; `resolveEventCopy` prefers requested locale then other then canonical; title-search helper matches EN-only and DE-only substrings
- [x] 6.2 If `DATABASE_URL` is set, update `clone-event.integration.test.ts` to create/clone divergent `titleDe`/`titleEn` (and descriptions) and assert equality; otherwise skip with reason

## 7. Verification & handoff

- [x] 7.1 Run `bun run lint` — exits 0
- [x] 7.2 Run `bun run typecheck` — exits 0
- [x] 7.3 Run `cd packages/db && bun test src/catalog/event-copy.unit.test.ts` — exits 0
- [x] 7.4 Document `title_de` / `title_en` / `description_de` / `description_en` plus canonical DE copies in `docs/product/database/schema-overview.md`; mark step 01 done in `03-event-copy-i18n-parent-guide.md`; do not edit Gherkin, Playwright, or AGENTS.md
