## 1. Setup and mapping

- [x] 1.1 Read `static-pages.feature`, `auth.feature`, and `onboarding.feature`; map each Scenario / Outline row to route + assertion list
- [x] 1.2 Confirm local `.env` has `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, and `SITE_URL`
- [x] 1.3 Confirm cookie consent key (`unveiled:cookie-consent`), legal footer hrefs, and onboarding step routes against app code
- [x] 1.4 Confirm post-login destinations and whether a PARTNER demo account exists in seed/`DEPLOYMENT.md`

## 2. Fixtures

- [x] 2.1 Extend `e2e/fixtures/auth.ts` with `logout` and `signupFreshUser` (unique email) using proximity selectors only
- [x] 2.2 Add `e2e/fixtures/onboarding.ts` helpers to drive steps age → interests → location → timing

## 3. Static pages specs

- [x] 3.1 Create `e2e/specs/static-pages.spec.ts` with verbatim titles for all 9 scenarios (landing, how-it-works, FAQ, discover, bilingual, legal+footer, cookie first visit, decline map, error tracking not gated)
- [x] 3.2 Implement cookie first-visit isolation via clearing `unveiled:cookie-consent` before banner assertions
- [x] 3.3 Handle map-placeholder scenario: assert placeholder if map slot exists on seeded `/de/events/:id`, else partial consent assertion + Phase 5 comment (or explicit Phase 5 skip)

## 4. Auth specs

- [x] 4.1 Create `e2e/specs/auth.spec.ts` for signup, valid login, invalid credentials, login without password, password reset (+ empty email), logout, unauthenticated route protection, USER role protection
- [x] 4.2 Add Scenario Outline tests for signup validation (4 rows) and post-login routing (4 rows)
- [x] 4.3 Mark Phase 9 GDPR scenarios and Google OAuth / social-role scenarios with `test.skip('…reason…')` (no unmarked skips)

## 5. Onboarding specs

- [x] 5.1 Create `e2e/specs/onboarding.spec.ts` for required-before-app, non-USER skip, already-onboarded skip, steps 1–4, and completing onboarding
- [x] 5.2 Use fresh signup isolation for mutating onboarding tests; assert completion redirect to the live membership/checkout destination

## 6. Docs and verification

- [x] 6.1 Update `e2e/README.md` with skip inventory (scenario → phase owner / reason)
- [x] 6.2 Run `bun run test:e2e -- e2e/specs/static-pages.spec.ts e2e/specs/auth.spec.ts e2e/specs/onboarding.spec.ts` — all non-skipped tests pass
- [x] 6.3 Grep new specs for forbidden selectors (`data-testid`, `.class`, `#id`); ensure every `test.skip` has a reason string
- [x] 6.4 Run `bun run lint` and `bun run typecheck`
- [x] 6.5 Mark step 03 done in `.dev-plan/current-iteration/testing-04-parent-guide.md`
