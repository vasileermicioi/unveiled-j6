## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/gdpr-rights-02-member-and-admin-ui.md`, parent guide Auth disable handoff, `proposal.md` / `design.md`, and GDPR scenarios in `docs/product/features/auth.feature` + `profile.feature`
- [x] 1.2 Confirm `buildUserDataExport` / `anonymizeUserAccount` exports from `@unveiled/db`; locate profile entry links (`ProfilePage`) and Membership HQ detail mutation links; skim `BillingCancelPage` + `AdminFreezeForm` as SSR confirm patterns

## 2. Auth disable + shared route helpers

- [x] 2.1 Implement concrete `DisableAuthUserFn` against `AUTH_URL` (prefer Admin `remove-user`; fallback `ban-user` + email wipe to `deleted-{userId}@deleted.local`) in `apps/web/app/lib/disable-auth-user.ts` (or thin `@unveiled/auth` helper if cleaner)
- [x] 2.2 Add `apps/web/app/lib/gdpr-route.ts` — wire `buildUserDataExport`, `anonymizeUserAccount` with `disableAuthUser` + billing `cancelSubscriptionAtPeriodEnd` inject; map `GdprError` codes to locale copy; helper to clear session cookies / proxy sign-out on member delete success

## 3. Member GDPR pages

- [x] 3.1 Add DE/EN copy for export + delete (titles, irreversible warning, CTAs, errors) in `profile-content` and/or `gdpr-content`
- [x] 3.2 Build `/:locale/profile/data-export` — explainer GET + download response (`?download=1` or equivalent) via `buildUserDataExport`; `noindex`; USER-only via `guardProfileRoute`
- [x] 3.3 Build `/:locale/profile/delete-account` — confirm GET + Form POST → anonymize (`actor: "self"`) → session clear → redirect home/login; surface errors on-page; HeroUI-only
- [x] 3.4 Verify profile links to export/delete resolve to working pages (already on `ProfilePage`; add Security page links only if product copy expects them there)

## 4. Admin delete-account

- [x] 4.1 Add DE/EN admin delete-account copy (warning shows member identity; confirm; errors)
- [x] 4.2 Build `/:locale/admin/users/:id/delete-account` — `guardAdminRoute` + confirm/POST → `anonymizeUserAccount` (`actor: "admin"`, `adminId` from session) → redirect to users list; do not sign out admin; `noindex`
- [x] 4.3 Link delete-account from `AdminUserDetailPage` mutation CTAs (last/destructive); add path helper if needed

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 5.2 Smoke on Auth-configured local/staging: export downloads JSON; member delete anonymizes + blocks re-login; admin delete anonymizes seed user
- [x] 5.3 Update `apps/web/DEPLOYMENT.md` with chosen Auth disable call / any Admin plugin ops; mark step 02 done in `gdpr-rights-parent-guide.md`; do not add Ladle/Playwright (step 03)
