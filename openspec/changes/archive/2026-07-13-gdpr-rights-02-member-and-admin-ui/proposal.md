## Why

Step 01 shipped `buildUserDataExport` and `anonymizeUserAccount`, but members still cannot download an export or delete their account, and admins lack an assisted-erasure page. Profile already links to `/profile/data-export` and `/profile/delete-account` (404 today). This step closes the GDPR UI loop with SSR-only surfaces so step 03 can cover Ladle/Playwright.

## What Changes

- Add `/:locale/profile/data-export` — authenticated USER; synchronous JSON download via `buildUserDataExport`; `noindex`
- Add `/:locale/profile/delete-account` — confirm page + form POST → `anonymizeUserAccount` (actor `self`) → clear session → redirect home/login
- Keep/strengthen profile entry links to export and delete (already on `ProfilePage`; ensure Security/profile copy is clear)
- Add `/:locale/admin/users/:id/delete-account` — ADMIN confirm + POST → same anonymize path (actor `admin`) → redirect to users list
- Link delete-account from Membership HQ user detail
- Wire concrete `DisableAuthUserFn` against `AUTH_URL` (prefer remove-user; ban+email wipe fallback per parent guide)
- Add DE/EN content modules for irreversible-warning copy
- HeroUI-only; yellow backdrop; SSR form POST only; no client mutation modals

**Out of scope:** Ladle/Playwright (step 03); credit adjust/freeze/comp/refund; partner; hard-delete of `public.users`; new domain anonymize/export logic

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `authentication`: Add SSR GDPR pages at `/:locale/profile/data-export`, `/:locale/profile/delete-account`, and `/:locale/admin/users/:id/delete-account` (`noindex`) that perform export download and anonymizing deletion via dedicated request / form POST without client-only mutation modals; member delete ends the session and prior credentials no longer work
- `member-profile`: Require navigation from the member profile area to working data-export and account-deletion flows (upgrade from stub/MAY entry links)

## Impact

- **Code:** `apps/web` — routes under `app/routes/[locale]/profile/data-export.tsx`, `profile/delete-account.tsx`, `admin/users/[id]/delete-account.tsx`; components under `app/components/profile/` and `app/components/admin/`; content modules (`profile-content` / `admin-content` or dedicated GDPR copy); Membership HQ detail CTA; Auth disable HTTP helper wired at route/lib boundary
- **Packages:** consume existing `@unveiled/db` GDPR APIs; implement/wire `DisableAuthUserFn` HTTP in `apps/web` (or thin `@unveiled/auth` helper) — no new anonymize/export writers
- **Database:** none
- **Upstream:** Depends on `gdpr-rights-01-export-and-anonymize-domain` (merged); soft dependency on Membership HQ detail from `admin-ops-03`
- **Downstream:** Consumed by `gdpr-rights-03-ladle-e2e`
- **Docs:** step plan `.dev-plan/current-iteration/gdpr-rights-02-member-and-admin-ui.md`; mark step 02 done in `gdpr-rights-parent-guide.md` after apply; note Auth ops in `DEPLOYMENT.md` if new env/plugin steps appear; update `docs/product/` only if UI behavior diverges from `auth.feature` / `profile.feature` / sitemap
- **Out of scope:** Ladle stories; Playwright GDPR scenarios; SEO polish; Membership HQ non-delete mutations
