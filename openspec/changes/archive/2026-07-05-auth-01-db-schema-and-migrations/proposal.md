## Why

Phase 2 auth requires a real Postgres backing store for application user records separate from Neon Auth's managed Better Auth tables. Without `@unveiled/db`, later auth steps cannot provision `public.users` rows, track subscription state, or expose a typed client to `@unveiled/auth` and route handlers.

## What Changes

- Create `packages/db` (`@unveiled/db`) with Drizzle ORM, Neon serverless driver, and shared `@unveiled/config` presets.
- Define Drizzle schema for `public.users` and `public.subscriptions` only — **no `neon_auth` schema modeling**.
- `users.id` stores the Better Auth user id from Neon Auth (same value as session API); relationship enforced in app code, not via Drizzle FK to `neon_auth`.
- Generate initial migration SQL under `packages/db/drizzle/` and wire root `db:generate` / `db:migrate` scripts (already stubbed).
- Export typed Drizzle client, table symbols, and enums for downstream `@unveiled/auth` consumption.
- **Out of scope:** Neon Auth proxy, session middleware, auth UI, signup hooks, route protection, `partners`/events tables, seed script, Stripe webhooks.

## Capabilities

### New Capabilities

- `authentication`: App-level user and subscription persistence in `public.users` and `public.subscriptions`, typed `@unveiled/db` client export, and Drizzle migration tooling scoped to the `public` schema.

### Modified Capabilities

- `platform-foundation`: Expand Phase 2 package scope to include `packages/db`; add requirements for root `db:generate` and `db:migrate` scripts delegating to `@unveiled/db`.

## Impact

- **New package:** `packages/db/` — schema, client, drizzle config, migration SQL, package scripts (`generate`, `migrate`, `typecheck`).
- **Dependencies:** `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless` (via root catalog where applicable); workspace links `@unveiled/db`.
- **Environment:** `DATABASE_URL` required for migration runs (document in package README; full env table updated in auth step 02+).
- **Downstream:** Consumed by `auth-02-neon-auth-and-session-layer`; no changes to `apps/web` except workspace resolution if Bun requires explicit dependency wiring.
- **Branch:** `phase-2-auth` or `auth-01-db-schema-and-migrations` per iteration convention.
