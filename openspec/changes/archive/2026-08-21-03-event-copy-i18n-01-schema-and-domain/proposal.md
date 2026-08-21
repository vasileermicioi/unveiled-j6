## Why

`events.title` and `events.description` are single strings used on cards, detail, SEO, emails, and admin search, but the product needs DE and EN copy. Step 02 of parent `03-event-copy-i18n` cannot land two-editor UI or locale-resolved public surfaces until four locale columns exist, writes keep canonical `title` / `description` in sync (DE-first), and catalog search/clone understand both locales.

## What Changes

- Add `events.title_de`, `title_en`, `description_de`, `description_en` (`text not null` after backfill). Keep canonical `title` / `description` as denormalized write-time copies of the German fields.
- Migration: copy each existing `title` into both title locale columns and each existing `description` into both description locale columns, then `SET NOT NULL`. Next Drizzle number after `0026_`.
- Export `resolveEventCopy(event, locale)` from `@unveiled/db`: requested locale → other locale → canonical. Domain tests cover fallback even though writes require both locales.
- Extend `createEvent` / `updateEvent` to require non-empty trimmed titles and non-empty descriptions for **both** locales; set `title = titleDe.trim()`, `description = descriptionDe` on every write.
- Title substring search (admin `title=`, member feed `title=`, and the same ILIKE helpers used by featured-add `q` / sales export): `OR` ilike on `title_de` and `title_en`.
- `cloneEvent` copies all four locale columns plus canonical.
- Temporary shim: if callers still pass a single `title` / `description` (admin form, seed, tests), domain copies that string into both locales so the app stays green. Remove the shim in step 02.
- Out of scope: admin two-editor UI, SEO/EventCard locale wiring, Gherkin/Playwright (steps 02–03).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Events SHALL store `title_de`, `title_en`, `description_de`, and `description_en` (non-null text). Catalog create/update SHALL require non-empty trimmed titles and non-empty descriptions for both locales. Canonical `title` and `description` SHALL be denormalized on write from the German fields. A migration SHALL copy each existing `title` / `description` into both locale columns. `cloneEvent` SHALL copy all four locale columns. Title substring search SHALL match `title_de` or `title_en` (case-insensitive). `@unveiled/db` SHALL export `resolveEventCopy` (requested locale → other locale → canonical).

## Impact

- **DB:** `packages/db/src/schema/events.ts`; new migration after `0026_` (generated then hand-edited for backfill + `NOT NULL`). Optional column note in `docs/product/database/schema-overview.md`; full Gherkin / public copy wait for steps 02–03.
- **Domain:** `packages/db/src/catalog/event-copy.ts` (`resolveEventCopy` + write coerce); `CreateEventInput` / `UpdateEventInput` / `insertEventRow` / `updateEvent` / `cloneEvent`; `eventTitleCondition` and member-feed / sales-export / featured-add title ILIKE; unit tests; clone integration when `DATABASE_URL` is set.
- **Compile-green web:** keep posting `title` / `description`; domain shim duplicates into both locales. Do not add DE/EN form fields this step.
- **Read callers unchanged:** waitlist, emails, ICS, booking ledger, EventCard still read canonical `title` / `description` until step 02.
- **Source brief:** `.dev-plan/current-iteration/03-event-copy-i18n-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/03-event-copy-i18n-parent-guide.md`
- **Consumed by:** `03-event-copy-i18n-02-admin-and-public-ui`
- **Verification:** `bun run lint`; `bun run typecheck`; `cd packages/db && bun test src/catalog/event-copy.unit.test.ts`; clone integration when `DATABASE_URL` is set
