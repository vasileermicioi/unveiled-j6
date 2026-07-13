## 1. Pre-flight

- [x] 1.1 Read `.dev-plan/current-iteration/gdpr-rights-03-ladle-e2e.md`, parent guide, `proposal.md`, `design.md`, and delta specs
- [x] 1.2 Confirm step-02 GDPR routes respond (`/profile/data-export`, `/profile/delete-account`, `/admin/users/:id/delete-account`)
- [x] 1.3 Inventory GDPR Scenario titles still skipped in `auth.spec.ts` / deferred notes in `profile.spec.ts` → implement vs Neon Auth / env-only deferral list
- [x] 1.4 Skim parent release criteria, `BillingCancelPage.stories.tsx` / `AdminFreezeForm.stories.tsx` patterns, `e2e/README.md`, and `coverage-matrix.md` GDPR rows

## 2. Ladle stories

- [x] 2.1 Add `DataExportPage.stories.tsx` — Default / ready (download CTA) using `getGdprMemberCopy(storyLocale)`
- [x] 2.2 Add `DeleteAccountPage.stories.tsx` — Confirm + With error
- [x] 2.3 Add `AdminDeleteAccountForm.stories.tsx` — Confirm + With error (`action: "#"`, `mockMemberId`)

## 3. Playwright — auth GDPR scenarios

- [x] 3.1 Implement `Scenario: Request a data export` in `auth.spec.ts` (disposable member → export page → assert on-demand downloadable JSON summary)
- [x] 3.2 Implement `Scenario: Request account deletion` (confirm → signed out + prior credentials fail; optional DB anonymize assert)
- [x] 3.3 Implement `Scenario: Account deletion is distinct from subscription cancellation` (ACTIVE seed; delete cancels sub; cancel-alone does not anonymize)
- [x] 3.4 Implement `Scenario: Admin can process account deletion on a member's behalf` (admin confirm path; same anonymize outcome; admin stays signed in)
- [x] 3.5 Add thin fixtures/helpers only if needed (`assertUserAnonymized`, export download capture); never delete shared `E2E_USER_*`
- [x] 3.6 Any remaining blocker → named `test.skip` with Neon Auth / env / harness reason only (forward to `seo-launch-polish-03` if still blocked)

## 4. Playwright — profile entry

- [x] 4.1 Ensure `Scenario: Access account deletion and data export` in `profile.spec.ts` passes; remove Phase 8 “mechanics deferred” comment
- [x] 4.2 Optionally strengthen: click entry links and assert export/delete page headings (full mechanics remain in auth.spec)

## 5. Docs and handoff

- [x] 5.1 Update `docs/product/testing/coverage-matrix.md` — auth GDPR + profile entry rows to `pass` / env `skip` / named deferral; split Google OAuth notes from GDPR notes
- [x] 5.2 Update `e2e/README.md` — remove “Phase 9 — GDPR … not built” inventory; document any named Neon Auth deferrals
- [x] 5.3 Mark step 03 and parent **gdpr-rights** done in `gdpr-rights-parent-guide.md`; note any named deferrals for `seo-launch-polish-03`

## 6. Validation

- [x] 6.1 Run `bun run lint` — exits 0
- [x] 6.2 Run `bun run typecheck` — exits 0
- [x] 6.3 Run `bun run stories` (or `@unveiled/web` Ladle) — GDPR export/delete/admin-delete stories load
- [x] 6.4 Run focused `bun run test:e2e` for auth/profile GDPR scenarios — green or only named deferrals
- [x] 6.5 Confirm no silent skips and no SEO / admin non-GDPR / partner scope creep
