## Why

Discovery steps 01–04 shipped the member feed, filters, saved events, and map, but Phase 5 is not merge-ready without Ladle stories, Gherkin-traced Playwright coverage for every `event-discovery.feature` scenario, and updated staging docs. Closing this gap makes the discovery loop demoable and enforces the Phase 4½ testing convention for Phase 5.

## What Changes

- Add Ladle stories for discovery UI states: EventMap island (loading, error, markers, consent-fallback when storyable), feed filter bar (default / filters applied / empty), saved-events empty + populated — per `ui/ui-component-map.md`. Prefer `packages/ui` for shared pieces; page-level stories under `apps/web/app/components/discovery/**/*.stories.tsx` when needed.
- Add `e2e/specs/event-discovery.spec.ts` with one Playwright test per `Scenario:` line in `docs/migration/features/event-discovery.feature` (12 scenarios), titles matching verbatim; zero unmarked skips.
- Enforce proximity-only selectors (`getByRole`, `getByLabel`, `getByText`, `filter`, parent walks, `nth()`); fix accessible names in UI rather than weakening the policy.
- Extend seed/fixtures if needed so demo USER + published events cover today, alternate category/partner, date-range, saved, and map coordinates.
- Update `apps/web/DEPLOYMENT.md` with Phase 5 routes, demo script (filter → save → map), booking still Phase 6, and any map/CSP notes.
- Mark discovery parent guide steps complete; hand off Phase 5 without starting Phase 6.
- **Out of scope:** booking/Stripe, waitlist E2E, visual regression baselines, inventing new product behavior beyond a11y fixes for selectors.

## Capabilities

### New Capabilities

- _(none)_ — coverage and release docs extend existing capabilities.

### Modified Capabilities

- `event-discovery`: Add automated coverage requirements — Ladle stories for feed/saved/map visual states and Playwright tests in `e2e/specs/event-discovery.spec.ts` with verbatim Scenario titles; add Phase 5 release documentation requirements for the discovery demo.
- `platform-foundation`: Extend phase test-coverage convention so Phase 5 adds discovery Ladle/Playwright coverage without regressing existing `bun run stories` / `bun run test:e2e` suites.

## Impact

- **Stories:** `apps/web/app/components/discovery/**/*.stories.tsx` and/or island story wrappers; possibly thin story fixtures for `EventMap` states.
- **E2E:** new `e2e/specs/event-discovery.spec.ts`; reuse auth fixtures / USER credentials from `e2e/`; may touch seed (`scripts/seed-demo.ts`) for fixture coverage.
- **UI a11y:** possible label/`aria-label` fixes on filter controls, save toggle, map chrome — no `data-testid`.
- **Docs:** `apps/web/DEPLOYMENT.md`, `.dev-plan/current-iteration/discovery-parent-guide.md`.
- **Verification:** `bun run lint`, `bun run typecheck`, `bun run stories` (smoke), `bun run test:e2e`; staging deploy + Phase 5 client demo.
- **Source:** `.dev-plan/current-iteration/discovery-05-stories-e2e-release.md`; `event-discovery.feature`; `ui/ui-component-map.md`; `e2e/README.md`; IMPLEMENTATION-PLAN § Phase 5 + Testing conventions.
