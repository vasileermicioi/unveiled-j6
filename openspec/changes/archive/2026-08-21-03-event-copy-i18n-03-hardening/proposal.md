## Why

Steps 01–02 already persist DE/EN event copy and resolve it on public/member surfaces, but product SoT, seed fixtures, and Playwright still describe a single title/description. Until Gherkin, schema/SEO/i18n docs, bilingual seed, and e2e prove `/de` vs `/en` titles plus admin dual-locale authoring, CI verifies the old contract and the parent feature cannot close.

## What Changes

- `schema-overview.md`: four locale columns + canonical DE sync on write + title search OR; drop the stale “until locale UI lands” note (step 02 already resolved public/member copy).
- `seo-and-metadata.md`: event `<title>`, meta description, and JSON-LD `name` / `description` use locale-resolved copy for the page URL.
- `content-i18n-inventory.md` + admin-content keys: document `titleLabelDe` / `titleLabelEn` / `descriptionLabelDe` / `descriptionLabelEn` (and matching `fieldErrors`).
- `ui-component-map.md`: Event detail identity title + Markdown description and EventCard title are locale-resolved for `/:locale`.
- `gaps-and-decisions.md`: current-state row for DE/EN event copy (required both locales; canonical DE; search matches either).
- Gherkin: admin create/edit collect both-locale title + Markdown description and reject empty either locale; public `Guest sees English title on /en` and `Guest sees German title on /de`; optional cheap feed scenario that an EN-only substring still matches on `/de`.
- Playwright titles match those Gherkin `Scenario:` lines verbatim; proximity/layout selectors only; no `data-testid`.
- **E2E helpers:** `createEventViaUI` / `fillNewEventRequiredFields` currently fill `Titel*` / `Beschreibung*` — update to both DE and EN labeled fields so existing admin create tests keep working after step 02.
- Seed/demo: at least one event has **distinct** DE vs EN titles (both non-empty) so public-detail e2e can assert locale, without breaking existing `DEMO_DISCOVERY_TITLES.*` lookups that still expect identical strings.
- Coverage matrix rows for the new scenarios (`pass` or named env-skip; never “UI not built”).
- Mark parent step 03 done (feature complete). Archived OpenSpec specs are not product SoT.
- Out of scope: extra locales; machine translation; taxonomy (series `04`); partner-name i18n; new catalog write rules; nested locale tablist.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-discovery`: Product Gherkin and Playwright SHALL include `Guest sees English title on /en` and `Guest sees German title on /de` (titles verbatim). Public detail identity title SHALL match the URL locale. `seo-and-metadata.md` SHALL state that event title and meta description follow the page locale. EventCard / Event detail in the UI map SHALL document locale-resolved title. Optional: member feed `title=` on `/de` MAY match an English title substring.
- `admin-events`: Product Gherkin SHALL specify that create/edit collect title and Markdown description for both German and English and reject submit when either locale is empty, including scenario `Create event with DE and EN titles`. Playwright SHALL use that title verbatim. Admin e2e helpers SHALL fill both locale fields.

## Impact

- **Product SoT:** `docs/product/features/{event-discovery,admin-events}.feature`, `docs/product/database/schema-overview.md`, `docs/product/extras/{seo-and-metadata,content-i18n-inventory,gaps-and-decisions}.md`, `docs/product/ui/ui-component-map.md`, `docs/product/testing/coverage-matrix.md`.
- **E2E:** `e2e/specs/event-discovery.spec.ts`, `e2e/specs/admin-events.spec.ts`, `e2e/fixtures/admin.ts` (`adminLabels` + `createEventViaUI` / fill helpers).
- **Seed:** `packages/db/src/catalog/{seed.ts,seed-data.ts,demo-discovery-titles.ts}` and/or Abundo fixture JSON — one bilingual event; other demo titles MAY stay identical so existing `TITLES.tonight` assertions keep working on both locales.
- **Runtime UI / domain:** no intended behavior change. Steps 01–02 already ship columns, `resolveEventCopy`, admin four fields, and locale-resolved public copy. Do not add client mutation tests.
- **Parent close-out:** `.dev-plan/current-iteration/03-event-copy-i18n-parent-guide.md` mark `03-event-copy-i18n-03-hardening` done; walk Release Criteria.
- **Planning mirrors:** `openspec/specs/{event-discovery,admin-events}` via this change’s deltas (not product SoT).
- **Source brief:** `.dev-plan/current-iteration/03-event-copy-i18n-03-hardening.md`
- **Parent:** `.dev-plan/current-iteration/03-event-copy-i18n-parent-guide.md`
- **Depends on:** `03-event-copy-i18n-02-admin-and-public-ui` (done)
- **Consumed by:** closes the `03-event-copy-i18n` parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; Playwright locale-title scenarios on public detail — pass when `DATABASE_URL` is set (R2/`E2E_ADMIN_*` env-skip for admin create; never “UI not built”)
