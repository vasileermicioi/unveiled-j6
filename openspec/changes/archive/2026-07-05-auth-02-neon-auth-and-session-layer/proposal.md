## Why

Auth step 01 created `@unveiled/db` with `public.users` and `public.subscriptions`, but the app cannot authenticate requests, resolve sessions, or provision starter member state after Neon Auth signup. Without a same-origin Better Auth proxy and `@unveiled/auth` session layer, step 03 auth UI pages and all protected routes are blocked.

## What Changes

- Create `packages/auth/` (`@unveiled/auth`) with session parsing, Hono guard middleware, and `provisionNewUser` for first-login starter state.
- Add HonoX catch-all route `apps/web/app/routes/api/auth/[...path].ts` forwarding `/api/auth/*` to `AUTH_URL` (Neon Better Auth backend) — preserve method, path suffix, body, cookies, and auth headers.
- Wire first-session provisioning: when a valid Neon Auth session exists but no `public.users` row, call idempotent `provisionNewUser` before returning `AppSession`.
- Add `apps/web/app/lib/auth.ts` thin wrapper exporting `getSession(c)` for SSR loaders.
- Add `@unveiled/auth` and `@unveiled/db` as dependencies of `apps/web`.
- **Out of scope:** Auth UI pages (`/login`, `/signup`), navbar auth state, onboarding redirects, GDPR export/deletion, `@better-auth-ui/*` install (step 03).

## Capabilities

### New Capabilities

<!-- None — all behavior extends existing authentication capability -->

### Modified Capabilities

- `authentication`: Add requirements for same-origin Better Auth forward proxy, session parsing with DB join, new-member starter provisioning, and role guard middleware.
- `platform-foundation`: Update Phase 2 package scope to include `packages/auth/` after auth step 02; document `AUTH_URL` env var in deployment docs.

## Impact

- **New package:** `packages/auth/` — `session.ts`, `guards.ts`, `provision-user.ts`, public exports.
- **New route:** `apps/web/app/routes/api/auth/[...path].ts` — forward proxy only; no Better Auth server in repo.
- **Dependencies:** `@unveiled/auth` depends on `@unveiled/db` and Hono types; `apps/web` depends on both packages. Optional `better-auth` client for session fetch (server-side only in this step).
- **Environment:** `AUTH_URL` and `DATABASE_URL` required for local verification and staging deploy.
- **Downstream:** Consumed by `auth-03-auth-ui-pages`; no auth UI or protected-route redirects in this step.
- **Branch:** `auth-02-neon-auth-and-session-layer` or `phase-2-auth` per iteration convention.
