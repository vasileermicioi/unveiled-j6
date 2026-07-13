## Context

Steps 01–02 shipped `buildUserDataExport` / `anonymizeUserAccount`, member pages at `/:locale/profile/data-export` and `/:locale/profile/delete-account`, and admin `/:locale/admin/users/:id/delete-account` (`AdminDeleteAccountForm`). Profile already links to export/delete; `profile.spec.ts` asserts those links but still notes “Full GDPR page mechanics → Phase 8.” `auth.spec.ts` hard-skips four GDPR scenarios with outdated “Phase 9 — … not built” reasons. No Ladle stories exist for `DataExportPage`, `DeleteAccountPage`, or `AdminDeleteAccountForm`. Coverage matrix still marks GDPR rows `deferred`.

Sources: `.dev-plan/current-iteration/gdpr-rights-03-ladle-e2e.md`, parent guide, `docs/product/features/{auth,profile}.feature`, `docs/product/testing/bdd-and-e2e.md`, existing profile Ladle patterns (`BillingCancelPage.stories.tsx`), admin mutation stories (`AdminFreezeForm.stories.tsx`), e2e fixtures (`onboardFreshMember`, `loginAsAdmin`, `activateMemberForBooking`, `getUserIdByEmail`).

## Goals / Non-Goals

**Goals:**

- Ladle stories for GDPR confirm/export (and admin delete confirm) states using existing page/form props + `getGdprMemberCopy` / admin copy.
- Playwright: implement the four `auth.feature` GDPR scenarios in `auth.spec.ts`; keep/strengthen `profile.spec.ts` entry-link scenario (optionally click through to page headings).
- Coverage matrix + `e2e/README.md` reflect pass / env-skip / named deferral (owner = Neon Auth limitation or `seo-launch-polish-03` only — never “not built” / “Phase 9”).
- Mark step 03 and parent **gdpr-rights** done after verification; forward any named deferrals.

**Non-Goals:**

- Full MVP audit / SEO / Sentry (`seo-launch-polish-*`).
- Admin non-GDPR e2e (already closed in `admin-ops-05`).
- Partner portal / check-in.
- New product routes, schema, or domain writers beyond bugfixes found while testing.
- Hard-delete of `public.users` or async export email.

## Decisions

### 1. Stories co-located with profile/admin components

| Component | Story states (minimum) |
|---|---|
| `DataExportPage` | Default / ready (download CTA); optionally empty-copy note is N/A — page has no empty payload UI (download always available). If a distinct error/empty composition is added later, story it; for now Default is enough, plus a second story only if props support a meaningful variant |
| `DeleteAccountPage` | Confirm (default); With error |
| `AdminDeleteAccountForm` | Confirm (default); With error |

Follow existing patterns: `@ladle/react` `Story`, `storyLocale` / `mockMemberId` from `apps/web/app/components/stories/fixtures`, `getGdprMemberCopy(storyLocale)` for member pages, same admin story base as freeze/refund forms (`action: "#"`, `memberLabel`).

**Rationale:** App-owned pages; DS policy colocates stories with components. Export page is intentionally simple (link download) — do not invent fake “empty export” UI that product does not ship.

### 2. Playwright mapping

| Feature scenario | Spec file | Action |
|---|---|---|
| Request a data export | `auth.spec.ts` | Implement: onboard → `/profile/data-export` → trigger download (`?download=1` / download link) → assert JSON response contains profile/bookings/ledger keys (or download event + content-type) |
| Request account deletion | `auth.spec.ts` | Implement: onboard fresh member → confirm delete → assert signed out + cannot re-login with prior credentials; DB `deleted_at` / anonymized email via thin fixture if useful |
| Account deletion is distinct from subscription cancellation | `auth.spec.ts` | Implement: activate member (ACTIVE) → assert billing cancel path still exists separately; delete account → subscription cancelled as part of delete (assert status / cancel side effect observable); cancelling subscription alone (existing billing cancel flow or seed) does not anonymize |
| Admin can process account deletion on a member's behalf | `auth.spec.ts` | Implement: create disposable USER → admin login → `/admin/users/:id/delete-account` → confirm → member cannot login; admin session remains |
| Access account deletion and data export | `profile.spec.ts` | Keep entry links; remove “Phase 8 mechanics” comment; optionally assert navigating links reaches export/delete headings (mechanics stay in auth.spec) |

