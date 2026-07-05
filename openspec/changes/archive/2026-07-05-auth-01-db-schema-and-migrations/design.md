## Context

Phase 1 marketing site is deployed; the monorepo has `apps/web`, `packages/config`, and root scripts stubbing `db:generate` / `db:migrate` to `@unveiled/db` — but that package does not exist yet. Phase 2 auth step 01 introduces the first database layer.

Neon Auth hosts Better Auth in the same Postgres project under the `neon_auth` schema. Application business data lives in `public` tables. Drizzle manages **`public` only** — no introspection or FK modeling of `neon_auth`.

Source of truth for field shapes: `docs/migration/database/schema-overview.md` (`users`, `subscriptions`, "Auth integration note").

## Goals / Non-Goals

**Goals:**

- Scaffold `@unveiled/db` with Drizzle ORM, Neon serverless driver, Biome + shared tsconfig.
- Define `public.users` and `public.subscriptions` with enums, JSONB profile/behavior columns, DB check constraints, and 1:1 subscription FK.
- Generate and commit initial migration SQL; root scripts invoke package `generate` / `migrate`.
- Export `createDb(url)` (or equivalent), schema tables, and enum types for `@unveiled/auth`.

**Non-Goals:**

- Neon Auth proxy, session middleware, signup hooks, route guards.
- `partners`, `events`, `saved_events`, ledger, or any non-auth tables.
- `partner_id` FK to `partners` (Phase 4+).
- Drizzle FK from `users.id` to `neon_auth.user.id`.
- `scripts/seed-demo.ts`, Stripe webhooks, auth UI.

## Decisions

### 1. Package layout

```
packages/db/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── README.md
├── drizzle/              # generated SQL migrations
│   └── 0000_*.sql
└── src/
    ├── index.ts          # createDb export
    └── schema/
        ├── index.ts
        ├── users.ts
        └── subscriptions.ts
```

**Rationale:** Matches IMPLEMENTATION-PLAN monorepo layout; keeps schema modular before Phase 4+ tables arrive.

### 2. Driver and Drizzle setup

- **Driver:** `@neondatabase/serverless` with `drizzle-orm/neon-serverless` — Neon-recommended for serverless/Bun SSR.
- **Kit:** `drizzle-kit` for `generate` and `migrate`.
- **Config:** `drizzle.config.ts` targets `public` schema only; `schemaFilter: ["public"]` (or equivalent) to exclude `neon_auth`.

**Alternative considered:** `postgres.js` driver. Rejected for now — Neon docs prioritize serverless driver for edge/serverless workloads; HonoX SSR on Node still works with neon-serverless over HTTP/WebSocket.

### 3. `users` table

| Column | Drizzle type | Notes |
|---|---|---|
| `id` | `text`, PK | Better Auth / Neon Auth user id — no FK to `neon_auth` |
| `email` | `text`, unique, not null | |
| `email_verified` | `boolean`, not null, default false | |
| `role` | `pgEnum('user_role', ['USER','ADMIN','PARTNER'])` | |
| `credits` | `integer`, not null, default 0 | Check: `credits >= 0` |
| `partner_id` | `text`, nullable | No FK yet |
| `profile` | `jsonb`, not null, default `{}` | Typed TS interface with nullable keys: `first_name`, `last_name`, `age_group`, preference arrays, `language`, `onboarding_complete`, etc. |
| `behavior` | `jsonb`, not null, default `{}` | Empty object default; analytics shape from schema-overview |
| `created_at` | `timestamptz`, not null, default now | |
| `updated_at` | `timestamptz`, not null, default now | |
| `deleted_at` | `timestamptz`, nullable | GDPR soft-delete marker on user row |

**Profile JSONB:** Store onboarding and preference fields as nullable keys inside `profile` rather than normalizing columns in step 01. Include `onboarding_complete: boolean` default false in application provisioning (auth step 02), not necessarily a DB default on the JSON key.

