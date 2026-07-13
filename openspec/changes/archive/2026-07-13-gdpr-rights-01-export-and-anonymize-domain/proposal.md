## Why

Phase 8 GDPR rights need package-level export and anonymization before any SSR profile/admin pages land. Members must be able to download an on-demand data summary and erase PII while retaining booking/ledger rows for German accounting retention; admins must run the same anonymize path on a member’s behalf. This step ships those testable APIs (no UI yet) so step 02 can wire SSR forms only.

## What Changes

- Add synchronous `buildUserDataExport(userId)` — structured JSON summary of profile, bookings, and credit ledger suitable for later download
- Add shared `anonymizeUserAccount(userId, { actor: 'self' | 'admin', adminId? })`:
  - Replace email with a unique non-reversible placeholder; clear name/prefs in `profile`; set `deletedAt`; neutralize `behavior` PII as needed
  - Do **not** hard-delete `public.users` or cascade bookings/ledger (`ON DELETE restrict`)
  - Disable/remove Neon Auth credentials so prior login fails
  - If subscription is active/pending, cancel as part of deletion (distinct from billing-only cancel)
- Typed errors for already-deleted / missing users; guard double-delete (idempotent reject)
- Unit/integration tests with DB fixtures; Auth disable mocked at the boundary when live `AUTH_URL` is unavailable
- Export public APIs from package indexes (`@unveiled/db` + auth/billing collaborators)

**Out of scope:** SSR pages (`/profile/data-export`, `/profile/delete-account`, admin delete); Playwright; Ladle; SEO; Membership HQ non-delete mutations

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `authentication`: Add on-demand data export and account anonymization requirements (self-service and admin-assisted share one path); deletion cancels any active subscription as a side effect but remains distinct from billing-only cancel; prior credentials must no longer authenticate after anonymize

## Impact

- **Code:** `packages/db` (export builder + public.users anonymize write); `@unveiled/auth` (Neon Auth disable/remove collaborator, injectable for tests); `@unveiled/billing` (reuse cancel-at-period-end / subscription cancel as deletion side effect — no parallel cancel writer); public package exports; no `apps/web` routes or UI
- **Database:** no new tables/migrations — uses existing `users.deleted_at`, `profile`/`behavior` JSONB, bookings, `credit_ledger`, subscriptions; FKs already `ON DELETE restrict` for bookings/ledger
- **Downstream:** Consumed by `gdpr-rights-02-member-and-admin-ui` and `gdpr-rights-03-ladle-e2e`
- **Docs:** step plan in `.dev-plan/current-iteration/gdpr-rights-01-export-and-anonymize-domain.md`; mark step 01 done in `gdpr-rights-parent-guide.md` after apply; document Auth disable approach for step 02 / `DEPLOYMENT.md` if new ops steps appear; update `docs/product/` only if behavior must diverge from `auth.feature` / schema-overview Account deletion
- **Out of scope:** UI routes; Playwright / Ladle; hard-delete of `public.users`; async export jobs; Membership HQ credit/freeze/comp
