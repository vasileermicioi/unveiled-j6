## ADDED Requirements

### Requirement: App users table

The system SHALL store application user records in `public.users` with `id` matching the Better Auth user id from Neon Auth, separate from Neon Auth's managed auth tables. Drizzle SHALL NOT model the `neon_auth` schema.

#### Scenario: Users table exists after migration

- **WHEN** auth step 01 migrations have been applied
- **THEN** `public.users` exists with columns `id`, `email`, `email_verified`, `role`, `credits`, `partner_id`, `profile`, `behavior`, `created_at`, `updated_at`, and `deleted_at`

#### Scenario: Role enum constraint

- **WHEN** a row is inserted into `public.users`
- **THEN** `role` accepts only `USER`, `ADMIN`, or `PARTNER`

#### Scenario: Credits non-negative

- **WHEN** a row is inserted or updated in `public.users`
- **THEN** `credits` is constrained to be greater than or equal to zero

### Requirement: Subscriptions table

The system SHALL store subscription state in a 1:1 `public.subscriptions` table keyed by `user_id` referencing `public.users.id`.

#### Scenario: Subscriptions table exists after migration

- **WHEN** auth step 01 migrations have been applied
- **THEN** `public.subscriptions` exists with `user_id` FK to `public.users.id` and a `status` enum including `INACTIVE`

### Requirement: Typed database client export

The `@unveiled/db` package SHALL export a typed Drizzle client and schema symbols consumable by `@unveiled/auth` and route handlers without importing from `apps/web`.

#### Scenario: Package import from future auth package

- **WHEN** `@unveiled/auth` imports `createDb` (or equivalent) from `@unveiled/db`
- **THEN** TypeScript resolves the client with typed `users` and `subscriptions` tables
