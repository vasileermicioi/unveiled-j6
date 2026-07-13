## Why

Phase 7 product surfaces (waitlist join/cancel + promotion, profile identity/preferences, billing portal/cancel) are implemented, but Ladle stories, Playwright specs, coverage-matrix rows, and staging/`DEPLOYMENT.md` release evidence are still missing. Without this close-out step, Phase 7 cannot meet its done-when criteria and Phase 6 deferred scenarios stay silently skipped instead of pass or named Phase 8 deferrals.

## What Changes

- Add Ladle stories for waitlist join/cancel states and profile billing + preferences compositions (co-located with existing page components under `apps/web/app/components/`).
- Add `e2e/specs/waitlist.spec.ts` — verbatim `Scenario:` titles from `waitlist.feature` for member flows; defer admin scenarios to Phase 8 with named reasons.
- Add `e2e/specs/profile.spec.ts` — verbatim titles from `profile.feature` (identity, preferences, wallet, refill, billing view/update/cancel entry points); GDPR page mechanics deferred to Phase 8 (entry-link visibility may still assert).
- Un-skip / implement Phase 7 rows in `credits-subscription.spec.ts` (portal recovery, cancel, period-end, reactivate) and `booking.spec.ts` (`Sold out — automatic waitlist offer`) where UI exists; document remaining Stripe-deep or package-only skips like Phase 6 Checkout opt-in.
- Update `docs/product/testing/coverage-matrix.md` and `e2e/README.md` skip/deferral inventory.
- Update `apps/web/DEPLOYMENT.md`: sold-out seed event, Stripe Customer Portal dashboard config, Phase 7 demo script, **stop before Phase 8**.
- Staging deploy + demo walkthrough recorded in `DEPLOYMENT.md`.

**Out of scope:** Phase 8 admin waitlist HQ / manual promote UI, admin booking cancel, GDPR export/delete pages, SEO polish, Sentry, partner portal, new product behavior beyond bugs found while testing.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `bdd-and-e2e`: Map `waitlist.feature` → `e2e/specs/waitlist.spec.ts` and `profile.feature` → `e2e/specs/profile.spec.ts` with verbatim Scenario titles and proximity selectors; require named Phase 8 deferrals (not silent skips) for admin waitlist and GDPR mechanics.
- `waitlist`: Add Phase 7 release-evidence requirement — staging demo of sold-out join → capacity frees → auto-promotion → email attempt, with sold-out seed documented.
- `member-profile`: Add Playwright/Ladle coverage requirement for shipped profile identity, preferences, wallet, and billing entry points (GDPR pages remain Phase 8 deferrals).
- `credits-subscription`: Un-defer Phase 7 Customer Portal / cancel / reactivate e2e rows now that `/profile/billing` exists; keep admin credit/freeze/comp as Phase 8.

## Impact

- **E2E:** new `waitlist.spec.ts`, `profile.spec.ts`; updates to `credits-subscription.spec.ts`, `booking.spec.ts`, fixtures as needed; `e2e/README.md`.
- **UI stories:** `*.stories.tsx` next to waitlist/profile components; no new product routes.
- **Docs:** `coverage-matrix.md`, `apps/web/DEPLOYMENT.md`, parent guide mark step 05 / Phase 7 release-ready.
- **Product SoT:** `docs/product/features/{waitlist,profile,credits-subscription}.feature` unchanged unless a bugfix forces copy/behavior alignment.
- **Depends on:** steps 02 + 04 (waitlist UI/email + billing portal/cancel).
- **Branch:** `waitlist-account-05-ladle-e2e-and-release`.
- **Verification:** `bun run lint`, `bun run typecheck`, Ladle smoke, `bun run test:e2e` for Phase 7 scope (green or only named deferrals).
