# @unveiled/auth

Session parsing, role guards, and new-member provisioning for Unveiled Berlin.

## Neon Auth boundary

Better Auth runs on Neon Auth (`AUTH_URL`). This package does **not** implement Better Auth routes or model `neon_auth` in Drizzle. The web app exposes a same-origin forward proxy at `/api/auth/*` for `better-auth-ui` (step 03).

## Provisioning trigger

On **first session resolve**, when Better Auth returns a valid user but no matching `public.users` row exists, `getSession` calls `provisionNewUser` before returning `AppSession`. This is idempotent — concurrent first requests are safe.

Starter state:

- `role = USER` (never from client metadata)
- `credits = 17`
- `profile.onboarding_complete = false`
- `subscriptions.status = INACTIVE`, `plan = BASIC_BERLIN`

Email/password signup and Google OAuth first login use the same path.

## Environment (consumed by `apps/web`, not this package)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres for `public.users` / `public.subscriptions` |
| `AUTH_URL` | Neon Better Auth backend base URL (server-side session fetch) |

## Exports

- `getSession(c, { db, authUrl })` — resolve session with DB join + auto-provision
- `requireAuth`, `requireRole`, `optionalSession` — Hono middleware factories
- `provisionNewUser(db, neonAuthUser, profile?)` — idempotent starter insert
