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

## Onboarding API (Phase 3 step 01)

Domain helpers for the four-step preference wizard. Paths returned by `getOnboardingStepPath` are **locale-relative** (e.g. `/onboarding/age`); middleware in step 02 prepends `/:locale`.

**Step order:** age → interests → location → timing → `completeOnboarding`.

**Allowlists:** `AGE_GROUPS`, `INTERESTS`, `MOODS`, `DISTRICTS`, `TIMING_OPTIONS`, `WEEKDAYS`, `PREFERRED_LANGUAGES`; `max_distance` is 1–25 km.

**Age skip:** POST payload `{ skip: true }` advances to interests without writing `age_group`.

**Progress pointer:** `behavior.onboarding_step` stores the **next** step after a successful save (`"interests"` after age, etc.); cleared on completion. JSONB-only — no migration.

**Timestamps:** `preferences_updated_at` and `onboarding_completed_at` use ISO strings with Europe/Berlin offset via `berlinIsoNow()`.

**Functions:**

- `getOnboardingStepPath(profile, behavior?)` — resolve wizard path for incomplete users
- `validateOnboardingStepPayload(step, payload)` — allowlist validation (throws `OnboardingValidationError`)
- `saveOnboardingStep(db, userId, step, payload)` — merge into `users.profile`, update behavior
- `completeOnboarding(db, userId)` — set `onboarding_complete` and completion timestamp