Rules from `bdd-and-e2e.md`:

- `test("Scenario: <exact Gherkin title>", …)`
- Proximity selectors only — no `data-testid`
- Prefer disposable `onboardFreshMember` over shared `E2E_USER_*` for destructive delete tests
- Admin via `loginAsAdmin` / `settleAdminSession` / existing Membership HQ helpers
- `DATABASE_URL` / `E2E_ADMIN_*` env skips are OK (documented prerequisites)

### 3. In-scope vs deferral matrix

**Implement (prefer):**

- All four auth GDPR scenarios above
- Profile entry-link scenario remains pass (strengthen assertions if cheap)

**Named deferrals only if blocked:**

- Neon Auth Admin plugin / `user.deleteUser` / ban endpoints unavailable in the test environment → `test.skip` with explicit Neon Auth reason (document in README + matrix); forward to `seo-launch-polish-03` if still blocked at audit time
- Missing `DATABASE_URL` / `E2E_ADMIN_*` → env skip (not a product deferral)
- Deep Stripe live cancel during deletion → assert local subscription status / cancel path was invoked; do not require live Stripe webhook race unless harness already supports it (seed ACTIVE + assert post-delete status / anonymized user)

**Out of scope / other owners:**

- Google OAuth scenarios remain deferred (unchanged)
- SEO / Sentry / full audit → `seo-launch-polish-*`

### 4. Fixtures and helpers

Reuse:

- `e2e/fixtures/auth.ts` — signup/login/logout, `loginAsAdmin`
- Existing onboard helpers used by `profile.spec.ts` / `auth.spec.ts`
- `e2e/fixtures/billing.ts` — `activateMemberForBooking`, `getUserIdByEmail`, credit/subscription seed helpers
- `e2e/fixtures/admin-users.ts` — open member detail / search patterns if present

Add thin helpers only if repeated:

- `assertUserAnonymized(emailOrId)` — `deleted_at` set / email matches `deleted-…@deleted.local` pattern
- Download capture for export (`page.waitForEvent('download')` or request to `?download=1` with session cookies)

Prefer UI navigation for delete/export; use DB only for postconditions and ACTIVE seed.

### 5. Coverage matrix + README + parent guide

- Flip auth GDPR rows from `deferred` Phase 8/9 → `pass` (or env `skip` / named Neon Auth deferral)
- Flip profile “Access account deletion and data export” from `deferred` mechanics note → `pass`
- Split Google OAuth deferral notes from GDPR rows in matrix notes (OAuth stays deferred; GDPR should not share the same “Google OAuth / GDPR” bucket)
- `e2e/README.md`: revise skip inventory — remove “Phase 9 — GDPR … not built”; document any Neon Auth–named deferrals
- Mark step 03 + parent **gdpr-rights** done in `gdpr-rights-parent-guide.md`

### 6. Branch and verification

Branch: `gdpr-rights-03-ladle-e2e`.

```bash
bun run lint
bun run typecheck
bun run stories   # DataExport / DeleteAccount / AdminDeleteAccount stories load
bun run test:e2e -- e2e/specs/auth.spec.ts
# also:
#   e2e/specs/profile.spec.ts  (GDPR entry scenario)
```

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Auth disable HTTP fails in e2e (Admin plugin / deleteUser not enabled) | Named skip with Neon Auth reason; UI + local anonymize may still partially succeed — assert what is reliable; document in DEPLOYMENT/README |
| Deleting shared `E2E_USER_*` pollutes suite | Always use disposable onboarded members for delete scenarios |
| “Distinct from subscription cancel” needs ACTIVE + two actions | Seed ACTIVE; assert billing cancel does not anonymize (separate test path or ordered steps); delete path cancels subscription as side effect |
| Export download hard to assert in Playwright | Prefer `waitForEvent('download')` + read file, or authenticated request to `?download=1`; assert JSON keys from `UserDataExport` shape |
| Accidental SEO / admin-ops scope | Tasks forbid audit, Sentry, non-GDPR admin specs |

## Migration Plan

N/A — no schema or API migrations. Stories, e2e, coverage docs, parent-guide status only (+ bugfixes found while testing).

## Open Questions

_(none blocking — routes and domain APIs shipped in steps 01–02; Neon Auth disable already documented in parent guide / DEPLOYMENT.md)_
