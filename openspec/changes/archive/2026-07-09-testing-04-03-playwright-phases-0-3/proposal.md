## Why

The Playwright harness from step 01 only has a smoke redirect test. Phases 1–3 (marketing, auth, onboarding) already ship in production SSR, but their Gherkin scenarios in `docs/migration/features/` have no browser coverage. This step closes that gap so regressions in locale marketing pages, the auth loop, and the four-step onboarding wizard are caught before Phase 4½ CI wiring.

## What Changes

- Add `e2e/specs/static-pages.spec.ts` — one Playwright test per scenario in `static-pages.feature` (9 scenarios), titles matching Gherkin verbatim.
- Add `e2e/specs/auth.spec.ts` — implementable auth scenarios plus Scenario Outline rows; Phase 9 GDPR and optional Google OAuth marked with explicit `test.skip` reasons.
- Add `e2e/specs/onboarding.spec.ts` — all 8 onboarding scenarios with fresh-USER isolation.
- Add `e2e/fixtures/onboarding.ts` (and extend `auth.ts` if needed for logout / role setup).
- Update `e2e/README.md` with a skip inventory (scenario → phase owner / reason).

**Out of scope:** admin/partner E2E (step 04), Ladle stories (step 02), CI workflow (step 05), adding `data-testid` to production markup.

## Capabilities

### New Capabilities

- `authentication`: Automated browser coverage requirements for implementable `auth.feature` scenarios (signup, login, logout, validation, route/role protection) and explicit skip policy for deferred GDPR/OAuth cases.
- `member-onboarding`: Automated browser coverage requirements for the four-step SSR onboarding wizard and gate/skip behavior from `onboarding.feature`.

### Modified Capabilities

- `static-marketing-pages`: Add requirement that each Gherkin scenario in `static-pages.feature` has a matching Playwright test covering landing, how-it-works, FAQ, discover preview, bilingual content, legal footer links, and cookie consent behaviors.

## Impact

- **New files:** `e2e/specs/static-pages.spec.ts`, `e2e/specs/auth.spec.ts`, `e2e/specs/onboarding.spec.ts`, `e2e/fixtures/onboarding.ts`.
- **Touched:** `e2e/fixtures/auth.ts` (logout / helpers as needed), `e2e/README.md` (skip inventory).
- **Env:** Local `.env` must set `E2E_USER_*` / `E2E_ADMIN_*` (already documented in `.env.example`); demo seed + `bun run dev` for runs.
- **Runtime app:** No production code changes expected; proximity selectors only. Map-placeholder assertion may defer to Phase 5 if no map slot exists yet — document in test comment.
- **Downstream:** Consumed by `testing-04-05-ci-and-release`; parallel with Ladle stories and Phase 4 admin E2E.
