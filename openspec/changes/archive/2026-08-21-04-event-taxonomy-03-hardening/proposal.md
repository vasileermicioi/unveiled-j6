## Why

Steps 01–02 already persist allowlisted taxonomy keys, reject unknown writes, label cards/detail/selects, and alias legacy `?category=Theater` URLs. Seed JSON, Abundo fetch, product docs, and Playwright still describe INTERESTS strings (`Ausstellung`, `Performance`, “free-form”). Until those close, demo re-fetch can insert illegal types, Gherkin does not prove the category list is venue types, and the parent feature cannot close.

## What Changes

- Remap `scripts/fetch-abundo-seed.ts` `GENRE_TO_CATEGORY` / `CATEGORY_EVENT_TYPE` and `packages/db/src/catalog/fixtures/abundo-berlin-demo.json` category/type strings to parent-guide keys (`theater`, `cinema`, `theater_play`, …). `seed-data.ts` may keep `mapLegacy*` as a safety net; product fixtures SHALL already store keys.
- `seed.ts` / `seed-pagination-data.ts` already use new keys — confirm; grep leftover `eventType: "Performance"` under `packages/db/src/catalog/` (and product docs).
- `schema-overview.md`: `category` / `event_type` are allowlisted locale-invariant keys (`EVENT_CATEGORIES` / `EVENT_TYPES` in `@unveiled/db`), not free-form; point at the constants module; note member `INTERESTS` is a separate onboarding list.
- `gaps-and-decisions.md`: event category is **not** member interests.
- `content-i18n-inventory.md`: category/type labels live with admin-content maps (`getEventCategoryLabel` / `getEventTypeLabel`), not `INTERESTS`.
- `ui-component-map.md`: EventCard badge, detail eyebrow, DETAILS type, and feed/admin category selects use taxonomy locale labels.
- Gherkin: keep `Filter by category`; add `Category filter lists venue types` (options are venue-category labels, not onboarding interest chips). Playwright titles match verbatim; select by locale label via `getByLabel` (Kategorie/Category), e.g. Ausstellungshalle / Exhibition hall.
- Coverage-matrix rows for any new/changed scenario titles (`pass` or named env-skip; never “UI not built”).
- E2E helpers that still pick option text `Performance` or POST keys `Theater`/`Performance` SHALL use locale labels / allowlisted keys so admin create and catalog API fixtures stay green.
- Mark parent step 03 done (feature complete). Archived OpenSpec specs are not product SoT.
- Out of scope: changing `INTERESTS`; partner-level venue type entity; adding `Other`; dropping the one-release feed alias from step 02; new catalog write rules.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: `docs/product/database/schema-overview.md` SHALL describe `category` and `event_type` as allowlisted locale-invariant keys (`EVENT_CATEGORIES` / `EVENT_TYPES`), not free-form strings, and SHALL note that member `INTERESTS` is a separate onboarding list. Seed/Abundo fixtures SHALL store those keys (no leftover `Performance` / INTERESTS ids in product seed JSON).
- `event-discovery`: Product Gherkin SHALL keep `Filter by category` and SHALL add `Category filter lists venue types`. Playwright SHALL use those titles verbatim. Filter e2e SHALL select by locale label (`getByLabel` Kategorie/Category). Visible options SHALL be venue-category labels (e.g. Kino / Cinema, Ausstellungshalle / Exhibition hall) and SHALL NOT list onboarding-only interest chips (`Other`, `Talk/Lesung`, …).

## Impact

- **Product SoT:** `docs/product/features/event-discovery.feature`, `docs/product/database/schema-overview.md`, `docs/product/extras/{gaps-and-decisions,content-i18n-inventory}.md`, `docs/product/ui/ui-component-map.md`, `docs/product/testing/coverage-matrix.md`. Optionally `docs/product/extras/pagination-and-search.md` if it still cites `?category=Theater` as the canonical example.
- **Seed:** `packages/db/src/catalog/fixtures/abundo-berlin-demo.json`, `seed-data.ts`, `scripts/fetch-abundo-seed.ts` (`GENRE_TO_CATEGORY`, `CATEGORY_EVENT_TYPE`). Confirm `seed.ts` / `seed-pagination-data.ts`.
- **E2E:** `e2e/specs/event-discovery.spec.ts` (`Filter by category` + new venue-types scenario); `e2e/fixtures/admin.ts` type/category option labels; `e2e/fixtures/{catalog,waitlist}.ts` create payloads that still default to `Theater`/`Performance`.
- **Runtime UI / domain:** no intended behavior change. Steps 01–02 already ship keys, labels, validation, and the feed alias.
- **Parent close-out:** `.dev-plan/current-iteration/04-event-taxonomy-parent-guide.md` mark `04-event-taxonomy-03-hardening` done; walk Release Criteria.
- **Planning mirrors:** `openspec/specs/{event-catalog,event-discovery}` via this change’s deltas (not product SoT).
- **Source brief:** `.dev-plan/current-iteration/04-event-taxonomy-03-hardening.md`
- **Parent:** `.dev-plan/current-iteration/04-event-taxonomy-parent-guide.md`
- **Depends on:** `04-event-taxonomy-02-admin-and-discovery-ui` (done)
- **Consumed by:** closes the `04-event-taxonomy` parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; `rg 'eventType: "Performance"' packages/db/src/catalog` — no product seed matches; Playwright `Scenario: Filter by category` passes (label-based) when `DATABASE_URL` is set
