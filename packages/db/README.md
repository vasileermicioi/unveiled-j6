# @unveiled/db

Drizzle ORM schema and migrations for Unveiled Berlin **public** Postgres tables.

## Neon Auth boundary

Neon Auth hosts the Better Auth backend in the same Postgres project under the `neon_auth` schema (`user`, `session`, `account`, etc.). Those tables are **managed by Neon** — do not model or migrate them with Drizzle.

`public.users.id` stores the same id as the Better Auth session API. Link records in application code at signup; there is no Drizzle FK to `neon_auth`.

## Scripts

From the repository root (requires `DATABASE_URL`):

```bash
bun run db:generate   # drizzle-kit generate
bun run db:migrate    # drizzle-kit migrate
```

## Tables (Phase 2 step 01)

- `public.users` — app user profile, role, credits, JSONB profile/behavior
- `public.subscriptions` — 1:1 subscription state keyed by `user_id`
