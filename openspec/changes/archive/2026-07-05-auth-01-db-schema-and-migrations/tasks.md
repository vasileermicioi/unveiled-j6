## 1. Pre-flight

- [x] 1.1 Read `.dev-plan/current-iteration/auth-01-db-schema-and-migrations.md`, `proposal.md`, `design.md`, and spec deltas
- [x] 1.2 Confirm Neon Postgres project has Neon Auth enabled and `DATABASE_URL` is available for migration runs
- [x] 1.3 Confirm Phase 1 `bun run lint` and `bun run typecheck` pass on current branch

## 2. Package scaffold

- [x] 2.1 Create `packages/db/package.json` (`@unveiled/db`) with `generate`, `migrate`, and `typecheck` scripts
- [x] 2.2 Add dependencies: `drizzle-orm` (catalog), `drizzle-kit`, `@neondatabase/serverless`; devDependency on `@unveiled/config`
- [x] 2.3 Create `packages/db/tsconfig.json` extending `@unveiled/config/tsconfig.base.json`
- [x] 2.4 Create `packages/db/README.md` noting Neon Auth tables in `neon_auth` are not modeled in Drizzle

## 3. Schema implementation

- [x] 3.1 Create `packages/db/src/schema/users.ts` — `id`, `email`, `email_verified`, `role` enum, `credits` with `>= 0` check, nullable `partner_id`, `profile` JSONB, `behavior` JSONB, timestamps, `deleted_at`
- [x] 3.2 Export typed `UserProfile` (and related) interface for JSONB keys per `schema-overview.md`
- [x] 3.3 Create `packages/db/src/schema/subscriptions.ts` — 1:1 `user_id` FK, `status` enum (includes `INACTIVE`), Stripe fields, `payment_method` enum, timestamps
- [x] 3.4 Create `packages/db/src/schema/index.ts` re-exporting tables and enums
- [x] 3.5 Create `packages/db/src/index.ts` exporting `createDb(connectionString)` and schema symbols

## 4. Drizzle tooling

- [x] 4.1 Create `packages/db/drizzle.config.ts` with `public` schema only (`schemaFilter` excluding `neon_auth`)
- [x] 4.2 Run `DATABASE_URL=... bun run db:generate` and commit initial SQL under `packages/db/drizzle/`
- [x] 4.3 Verify root `db:generate` and `db:migrate` scripts invoke `@unveiled/db` via workspace filter

## 5. Validation

- [x] 5.1 Run `bun install` — workspace links `@unveiled/db` without errors
- [x] 5.2 Run `bun run lint` — passes including new package
- [x] 5.3 Run `bun run typecheck` — passes including `@unveiled/db`
- [x] 5.4 Run `DATABASE_URL=... bun run db:migrate` against Neon — confirm `public.users` and `public.subscriptions` exist
- [x] 5.5 Re-run `db:generate` — no pending drift after initial migration is committed
- [x] 5.6 Confirm no unintended changes under `apps/web` (workspace wiring only if required)

## 6. Wrap-up

- [x] 6.1 Mark step 01 done in auth parent guide when change is archived
- [x] 6.2 Hand off to `auth-02-neon-auth-and-session-layer`
