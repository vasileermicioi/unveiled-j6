## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/03-event-copy-i18n-03-hardening.md`, parent guide Release Criteria / non-goals, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step 02 artifacts exist: General `title_de` / `title_en` / `description_de` / `description_en`; `resolveEventCopy` on public detail / cards / SEO; `getAdminCopy` `titleLabelDe` / `titleLabelEn` / `descriptionLabelDe` / `descriptionLabelEn`
- [x] 1.3 Skim stale surfaces: Gherkin single title/description; `schema-overview` “until locale UI lands”; `createEventViaUI` / `fillNewEventRequiredFields` filling `Titel*` / `Beschreibung*`; seed single `title` shim; coverage-matrix missing locale-title scenarios

## 2. Gherkin and product docs

- [x] 2.1 Update `docs/product/features/event-discovery.feature`: add `Guest sees English title on /en` and `Guest sees German title on /de` (titles verbatim); add `Filter by English title on /de` (EN-only substring on `/de/events` still lists the event; card title is German)
- [x] 2.2 Update `docs/product/features/admin-events.feature`: create/edit collect DE+EN title and Markdown description and reject empty either locale; add `Create event with DE and EN titles`; add Gherkin-only `Create rejects empty English title` (no Playwright — unit tests cover `REQUIRED_FIELD`); note dual fields on `Create a single event` / `Admin authors Markdown description` / `Edit event details` without renaming them
- [x] 2.3 Update `docs/product/database/schema-overview.md`: four locale columns + canonical DE sync + title-search OR; drop “until locale UI lands”; note ICS / admin list / ledger MAY still read canonical `title`
- [x] 2.4 Update `docs/product/extras/seo-and-metadata.md`: event `<title>` / meta description / JSON-LD `name`+`description` follow the page locale (resolved copy)
- [x] 2.5 Update `docs/product/extras/content-i18n-inventory.md`: document `titleLabelDe` / `titleLabelEn` / `descriptionLabelDe` / `descriptionLabelEn` and `fieldErrors.titleDe` / `titleEn` / `descriptionDe` / `descriptionEn`
- [x] 2.6 Update `docs/product/ui/ui-component-map.md`: Event detail identity title + Markdown and EventCard title are locale-resolved for `/:locale`
- [x] 2.7 Update `docs/product/extras/gaps-and-decisions.md`: current-state row — both locales required, canonical DE, search OR, public `/:locale` resolves copy
- [x] 2.8 Add a one-line `apps/web/DEPLOYMENT.md` demo note for the bilingual seed event (`Konzertabend: Unveiled-DE-Copy` / `Concert Night: Unveiled-EN-Copy`)

## 3. Seed and e2e helpers

- [x] 3.1 Export `DEMO_DISCOVERY_TITLES.localeCopyDe` = `Konzertabend: Unveiled-DE-Copy` and `localeCopyEn` = `Concert Night: Unveiled-EN-Copy` from `packages/db/src/catalog/demo-discovery-titles.ts`
- [x] 3.2 Seed that upcoming SECRET_CODE event in `seed.ts` (shared prebuilt image, first demo partner) via `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` — do **not** diverge `tonight` / voucher / Abundo JSON titles
- [x] 3.3 Replace `adminLabels.title` / `description` with `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` regexes (`/titel \(de\)|title \(de\)/i`, etc.); extend `fillTextbox` (or add `fillLabeledTextbox`) to accept `string | RegExp` without `exact` on regex
- [x] 3.4 Update `createEventViaUI` and `fillNewEventRequiredFields` to fill both locale titles and both descriptions (default: same string both sides); optional `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` overrides; `CreatedEvent.title` remains canonical DE; grep leftover `"Titel*"` / `"Beschreibung*"` event-form fills

## 4. Playwright and coverage matrix

- [x] 4.1 Add `Scenario: Guest sees German title on /de` and `Scenario: Guest sees English title on /en` in `e2e/specs/event-discovery.spec.ts`: guest cookies, `getEventIdByTitle(TITLES.localeCopyDe)` only, assert h1 + the other locale title `toHaveCount(0)`; skip when `DATABASE_URL` missing (never “UI not built”); no `data-testid`; no JSON-LD Playwright
- [x] 4.2 Add `Scenario: Filter by English title on /de`: booking-eligible member, `/de/events?title=Unveiled-EN-Copy`, German card title visible
- [x] 4.3 Add `Scenario: Create event with DE and EN titles` in `e2e/specs/admin-events.spec.ts`: distinct DE/EN titles via helper overrides; `/de` and `/en` public detail headings match; same R2 / `E2E_ADMIN_*` skip as other creates
- [x] 4.4 Update `docs/product/testing/coverage-matrix.md` rows for the four new scenarios (`pass` or named env-skip); Gherkin-only empty-English-title notes `event-copy.unit.test.ts` (no Playwright row required)

## 5. Cleanup and parent close-out

- [x] 5.1 Grep for stale wording (`until locale UI lands`, single `Titel*` event-form fills, “a title” as the only admin copy field in Gherkin) in `docs/product/` and `e2e/`
- [x] 5.2 Mark `03-event-copy-i18n-03-hardening` done in `.dev-plan/current-iteration/03-event-copy-i18n-parent-guide.md` and walk parent **Release Criteria** (feature complete)
- [x] 5.3 Confirm canonical `docs/product/` reflects shipped locale copy; note archived OpenSpec specs are not SoT

## 6. Verification

- [x] 6.1 Run `bun run lint` — exits 0
- [x] 6.2 Run `bun run typecheck` — exits 0
- [x] 6.3 Run Playwright for locale-title public-detail scenarios (`e2e/specs/event-discovery.spec.ts`) — pass when `DATABASE_URL` is set; admin create scenario pass or R2/`E2E_ADMIN_*` env-skip (never “UI not built”)
- [x] 6.4 Prepare PR/handoff linking this change ID and the parent guide