**Credits check:** Use Drizzle `check()` constraint `credits >= 0` — matches schema-overview "Constraints worth enforcing at the DB layer".

### 4. `subscriptions` table

| Column | Drizzle type | Notes |
|---|---|---|
| `user_id` | `text`, PK + FK → `users.id` | 1:1 with user |
| `status` | `pgEnum('subscription_status', ['ACTIVE','CANCELLED_PENDING','INACTIVE','PAST_DUE','UNPAID'])` | Default `INACTIVE` for new signups (auth step 02) |
| `period_end` | `timestamptz`, nullable | |
| `plan` | `text`, nullable | e.g. `BASIC_BERLIN` when active |
| `stripe_customer_id` | `text`, nullable, unique where not null | |
| `stripe_subscription_id` | `text`, nullable, unique where not null | |
| `payment_method` | `pgEnum('payment_method', ['CARD','PAYPAL','SEPA'])`, nullable | |
| `billing_address` | `text`, nullable | |
| `created_at` | `timestamptz`, not null, default now | |
| `updated_at` | `timestamptz`, not null, default now | |

**FK:** `user_id` references `users.id` with `ON DELETE RESTRICT` — user rows are soft-deleted/anonymized, not hard-deleted (GoBD retention).

### 5. Client export

```typescript
// packages/db/src/index.ts
export function createDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
export * from "./schema";
```

Consumers pass `process.env.DATABASE_URL` at call site (apps/web middleware, `@unveiled/auth`) — no env reads inside the package.

**Alternative considered:** Singleton global client. Rejected — explicit factory simplifies testing and avoids implicit env coupling in packages.

### 6. Package scripts and root wiring

`packages/db/package.json`:

```json
{
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "typecheck": "tsc --noEmit"
  }
}
```

Root already delegates:

```json
"db:generate": "bun --filter @unveiled/db generate",
"db:migrate": "bun --filter @unveiled/db migrate"
```

`drizzle.config.ts` reads `DATABASE_URL` from environment; fails fast with clear message if unset.

### 7. Dependencies and tsconfig

- Extend `@unveiled/config/tsconfig.base.json` (non-React package).
- Pin `drizzle-orm` via root catalog (`^0.40.0`); add `drizzle-kit` and `@neondatabase/serverless` as package dev/runtime deps.
- `"type": "module"` consistent with monorepo ESM convention.

### 8. README note

Package README states: Neon Auth / Better Auth tables live in `neon_auth` and are **not** modeled in Drizzle. App code links `public.users.id` to session user id at provisioning time.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Drizzle kit introspects `neon_auth` if schema filter misconfigured | Explicit `schemaFilter: ['public']` in drizzle.config; never run `drizzle-kit pull` on Neon Auth tables |
| `profile` JSONB shape drift vs TypeScript | Export shared `UserProfile` type from schema module; auth step 02 uses same type for inserts |
| Migration fails on Neon branch without Auth enabled | Document prerequisite: Neon project with Auth enabled; use dev branch for local runs |
| `partner_id` without FK allows orphan references | Acceptable until Phase 4 `partners` table; admin partner flows not built yet |
| Root `db:generate` after initial commit shows drift | Commit generated SQL; re-run generate should produce no pending changes |

## Migration Plan

1. Implement schema and client on branch `auth-01-db-schema-and-migrations` (or `phase-2-auth`).
2. `bun install` — link workspace package.
3. `DATABASE_URL=... bun run db:generate` — produce initial SQL under `packages/db/drizzle/`.
4. Commit migration files.
5. `DATABASE_URL=... bun run db:migrate` against Neon dev branch — verify `\d public.users` and `\d public.subscriptions`.
6. Rollback: revert migration commit and drop tables manually on dev branch if needed; no production impact until auth goes live.

## Open Questions

- None blocking step 01. Optional Postgres FK to `neon_auth.user` remains out of Drizzle scope per schema-overview; revisit only if Neon documents a supported pattern.
