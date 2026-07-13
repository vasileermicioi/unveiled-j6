## Context

Step 01 shipped package APIs: `buildUserDataExport` and `anonymizeUserAccount` in `@unveiled/db`, with injectable `DisableAuthUserFn` and optional subscription-cancel collaborator. Profile already links to `/:locale/profile/data-export` and `/:locale/profile/delete-account` (404). Membership HQ detail ships adjust/freeze/comp/refund links but intentionally omits delete-account.

This is Phase 8 step 02 (`gdpr-rights-02-member-and-admin-ui`): SSR UI only over existing domain APIs. Product SoT: `auth.feature` (export / delete / admin-assisted), `profile.feature` (Access account deletion and data export), sitemap routes, parent guide Auth disable handoff.

## Goals / Non-Goals

**Goals:**

- Working `/:locale/profile/data-export` that returns a downloadable JSON summary for the signed-in USER.
- Working `/:locale/profile/delete-account` confirm + POST → anonymize (actor `self`) → end session → redirect.
- Working `/:locale/admin/users/:id/delete-account` confirm + POST → anonymize (actor `admin`) → redirect to users list.
- Profile + Membership HQ entry points to those flows.
- Concrete `DisableAuthUserFn` wired against `AUTH_URL` at the app boundary.
- DE/EN irreversible-warning copy; HeroUI-only; `noindex`; yellow backdrop.

**Non-Goals:**

- New anonymize/export domain logic or schema migrations.
- Ladle stories / Playwright GDPR scenarios (step 03).
- Hard-delete of `public.users` or cascade of bookings/ledger.
- Membership HQ credit/freeze/comp/refund changes.
- Partner portal.

## Decisions

### 1. Route and component layout

```
apps/web/app/routes/[locale]/profile/data-export.tsx
apps/web/app/routes/[locale]/profile/delete-account.tsx
apps/web/app/routes/[locale]/admin/users/[id]/delete-account.tsx

apps/web/app/components/profile/DataExportPage.tsx      # optional explainer + download CTA
apps/web/app/components/profile/DeleteAccountPage.tsx   # confirm + Form POST (mirror BillingCancelPage)
apps/web/app/components/admin/AdminDeleteAccountForm.tsx # confirm + Form POST (mirror AdminFreezeForm)

apps/web/app/lib/gdpr-route.ts   # shared handlers: export response, anonymize+sign-out, admin anonymize, error map
apps/web/app/lib/disable-auth-user.ts  # concrete DisableAuthUserFn (AUTH_URL HTTP)
```

Mirror existing SSR patterns:

| Surface | Guard | Pattern |
|---|---|---|
| Profile export/delete | `guardProfileRoute` | Same shape as `profile/billing/cancel.tsx` |
| Admin delete | `guardAdminRoute` + `renderAdminPage` | Same shape as `admin/users/[id]/freeze.tsx` |

**Rationale:** Keeps mutations as dedicated pages + form POST; no client-only modals.

**Alternatives:** Client download blob / modal confirm — rejected (SSR-only mutations hard rule).

### 2. Data export request flow

Prefer **GET download** for simplicity (bookmarkable, no CSRF form needed for a read):

1. `guardProfileRoute` — USER session required.
2. Call `buildUserDataExport(db, session.user.id)`.
3. On success: return `Response` with `Content-Type: application/json`, `Content-Disposition: attachment; filename="unveiled-data-export-{userId}.json"`, body `JSON.stringify(payload, null, 2)`.
4. On `USER_NOT_FOUND` / `ALREADY_DELETED`: 404 page or redirect to profile with error — prefer 404/`NotFoundPage` for deleted accounts.
5. Optional: a thin explainer page at the same path when `?download=1` is absent — **or** a page with a single Link/Button that GETs `?download=1` / posts to self. Prefer: **GET without query shows explainer + primary CTA Link to `?download=1`; GET with `download=1` streams the file.** Keeps first visit informational and matches “request from profile settings.”

Do **not** expose admin-triggered export in this step (sitemap lists member export only).

Set `robots: noindex` on the explainer render. Download response itself needs no HTML metadata.

### 3. Member delete-account flow

1. **GET:** `guardProfileRoute` → render `DeleteAccountPage` with irreversible warning copy + confirm Form POST + cancel Link back to `/profile`.
2. **POST:** `guardProfileRoute` → open tx db → `anonymizeUserAccount(txDb, { userId: session.user.id, actor: "self", disableAuthUser, cancelSubscription })`.
3. On success: **clear session cookies** then `302` to `/:locale` (or login). Session clearing is a route concern (domain does not sign out — step 01 design).
4. On `ALREADY_DELETED`: treat as success for self-service (sign out + redirect) **or** show on-page error — prefer sign-out + redirect home (account already gone).
5. On `AUTH_DISABLE_FAILED` after DB commit: show on-page error that account is closed locally; contact support if login still works (per step 01 risk mitigation). Still attempt session clear.
6. On other errors: re-render confirm page with mapped message.

**Session clear approach:**

