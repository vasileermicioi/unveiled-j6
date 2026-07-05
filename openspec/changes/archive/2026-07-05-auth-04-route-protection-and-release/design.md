## Context

Auth steps 01–03 are merged: `@unveiled/db` schema, `@unveiled/auth` session/guards/provisioning, `/api/auth/*` forward proxy, and four HeroUI auth pages with Google OAuth. The marketing shell (`AppShell`, `GuestNavbar`, `GuestFooter`) renders on every locale page via `_renderer.tsx`. `[locale]/_middleware.tsx` currently validates locale only — no auth checks.

`@unveiled/auth` exports `requireAuth` / `requireRole` (JSON 401/403 for API-style use) and `getSession(c)` for SSR. `apps/web/app/lib/auth-client.ts` already exports `signOut()` redirecting to `/:locale` on success. Protected routes listed in `docs/migration/sitemap/sitemap.md` do not exist yet; middleware must guard prefixes so future phases inherit protection.

Source of truth: `.dev-plan/current-iteration/auth-04-route-protection-and-release.md`, `docs/migration/features/auth.feature`, `docs/migration/extras/authorization-matrix.md`.

**Redirect policy:** Implementation plan specifies unauthenticated → `/:locale/login`. `auth.feature` mentions landing page in one scenario — Phase 2 follows the implementation plan.

## Goals / Non-Goals

**Goals:**

- SSR middleware on `[locale]/*` that redirects unauthenticated visitors from protected path prefixes to `/:locale/login`.
- Role skeleton: `USER` on `/partner` or `/admin` → redirect to `/:locale`.
- Authenticated navbar: credits placeholder from session, logout control, preserve guest login/signup CTAs when unsigned.
- Pass session from `_renderer.tsx` into `AppShell` / navbar without client-only gating for page access.
- Update `DEPLOYMENT.md` for Phase 2 staging; deploy and pass Phase 2 release gate.

**Non-Goals:**

- Onboarding incomplete-user redirect (Phase 3).
- Real partner/admin portal pages or full authorization matrix enforcement.
- GDPR profile export/delete.
- Billing-driven credits display (Phase 6 — placeholder only).
- Return-URL preservation beyond optional `?returnTo=` (nice-to-have, not blocking).

## Decisions

### 1. Middleware location and matching

Add `apps/web/app/lib/auth-middleware.ts` with pure functions; call from `[locale]/_middleware.tsx` after locale validation:

```typescript
const PROTECTED_PREFIXES = [
  "events", "saved", "bookings", "profile", "partner", "admin", "onboarding",
] as const;

const ROLE_FORBIDDEN: Record<UserRole, readonly string[]> = {
  USER: ["partner", "admin"],
  PARTNER: ["admin"], // skeleton — full matrix Phase 8/9
  ADMIN: [],
};
```

- Extract path segment after `/:locale/` (first segment only for prefix match).
- If segment is in `PROTECTED_PREFIXES` and no session → `302` to `/${locale}/login` (optional `?returnTo=${encodeURIComponent(pathname)}`).
- If session exists and segment is in `ROLE_FORBIDDEN[session.user.role]` → `302` to `/${locale}`.
- Skip auth pages (`login`, `signup`, `forgot-password`, `reset-password`) and public marketing routes — they are not in `PROTECTED_PREFIXES`.
- Use `getSessionIfConfigured(c)` so local dev without env vars still works for marketing pages.

**Rationale:** Keeps route middleware thin; testable prefix/role logic in one module. Page routes need redirects, not JSON 401 from `requireAuth`.

**Alternative considered:** Per-route `requireAuth()` on each future page. Rejected — central prefix guard matches iteration spec and protects routes before they exist.

### 2. Session in layout renderer

In `_renderer.tsx`, resolve session once per request:

```typescript
const session = await getSessionIfConfigured(c);
// pass session into AppShell → AppNavbar
```

- Do **not** mount global `AuthProvider` on marketing pages.
- Navbar receives `session: AppSession | null` as SSR prop.

**Alternative considered:** Client `useSession` hook for navbar. Rejected — AGENTS.md requires SSR session read; avoids flash of guest navbar.

