## Why

Steps 01–02 shipped export/anonymize domain logic and SSR member/admin GDPR pages, but Ladle confirm/export states are missing and `auth.spec.ts` still hard-skips all four GDPR scenarios with “Phase 9 — … not built.” Without this close-out, **gdpr-rights** is not releasable into Phase 8 audit and silent/outdated skips remain instead of pass or named deferrals.

## What Changes

- Add Ladle stories for GDPR UI states: `DataExportPage` (ready + empty/minimal if distinct), `DeleteAccountPage` (confirm + error), and `AdminDeleteAccountForm` (confirm + error) under `apps/web/app/components/profile/` and `apps/web/app/components/admin/`.
- Implement (prefer) or named-defer the four GDPR scenarios in `e2e/specs/auth.spec.ts` with verbatim Gherkin titles; ensure `profile.spec.ts` “Access account deletion and data export” stays green (entry links + light page reach if useful — full mechanics live in auth.spec).
- Update `docs/product/testing/coverage-matrix.md` and `e2e/README.md` so GDPR rows are `pass` / env `skip` / named deferral owned only by Neon Auth / harness limits or `seo-launch-polish-03` — never “not built” / “Phase 9”.
- Mark step 03 and parent **gdpr-rights** done in the parent guide after verification; forward any named deferrals to `seo-launch-polish-03`.

**Out of scope:** Full MVP audit / SEO / Sentry (`seo-launch-polish-*`); admin non-GDPR e2e (already `admin-ops-05`); partner scenarios; new product routes or domain writers beyond bugfixes found while testing.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `bdd-and-e2e`: Cover `auth.feature` GDPR scenarios (export, deletion, admin-assisted deletion, distinct from subscription cancel) in Playwright with verbatim titles; assert profile entry points from `profile.feature`; no silent skips after gdpr-rights hardening.
- `authentication`: Close GDPR e2e for shipped export/delete SSR surfaces — scenarios SHALL pass or be named-deferred with Neon Auth / env / harness reasons only.
- `member-profile`: Require Ladle coverage for profile GDPR confirm/export compositions and keep profile entry-link scenario passing (mechanics verified via auth.spec).

## Impact

- **E2E:** updates to `e2e/specs/auth.spec.ts`, `e2e/specs/profile.spec.ts`; thin fixtures only if needed; `e2e/README.md`.
- **UI stories:** `DataExportPage.stories.tsx`, `DeleteAccountPage.stories.tsx`, `AdminDeleteAccountForm.stories.tsx` (co-located).
- **Docs:** `coverage-matrix.md`; mark `gdpr-rights-parent-guide.md` step 03 / feature done; optional note of named deferrals for `seo-launch-polish-03`.
- **Product SoT:** `docs/product/features/{auth,profile}.feature` unchanged unless a bugfix forces alignment.
- **Depends on:** `gdpr-rights-02-member-and-admin-ui` (merged/archived).
- **Consumed by:** `seo-launch-polish-03-mvp-audit-and-cutover` (closes gdpr-rights).
- **Branch:** `gdpr-rights-03-ladle-e2e`.
- **Verification:** `bun run lint`, `bun run typecheck`, Ladle GDPR stories load, focused `bun run test:e2e` on auth/profile GDPR scenarios — green or only named deferrals.
