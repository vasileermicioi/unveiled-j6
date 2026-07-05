## 1. Pre-flight

- [x] 1.1 Read `.dev-plan/current-iteration/auth-02-neon-auth-and-session-layer.md`, `proposal.md`, `design.md`, and spec deltas
- [x] 1.2 Confirm `@unveiled/db` migrations applied and `public.users` / `public.subscriptions` exist
- [x] 1.3 Confirm `AUTH_URL` and `DATABASE_URL` available locally (`.env` from Neon)
- [x] 1.4 Read `docs/migration/features/auth.feature` signup and Google OAuth provisioning scenarios
- [x] 1.5 Read `docs/migration/extras/authorization-matrix.md` role model

## 2. Package scaffold

- [x] 2.1 Create `packages/auth/package.json` (`@unveiled/auth`) with `typecheck` script and exports
- [x] 2.2 Add dependencies: `@unveiled/db` (workspace), `hono` (types/runtime as needed); devDependency on `@unveiled/config`
- [x] 2.3 Create `packages/auth/tsconfig.json` extending `@unveiled/config/tsconfig.base.json`
- [x] 2.4 Create `packages/auth/README.md` documenting provisioning trigger (first session resolve) and env expectations

## 3. Session and provisioning

- [x] 3.1 Create `packages/auth/src/session.ts` — `SessionUser`, `AppSession` types; `getSession` fetching `AUTH_URL/get-session` with forwarded cookies (not loopback to `/api/auth`)
- [x] 3.2 Join `public.users` by Neon Auth user id; map `role`, `credits`, `partnerId`, `profile.onboarding_complete`
- [x] 3.3 Create `packages/auth/src/provision-user.ts` — `provisionNewUser(db, neonAuthUser, profile?)` with idempotent insert of `users` + `subscriptions` starter state
- [x] 3.4 Wire provisioning in `getSession`: if valid Neon Auth session but no DB row, call `provisionNewUser` then re-query user
- [x] 3.5 Create `packages/auth/src/guards.ts` — `requireAuth`, `requireRole(...roles)`, `optionalSession` Hono middleware factories
- [x] 3.6 Create `packages/auth/src/index.ts` exporting public API

## 4. Web app wiring

- [x] 4.1 Add `@unveiled/auth` and `@unveiled/db` to `apps/web/package.json` workspace dependencies
- [x] 4.2 Add same-origin auth forward proxy (`apps/web/app/lib/auth-proxy.ts`, registered in `app/server.ts` before locale routes — `/api/auth/*` would otherwise match `/:locale/*`)
- [x] 4.3 Pass through response status, body, and `Set-Cookie` headers from Better Auth backend
- [x] 4.4 Create `apps/web/app/lib/auth.ts` — db factory + `getSession(c)` wrapper for SSR loaders
- [x] 4.5 Fail fast when `AUTH_URL` is unset in proxy handler (503 with clear message)

## 5. Validation

- [x] 5.1 Run `bun install` — workspace links `@unveiled/auth` without errors
- [x] 5.2 Run `bun run lint` — passes including new package and routes
- [x] 5.3 Run `bun run typecheck` — passes including `@unveiled/auth` and `apps/web`
- [x] 5.4 With dev server running, `curl -s http://localhost:3000/api/auth/get-session` returns forwarded Better Auth JSON (not HTML 404)
- [x] 5.5 Manual or integration test: after Neon Auth creates a user, `public.users` has `credits=17`, `role=USER`, `profile.onboarding_complete=false`, and linked `subscriptions.status=INACTIVE`
- [x] 5.6 Verify `requireAuth` returns 401 when invoked without session (unit test or manual Hono invoke)

## 6. Wrap-up

- [x] 6.1 Verify `apps/web/DEPLOYMENT.md` documents `AUTH_URL` proxy behavior accurately
- [x] 6.2 Mark step 02 done in auth parent guide when change is archived
- [x] 6.3 Hand off to `auth-03-auth-ui-pages`
