## Context

Onboarding step 01 is merged: `@unveiled/auth` exports `getOnboardingStepPath(profile, behavior?)` returning locale-relative paths (`/onboarding/age`, …). Phase 2 auth step 04 merged locale middleware with `evaluateAuthRedirect` — login redirect for guests, role skeleton for forbidden prefixes. `[locale]/_middleware.tsx` resolves session via `getSessionIfConfigured`, runs auth redirect, then calls `next()`. No onboarding enforcement exists yet.

`AppSession.user` currently exposes `onboardingComplete: boolean` only; step path resolution needs `UserProfile` and optional `UserBehavior` from the same `public.users` row already loaded by `getSession`.

Source of truth: `.dev-plan/current-iteration/onboarding-02-guard-middleware.md`, `docs/migration/features/onboarding.feature`, `docs/migration/sitemap/sitemap.md`.

## Goals / Non-Goals

**Goals:**

- Pure-function onboarding redirect evaluation in `apps/web/app/lib/onboarding-middleware.ts`, unit-tested against feature scenarios.
- Wire into `[locale]/_middleware.tsx` after auth redirect (only when `session` is non-null).
- Block incomplete USERs from member app prefixes; allow `/membership` and `/onboarding/*`; redirect complete USERs away from wizard to `/:locale/events`.
- PARTNER/ADMIN never enter onboarding; redirect `/onboarding/*` hits to role home stub (`/:locale`).
- Extend session payload if needed so middleware avoids extra DB reads for step path.

**Non-Goals:**

- Onboarding wizard pages and form POST handlers (step 03).
- `/events` feed page implementation (Phase 5 — redirect target may 404 until then).
- Stripe membership checkout (Phase 6).
- `returnTo` query param on onboarding redirects (auth login only).
- Client-side redirect islands.

## Decisions

### 1. Module layout and middleware order

```
apps/web/app/lib/
├── auth-middleware.ts          # existing — login + role skeleton
├── onboarding-middleware.ts    # new — onboarding completion guards
└── onboarding-middleware.test.ts

apps/web/app/routes/[locale]/_middleware.tsx
  1. validate locale
  2. getSessionIfConfigured → c.set("session")
  3. evaluateAuthRedirect → 302 if non-null
  4. evaluateOnboardingRedirect → 302 if non-null   # NEW
  5. await next()
```

**Rationale:** Auth runs first so guests never hit onboarding logic. Onboarding runs only with an established session.

### 2. Path prefix constants

```typescript
const MEMBER_APP_PREFIXES = ["events", "saved", "bookings", "profile"] as const;
const ONBOARDING_PREFIX = "onboarding";
const MEMBERSHIP_PREFIX = "membership";
const COMPLETE_USER_FEED_REDIRECT = "events"; // /:locale/events
```

Reuse `getLocalePathSegment(pathname, locale)` from `auth-middleware.ts` for first-segment extraction after locale.

**Incomplete USER rules:**

| Segment | Action |
|---|---|
| `events`, `saved`, `bookings`, `profile` | Redirect to `/${locale}${getOnboardingStepPath(profile, behavior)}` |
| `onboarding` | Allow (wizard routes step 03) |
| `membership` | Allow (post-wizard checkout destination) |
| anything else | No onboarding redirect |

**Complete USER rules:**

| Segment | Action |
|---|---|
| `onboarding` | Redirect to `/${locale}/events` |
| anything else | No onboarding redirect |

**PARTNER / ADMIN rules:**

| Segment | Action |
|---|---|
| `onboarding` | Redirect to `/${locale}` (stub home; `/partner` and `/admin` routes arrive in later phases) |
| member app prefixes | No onboarding redirect (auth role rules still apply) |

**Unauthenticated:** `evaluateOnboardingRedirect` returns `null` immediately.

### 3. Session extension for step path

Extend `SessionUser` (or add optional `onboarding` slice on `AppSession`) with `profile: UserProfile` and `behavior: UserBehavior` populated in `toSessionUser()` from the loaded `users` row:

```typescript
function toSessionUser(row: typeof users.$inferSelect): SessionUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    partnerId: row.partnerId,
    credits: row.credits,
    onboardingComplete: row.profile.onboarding_complete ?? false,
    profile: row.profile,
    behavior: row.behavior ?? {},
  };
}
```

Middleware calls:

```typescript
getOnboardingStepPath(session.user.profile, session.user.behavior)
```

**Alternative considered:** Lightweight DB helper in middleware when session lacks profile. Rejected — `getSession` already loads the full row; extending session avoids duplicate queries and keeps middleware pure aside from redirect URL construction.

### 4. Auth configured guard

Mirror `isAuthConfigured()` from auth middleware: when `DATABASE_URL` or `AUTH_URL` is missing, return `null` (no onboarding redirects in local marketing-only dev).

### 5. Public API surface

Export from `onboarding-middleware.ts`:

```typescript
export function evaluateOnboardingRedirect(options: {
  locale: Locale;
  pathname: string;
  session: AppSession;
}): string | null;
```

No Hono imports — same testability pattern as `evaluateAuthRedirect`.

### 6. Testing approach

| Case | Expected redirect |
|---|---|
| Incomplete USER → `/de/events` | `/de/onboarding/age` (default profile) |
| Incomplete USER with resumed step → `/de/bookings` | `/de/onboarding/location` (fixture behavior) |
| Incomplete USER → `/de/membership` | `null` |
| Incomplete USER → `/de/discover` | `null` |
| Complete USER → `/de/onboarding/age` | `/de/events` |
| PARTNER → `/de/onboarding/age` | `/de` |
| PARTNER → `/de/events` | `null` (onboarding middleware) |
| ADMIN → `/de/onboarding/interests` | `/de` |
| Auth env missing | `null` |

Keep existing `auth-middleware.test.ts` unchanged except fixture updates if `SessionUser` shape grows.

### 7. Integration in `_middleware.tsx`

```typescript
const session = await getSessionIfConfigured(c);
c.set("session", session);

const authRedirect = evaluateAuthRedirect({ locale, pathname, session });
if (authRedirect) return c.redirect(authRedirect, 302);

if (session) {
  const onboardingRedirect = evaluateOnboardingRedirect({ locale, pathname, session });
  if (onboardingRedirect) return c.redirect(onboardingRedirect, 302);
}

await next();
```

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `/events` 404 until Phase 5 | Acceptable — spec requires correct redirect target, not page existence |
| Session payload grows with full profile JSONB | Single row already loaded; negligible vs extra query |
| PARTNER/ADMIN stub home is `/:locale` not `/partner` | Matches auth-04 skeleton; update when portal routes land |
| Overlap with auth `onboarding` in `PROTECTED_PREFIXES` | Guests still go to login via auth middleware; signed-in USERs allowed through auth, gated by onboarding rules |
| Step inference mismatch for edge profiles | `getOnboardingStepPath` tested in step 01; middleware trusts that function |

## Migration Plan

1. Implement on branch `onboarding-02-guard-middleware`.
2. Extend `@unveiled/auth` session types + `toSessionUser` (no DB migration).
3. Add onboarding middleware module + tests; wire locale middleware.
4. Run `cd apps/web && bun test app/lib/onboarding-middleware.test.ts app/lib/auth-middleware.test.ts`, `bun run typecheck`, `bun run lint`.
5. Manual verification with live session: incomplete USER on `/de/events` → onboarding step; complete USER on `/de/onboarding/age` → `/de/events`.
6. Hand off to `onboarding-03-wizard-pages`.
7. Rollback: remove onboarding middleware call and module; revert session shape extension if needed.

## Open Questions

- None blocking step 02. When `/partner` and `/admin` routes exist, update PARTNER/ADMIN `/onboarding/*` redirect targets from `/:locale` to role-specific homes in a later change.