### 3. Navbar refactor (`AppNavbar`)

Rename or compose from `GuestNavbar`:

```
AppNavbar({ locale, pathname, session })
  ├── guest branch: existing GuestNavbar content (login/signup links in drawer + desktop)
  └── authed branch: credits Chip/Badge, user menu (Profile link placeholder optional), Logout button
```

- **Credits:** Display `{session.user.credits} credits` (localized label via `getCopy`) — display-only until Phase 6.
- **Logout:** Client island `AuthUserMenu` or inline button calling `signOut()` from `auth-client.ts` (already redirects to locale home).
- **Login/signup links (guest):** `/:locale/login`, `/:locale/signup` per spec.
- HeroUI-only markup; theme classes for badge via `globals.css` if needed.

**Alternative considered:** Separate `AuthenticatedNavbar` file. Acceptable — either split files or single `AppNavbar` with branch; prefer single entry from `AppShell`.

### 4. AppShell update

```typescript
export function AppShell({ locale, pathname, session, children }) {
  return (
    <Surface ...>
      <AppNavbar locale={locale} pathname={pathname} session={session} />
      ...
    </Surface>
  );
}
```

Update `_renderer.tsx` to pass `session`. Auth pages keep using `AppShell` — middleware does not block login/signup.

### 5. Logout flow

Reuse existing helper:

```typescript
// apps/web/app/lib/auth-client.ts
export async function signOut(): Promise<void> {
  await authClient.signOut({ fetchOptions: { onSuccess: () => window.location.replace(`/${locale}`) } });
}
```

Wire from navbar island/button. Post-logout protected prefix access should hit middleware → login redirect (verification scenario).

### 6. DEPLOYMENT.md updates

- Elevate Phase 2 intro: `DATABASE_URL` and `AUTH_URL` **required** on staging before auth demo.
- Add **Test user** subsection: signup on staging, expected starter state (17 credits, USER, INACTIVE).
- Consolidate Google OAuth checklist (partially present from step 03).
- Add Phase 2 **release gate** checklist mirroring verification scenarios.
- Update staging URL table when operator sets Railway URL.

### 7. Typecheck and deploy

- Root `typecheck` already runs `bun run --filter '*'` — `@unveiled/auth` included if package has `typecheck` script. Verify `packages/auth/package.json` script exists.
- Staging deploy: existing `.github/workflows/deploy-staging.yml`; ensure Railway service has `DATABASE_URL`, `AUTH_URL`, `SITE_URL`.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Middleware runs before env configured locally | `getSessionIfConfigured` skips DB/auth when vars missing; protected redirect only when auth is configured |
| Prefix guard blocks public `/events/:id` in Phase 4 | Public event detail is `/events/:id` — same prefix; may need allowlist for public detail in Phase 4. Document in Open Questions; Phase 2 guards entire `/events` prefix per iteration spec |
| Guest navbar flash if session resolved late | Resolve session in `_renderer` before render — no client hydration delay for auth state |
| `requireAuth` JSON vs redirect inconsistency | Page protection uses redirect middleware only; keep `requireAuth` for future API routes |
| Credits show stale value until Phase 6 | Acceptable — display session snapshot; refetch on navigation |

## Migration Plan

1. Implement middleware + navbar locally; verify with `DATABASE_URL` + `AUTH_URL`.
2. Run `bun run lint`, `typecheck`, `build`.
3. Merge to `main`; CI deploys staging.
4. Configure Railway env vars; run Phase 2 demo script on staging.
5. Update `DEPLOYMENT.md` staging URL and demo accounts section.

Rollback: revert middleware commit — marketing site returns to guest-only behavior; no schema changes.

## Open Questions

- **Public event detail vs member feed:** Phase 4 makes `/events/:id` public while `/events` feed stays gated. Step 04 guards all of `/events` per iteration doc; Phase 4 may need middleware allowlist for `GET /:locale/events/:id`. Track as follow-up — not blocking Phase 2.
- **Return URL:** Optional `?returnTo=` on login redirect — implement if low cost; otherwise defer to Phase 3 onboarding work.
