## Why

Admin-ops steps 01–04 shipped Membership HQ, mutation pages, waitlist promote, and booking cancel — but Ladle coverage for mutation confirms is incomplete, there is no `admin-users.spec.ts`, and Phase 7 e2e still `test.skip`s admin waitlist/cancel/credit scenarios with “Phase 8 — UI not built.” Without this close-out, admin-ops is not releasable and silent skips remain instead of pass or named deferrals for `seo-launch-polish-03`.

## What Changes

- Add/extend Ladle stories under `apps/web/app/components/admin/` for Membership HQ list/detail (if gaps remain) and key mutation confirm states: adjust-credits, freeze, refund, comp-ticket, waitlist promote, booking cancel (and waitlist list if useful).
- Add `e2e/specs/admin-users.spec.ts` with verbatim `Scenario:` titles from `docs/product/features/admin-users.feature`, proximity selectors, ADMIN fixtures via existing e2e auth helpers.
- Un-skip / implement (prefer implement) admin scenarios currently deferred in `waitlist.spec.ts`, `booking.spec.ts`, and `credits-subscription.spec.ts`; any remaining blockers become named deferrals owned only by remaining Phase 8 / `seo-launch-polish-03` (env/harness reasons — not “UI not built”).
- Update `docs/product/testing/coverage-matrix.md` and `e2e/README.md` skip/deferral inventory to match.
- Document freeze vs Stripe `PAST_DUE` operator note in `apps/web/DEPLOYMENT.md` (from parent-guide risk) if not already present.
- Mark step 05 and parent **admin-ops** done in the parent guide after verification.

**Out of scope:** GDPR e2e (`gdpr-rights-03`); full MVP audit (`seo-launch-polish-03`); partner specs; new product routes or domain writers.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `bdd-and-e2e`: Map `admin-users.feature` → `e2e/specs/admin-users.spec.ts` with verbatim Scenario titles and proximity selectors; admin waitlist/cancel/credit support scenarios SHALL pass or be listed as named deferrals with reason (not silent skips / not “UI not built”).
- `admin-users`: Close Membership HQ with Ladle stories + Playwright coverage for list/search/detail and adjust/freeze/comp flows exposed via SSR mutation pages.
- `waitlist`: Resolve Phase 8 deferred admin visibility / manual promote rows now that `/admin/waitlist` exists (pass or env-named deferral only).
- `booking`: Resolve Phase 8 deferred admin cancel booking row now that `/admin/bookings/:id/cancel` exists.
- `credits-subscription`: Resolve Phase 8 deferred admin credit/freeze/comp/refund e2e rows now that Membership HQ mutation pages exist.

## Impact

- **E2E:** new `e2e/specs/admin-users.spec.ts`; updates to `waitlist.spec.ts`, `booking.spec.ts`, `credits-subscription.spec.ts`; thin fixtures only if needed; `e2e/README.md`.
- **UI stories:** `*.stories.tsx` co-located under `apps/web/app/components/admin/` (list/detail already exist — extend mutation confirm stories).
- **Docs:** `coverage-matrix.md`, optionally `DEPLOYMENT.md` freeze operator note; mark `admin-ops-parent-guide.md` step 05 / feature done.
- **Product SoT:** `docs/product/features/{admin-users,waitlist,booking,credits-subscription}.feature` unchanged unless a bugfix forces alignment.
- **Depends on:** `admin-ops-04-admin-mutation-pages` (merged/archived).
- **Consumed by:** `seo-launch-polish-03-mvp-audit-and-cutover` (closes admin-ops).
- **Branch:** `admin-ops-05-ladle-e2e`.
- **Verification:** `bun run lint`, `bun run typecheck`, Ladle stories load, focused `bun run test:e2e -- e2e/specs/admin-users.spec.ts` (plus related admin scenario specs) — green or only named deferrals.
