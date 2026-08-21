## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/04-event-taxonomy-03-hardening.md`, parent guide Release Criteria / non-goals, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step 02 artifacts exist: `getEventCategoryLabel` / `getEventTypeLabel` on cards and detail; feed/admin options emit keys; `parseEventFeedQuery` aliases `Theater` → `theater`
- [x] 1.3 Skim stale surfaces: `schema-overview` “Free-form strings today”; Abundo JSON `eventType: "Performance"`; Playwright GET `?category=Ausstellung`; admin helpers selecting `Performance`; catalog/waitlist fixtures posting `Theater`/`Performance`

## 2. Gherkin and product docs

- [x] 2.1 Update `docs/product/features/event-discovery.feature`: keep `Filter by category` and add the venue-label AND (options are Kino / Cinema etc., not onboarding chips); add `Category filter lists venue types` (titles verbatim)
- [x] 2.2 Update `docs/product/database/schema-overview.md`: `category` / `event_type` are allowlisted keys (`EVENT_CATEGORIES` / `EVENT_TYPES` in `packages/db/src/catalog/event-taxonomy.ts`); DE/EN labels in code; drop free-form wording; note `INTERESTS` is a separate onboarding list
- [x] 2.3 Update `docs/product/extras/gaps-and-decisions.md`: current-state row — event category is not member interests
- [x] 2.4 Update `docs/product/extras/content-i18n-inventory.md`: category/type labels via `getEventCategoryLabel` / `getEventTypeLabel` / option helpers in admin-content (and feed `categoryLabel`); not `INTERESTS` / `getInterestLabel`
- [x] 2.5 Update `docs/product/ui/ui-component-map.md`: EventCard badge, detail eyebrow, DETAILS type, feed/admin category selects use taxonomy locale labels (option values are keys)
- [x] 2.6 Update `docs/product/extras/pagination-and-search.md` example `?category=Theater` → `?category=theater` (legacy INTERESTS alias remains one-release)

## 3. Seed and Abundo remap

- [x] 3.1 Rewrite `packages/db/src/catalog/fixtures/abundo-berlin-demo.json` `category` / `eventType` to parent leftover-map keys (`Theater`→`theater`, `Performance`→`theater_play`, `Ausstellung`→`exhibition_hall`, `Other`→`special_event`, … — design decision 5 table)
- [x] 3.2 Update `scripts/fetch-abundo-seed.ts` `GENRE_TO_CATEGORY` values and `CATEGORY_EVENT_TYPE` to the same keys; fallback `?? "special_event"` (not `"Other"`)
- [x] 3.3 Confirm `seed.ts` / `seed-pagination-data.ts` already use allowlisted keys; keep `mapLegacy*` in `seed-data.ts` as a safety net
- [x] 3.4 Grep `eventType: "Performance"` (and leftover INTERESTS category ids) under `packages/db/src/catalog` — no product seed matches

## 4. Playwright helpers, specs, and coverage matrix

- [x] 4.1 Change `e2e/fixtures/admin.ts` (and inline `admin-events.spec.ts` selects) default event-type option from `Performance` to locale labels: DE `Theateraufführung / Schauspiel`, EN `Theater performance / play`; category default `"Theater"` may stay (same label)
- [x] 4.2 Change `e2e/fixtures/catalog.ts` and `waitlist.ts` `createEvent` defaults from `Theater`/`Performance` to `theater`/`theater_play`; do **not** change onboarding INTERESTS checkboxes
- [x] 4.3 Update `Scenario: Filter by category` in `e2e/specs/event-discovery.spec.ts`: `getByLabel` Kategorie/Category, select Theater, Apply, URL `category=theater`, `TITLES.theaterFuture` visible; skip when `DATABASE_URL` missing (never “UI not built”); no `data-testid`
- [x] 4.4 Add `Scenario: Category filter lists venue types`: taxonomy labels present (`Kino`/`Cinema`, `Ausstellungshalle`/`Exhibition hall`, opera-house label); INTERESTS-only option texts absent (`Other`, `Talk/Lesung`, `Tanz/Performance`, exact `Ausstellung`, exact `Konzert`)
- [x] 4.5 Grep `e2e/` for rebuilt-URL `category=Theater` after Map/Apply and expect `category=theater`; leave `event-feed.test.ts` alias cases and onboarding `Theater` chips
- [x] 4.6 Update `docs/product/testing/coverage-matrix.md` rows for `Filter by category` (still `pass`) and `Category filter lists venue types` (`pass` or named env-skip)

## 5. Cleanup and parent close-out

- [x] 5.1 Grep leftover product wording (`Free-form strings today`, `eventType: "Performance"` in seeds/docs, feed e2e selecting INTERESTS ids as category options)
- [x] 5.2 Mark `04-event-taxonomy-03-hardening` done in `.dev-plan/current-iteration/04-event-taxonomy-parent-guide.md` and walk parent **Release Criteria** (feature complete)
- [x] 5.3 Confirm canonical `docs/product/` reflects shipped taxonomy; note archived OpenSpec specs are not SoT

## 6. Verification

- [x] 6.1 Run `bun run lint` — exits 0
- [x] 6.2 Run `bun run typecheck` — exits 0
- [x] 6.3 Run `rg 'eventType: "Performance"' packages/db/src/catalog` — no product seed matches
- [x] 6.4 Run Playwright `Scenario: Filter by category` (label-based) — pass when `DATABASE_URL` is set
- [x] 6.5 Prepare PR/handoff linking this change ID and the parent guide
