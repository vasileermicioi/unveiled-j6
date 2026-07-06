## Why

Onboarding steps 01–03 delivered domain persistence, middleware guards, and the four-step SSR wizard — but Phase 3 is not release-ready until integration coverage, deployment documentation, staging verification, and polish confirm the full signup → onboarding → membership flow works on `/de` and `/en` without regressions to Phase 2 auth.

## What Changes

- Add or extend automated tests for onboarding completion:
  - Full save + complete round-trip in `@unveiled/auth` (gated on `DATABASE_URL`; extend existing `onboarding.test.ts` or add `onboarding.integration.test.ts` if clearer)
  - Extend `apps/web/app/lib/onboarding-middleware.test.ts` if step 02 left coverage gaps
  - Optional route-level smoke tests for POST redirect chains with mocked session when repo pattern supports it
- Confirm `apps/web/app/routes/robots.txt.ts` disallows `/*/onboarding/` (already present — verify, add test if missing)
- Update `apps/web/DEPLOYMENT.md` with Phase 3 staging verification: demo script (signup → 4 steps → membership), skip-age flow, repeat-demo reset notes (`onboarding_complete` / profile via SQL or fresh signup); confirm no new env vars beyond Phase 2
- Deploy to staging; run client demo checklist twice (full flow + returning complete user skip)
- Fix any lint/type/release-blocker bugs found in steps 01–03 during verification
- **Out of scope:** Phase 4+ (events feed, admin, Stripe), E2E browser automation (optional nice-to-have), Sentry/cron/GDPR (Phase 9), preference-based discovery (Phase 5)

## Capabilities

### New Capabilities

<!-- None — release gate extends existing capabilities -->

### Modified Capabilities

- `member-onboarding`: Add Phase 3 release gate requirement — staging demo acceptance, clean console on onboarding routes, preferences persisted for admin intel.
- `platform-foundation`: Extend deployment documentation requirement with Phase 3 staging verification steps and repeat-demo reset notes.

## Impact

- **Packages:** `packages/auth/src/onboarding.test.ts` (or new integration test file)
- **Apps:** `apps/web/app/lib/onboarding-middleware.test.ts`, optional route smoke tests; `apps/web/app/routes/robots.txt.ts` (verify only)
- **Documentation:** `apps/web/DEPLOYMENT.md` Phase 3 section
- **Deploy:** Staging via existing Railway pipeline; same env vars as Phase 2 (`DATABASE_URL`, `AUTH_URL`, `SITE_URL`)
- **Downstream:** Closes Phase 3; Phase 4 catalog work begins next
- **Branch:** `onboarding-04-hardening-and-release` or `phase-3-onboarding` per iteration convention