- Prefer server-side: forward/proxy a Better Auth sign-out request (same-origin `/api/auth/sign-out` or equivalent) and forward `Set-Cookie` clearing headers on the redirect response; **or** expire known session cookies on the response.
- Do **not** rely on the client `AuthLogoutButton` island alone — POST must leave the browser without a usable session before the next page load.
- If proxy sign-out is awkward, set clearing `Set-Cookie` for the auth session cookie names used by Neon Auth / Better Auth (document cookie names found in staging) on the redirect response after anonymize succeeds.

**Rationale:** Matches `auth.feature` “signed out and can no longer log in.”

### 4. Admin delete-account flow

1. **GET:** `guardAdminRoute` → load member via `getMemberDetail`; 404 if missing; if `deletedAt` set, show already-deleted state (no POST) or redirect to users list.
2. **POST:** `anonymizeUserAccount(txDb, { userId, actor: "admin", adminId: session.user.id, disableAuthUser, cancelSubscription })`.
3. Success → `302` to `/:locale/admin/users` (list) with optional `?ok=delete-account` flash; do **not** sign out the admin.
4. Errors → re-render confirm with `AdminFormError` / mapped copy.
5. Confirm copy MUST state irreversibility and that bookings/ledger are retained anonymized.

Wire Membership HQ detail: add `delete-account` to `mutationLinks` in `AdminUserDetailPage` (destructive placement last; secondary button styling). Add path helper in `admin-tabs.ts` if other mutations have one.

### 5. Auth disable HTTP collaborator

Implement `createDisableAuthUser(env): DisableAuthUserFn` in `apps/web/app/lib/disable-auth-user.ts` (or thin export from `@unveiled/auth` if HTTP belongs there — prefer **apps/web** first to avoid pulling Workers env into packages unless a clear pattern exists).

Per parent guide / `DEPLOYMENT.md`:

1. **Primary:** Neon Auth / Better Auth Admin `remove-user` for `userId` via `AUTH_URL`.
2. **Fallback:** `ban-user` + wipe Auth email to `deleted-{userId}@deleted.local`.
3. Document Admin plugin / “Make admin” ops if required; no new env vars unless Neon requires an admin API key — then add to `DEPLOYMENT.md`.

Inject the same helper into both member and admin anonymize call sites. Pass `cancelSubscription` wrapping existing `@unveiled/billing` `cancelSubscriptionAtPeriodEnd` (same as domain tests expect).

### 6. Authz and SEO

- Export + member delete: authenticated USER only (`guardProfileRoute`); members may only act on **their own** `session.user.id` — never accept a client-supplied user id.
- Admin delete: ADMIN only; target id from URL param after guard.
- All HTML pages: `robots: "noindex"`; locale in URL; yellow page backdrop via app shell.

### 7. i18n / copy

Extend `profile-content.ts` and `admin-content.ts` (or small `gdpr-content.ts` imported by both) with DE/EN:

- Export: page title, subtitle, download CTA, back link.
- Delete (member): title, irreversible warning body, confirm submit, cancel/keep account.
- Delete (admin): title, member label, warning, confirm, back to member / users list.
- Error strings for `USER_NOT_FOUND`, `ALREADY_DELETED`, `AUTH_DISABLE_FAILED`, generic failure.

Match `docs/product/extras/content-i18n-inventory.md` if strings appear later; inventory currently has no GDPR page strings — add modules here and note inventory update only if the product doc is maintained in the same change (optional; prefer code modules as SoT for this step).

### 8. Ladle / e2e

**Out of scope this step.** Do not add stories or unskip Playwright. Step 03 owns Ladle confirm states + `auth.spec.ts` / `profile.spec.ts` GDPR scenarios.

## Risks / Trade-offs

- **[Neon Auth Admin plugin / admin session missing in staging]** → Ship HTTP helper with clear errors; document Console enablement in `DEPLOYMENT.md`; anonymize DB first so PII is gone even if Auth disable fails (`AUTH_DISABLE_FAILED` UX).
- **[Session cookie names differ between Neon hosted Auth and local]** → Verify clearing against staging cookies; prefer proxying `/api/auth/sign-out` so cookie clearing stays provider-owned.
- **[GET export as attachment may surprise in-browser]** → Explainer page + explicit download CTA; filename in `Content-Disposition`.
- **[Admin deletes wrong user]** → Confirm page shows email/display name; POST uses URL id only after ADMIN guard; no bulk delete.
- **[Double-submit delete]** → Second POST → `ALREADY_DELETED`; self-service treats as signed-out success; admin shows already-deleted / redirects.
- **[Soft dependency on Membership HQ]** → Page works via direct URL even if detail CTA lands later; still add the link now that HQ exists.

## Migration Plan

1. Implement `disable-auth-user` helper + `gdpr-route` wiring (`buildUserDataExport`, `anonymizeUserAccount`, billing cancel inject).
2. Add profile export + delete routes/components + copy.
3. Add admin delete-account route/component + Membership HQ link.
4. Update `DEPLOYMENT.md` Auth disable checklist if ops steps change; smoke export + delete on Auth-configured env.
5. Mark step 02 done in `gdpr-rights-parent-guide.md` after merge.
6. No DB migration. Rollback = remove routes/links; domain APIs remain.

## Open Questions

- None blocking apply. At apply time, confirm which Better Auth Admin path (`remove-user` vs `ban-user`) works against current Neon Auth `AUTH_URL` and record the chosen call in `DEPLOYMENT.md`.
