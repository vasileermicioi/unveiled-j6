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

## Profile API (Phase 7 step 03)

Post-onboarding account helpers for identity and cultural preferences (“Vibes”). Routes stay thin — call these from SSR form POSTs.

**Identity — `updateProfileIdentity(db, userId, { first_name, last_name, email }, options?)`:**

- Merges names into `users.profile.first_name` / `last_name` (trimmed, required).
- Normalizes email (trim + lowercase), enforces uniqueness on `public.users.email`.
- Does **not** model `neon_auth` in Drizzle.
- Optional `options.syncAuthEmail({ newEmail, previousEmail })`: when email changes, the web app should forward a Better Auth / Neon Auth `change-email` (or equivalent) request with the member’s session cookie. On sync failure the helper **reverts** `public.users` email/profile and throws `ProfileValidationError` with code `auth_email_sync_failed` (fail closed — no split-brain).

**Preferences — `updateCulturalPreferences(db, userId, payload)`:**

- Validates via the same onboarding allowlists (`validateOnboardingStepPayload` for interests / location / timing fields).
- Merges preference fields into `users.profile` and sets `behavior.preferences_updated_at` via `berlinIsoNow()`.
- Does **not** mutate `behavior.onboarding_step` or `profile.onboarding_complete`.

**Errors:** `ProfileValidationError` with stable `code` strings for route flash mapping.

**Password change:** not handled here — use `@better-auth-ui/heroui` `ChangePassword` / `SecuritySettings` on `/:locale/profile/security`.
