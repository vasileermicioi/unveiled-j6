## 1. Setup and baseline

- [x] 1.1 Confirm discovery 01–04 behaviors on `bun run dev` with seed data (feed today default, filters, save/unsave, `/saved`, `/events/map` + consent)
- [x] 1.2 List all 12 `Scenario:` lines from `docs/migration/features/event-discovery.feature` as the Playwright checklist
- [x] 1.3 Read `e2e/README.md` selector policy and reuse patterns from `e2e/fixtures/auth.ts` (`loginAsUser`, guest flows)
- [x] 1.4 Audit seed/demo data for today (Berlin), alternate category/partner, date-range, saved-capable events, and `lat`/`lng`; note gaps

## 2. Ladle stories

- [x] 2.1 Add `EventFeedFilters.stories.tsx` — default (today scope) and filters-applied states
- [x] 2.2 Add `EventFeedPage.stories.tsx` — empty/no-results state (and optional populated chrome if useful)
- [x] 2.3 Add `SavedEventsPage.stories.tsx` — empty and populated layouts (reuse `@unveiled/ui` EventCard fixtures)
- [x] 2.4 Add EventMap stories (island or discovery wrapper) — consent-fallback, loading, error, markers (prefer static/consent-safe stories; avoid flaky tile-only stories)
- [x] 2.5 Smoke-check `bun run stories` serves new discovery stories without error and does not break Phase 0–4 stories

## 3. Seed and a11y prerequisites

- [x] 3.1 Extend `scripts/seed-demo.ts` (or document existing titles) so E2E can assert today/category/partner/coords/past-hidden coverage with stable visible text
- [x] 3.2 Fix any missing accessible names on filter controls, save/unsave toggle, map chrome, and empty states so proximity selectors work (no `data-testid`)

## 4. Playwright event-discovery spec

- [x] 4.1 Create `e2e/specs/event-discovery.spec.ts` with `test.describe("event-discovery.feature", …)`
- [x] 4.2 Implement tests with verbatim titles: Default feed shows today's events only; Events with invalid or past dates are hidden
- [x] 4.3 Implement: Filter by category; Filter by partner (venue); Filter by custom date range; Reset filters; No results
- [x] 4.4 Implement: Map view mirrors the filtered feed (preserve query; markers or consent fallback; detail link — not booking POST)
- [x] 4.5 Implement: Saved events view; Save and unsave an event; Saving requires authentication
- [x] 4.6 Implement: Public discovery preview for guests (preview + membership props; book attempt → signup/membership)
- [x] 4.7 Ensure zero unmarked skips; booking CTAs assert labels/hrefs only; selector policy only

## 5. Documentation and parent guide

- [x] 5.1 Add **Phase 5 — Member discovery** to `apps/web/DEPLOYMENT.md` (routes, demo script filter → save → map, booking still Phase 6, consent/CSP notes, credentials)
- [x] 5.2 Mark step 05 complete in `.dev-plan/current-iteration/discovery-parent-guide.md`

## 6. Validation and handoff

- [x] 6.1 Run `bun run lint` and `bun run typecheck` — pass
- [x] 6.2 Run `bun run stories` smoke and full `bun run test:e2e` — `event-discovery.spec.ts` green; prior suites still pass
- [x] 6.3 Deploy staging; walk client demo: filter → save → map → open detail; confirm booking still not implemented
- [x] 6.4 Hand off Phase 5 complete; do not start Phase 6 unless explicitly asked
