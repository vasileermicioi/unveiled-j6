## 1. Pre-flight

- [x] 1.1 Read `.dev-plan/current-iteration/admin-ops-05-ladle-e2e.md`, parent guide, `proposal.md`, `design.md`, and delta specs
- [x] 1.2 Confirm step-04 admin mutation routes respond for ADMIN (users adjust/freeze/refund/comp, waitlist list/promote, booking cancel)
- [x] 1.3 Inventory Gherkin scenarios from `admin-users.feature` plus admin rows in `waitlist.feature`, `booking.feature`, `credits-subscription.feature` → implement vs env-only deferral list
- [x] 1.4 Skim `e2e/specs/admin-{events,partners}.spec.ts`, `waitlist.spec.ts`, `booking.spec.ts`, `credits-subscription.spec.ts`, `e2e/README.md`, `coverage-matrix.md`, and existing admin Ladle stories

## 2. Ladle stories

- [x] 2.1 Add `AdminAdjustCreditsForm.stories.tsx` — default + error
- [x] 2.2 Add `AdminFreezeForm.stories.tsx` — freeze, unfreeze, unavailable
- [x] 2.3 Add `AdminRefundForm.stories.tsx` — default + error
- [x] 2.4 Add `AdminCompTicketForm.stories.tsx` — default (with event options) + error
- [x] 2.5 Add `AdminWaitlistListPage.stories.tsx` — with entries + empty
- [x] 2.6 Add `AdminWaitlistPromotePage.stories.tsx` — confirm
- [x] 2.7 Add `AdminCancelBookingPage.stories.tsx` — confirm
- [x] 2.8 Keep/extend `AdminUsersListPage` / `AdminUserDetailPage` stories only if e2e reveals a missing visual state

## 3. Playwright — admin-users

- [x] 3.1 Create `e2e/specs/admin-users.spec.ts` with verbatim `Scenario:` titles from `admin-users.feature`
- [x] 3.2 Implement list, search, collapsed summary (row columns), and detail/intel via `/admin/users/:id` (proximity selectors; map “expand panel” to detail page)
- [x] 3.3 Implement adjust credits, freeze/unfreeze, and complimentary ticket via SSR mutation pages linked from detail
- [x] 3.4 Add thin fixtures/helpers only if needed (resolve member by email, open Users tab, navigate mutation paths); reuse `loginAsAdmin` / `settleAdminSession`

## 4. Playwright — un-skip admin waitlist / booking / credits

- [x] 4.1 Implement `Admin visibility` and `Admin can manually trigger promotion for a specific entry` in `waitlist.spec.ts` (remove “Phase 8 — … UI” skips)
- [x] 4.2 Implement `Admin cancels a confirmed booking` and `Cannot cancel a booking that is not confirmed` in `booking.spec.ts`
- [x] 4.3 Implement admin adjust / zero rejection / refund / freeze / unfreeze / comp scenarios in `credits-subscription.spec.ts`
- [x] 4.4 Any remaining blocker → named `test.skip` / matrix `deferred` owned only by `seo-launch-polish-03` with non-UI reason (env/harness)

## 5. Docs and handoff

- [x] 5.1 Update `docs/product/testing/coverage-matrix.md` — admin-users + admin waitlist/cancel/credits rows to `pass` / env `skip` / named deferral (no `unshipped`, no “UI not built”)
- [x] 5.2 Update `e2e/README.md` — add `admin-users.spec.ts` inventory; revise skip inventory for resolved Phase 8 admin UI rows
- [x] 5.3 Update `apps/web/DEPLOYMENT.md` — Membership HQ demo path + freeze vs Stripe `PAST_DUE` operator note from parent guide
- [x] 5.4 Mark step 05 and parent **admin-ops** done in `admin-ops-parent-guide.md`; note any named deferrals for `seo-launch-polish-03`

## 6. Validation

- [x] 6.1 Run `bun run lint` — exits 0
- [x] 6.2 Run `bun run typecheck` — exits 0
- [x] 6.3 Run `bun run stories` (or `@unveiled/web` Ladle) — admin mutation/waitlist/cancel stories load
- [x] 6.4 Run `bun run test:e2e -- e2e/specs/admin-users.spec.ts` plus focused waitlist/booking/credits-subscription admin scenarios — green or only named deferrals
- [x] 6.5 Confirm no silent skips and no GDPR / SEO / partner scope creep
