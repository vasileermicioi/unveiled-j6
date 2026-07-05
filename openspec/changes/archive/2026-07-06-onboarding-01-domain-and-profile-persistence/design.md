## Context

Phase 2 auth is merged: `@unveiled/db` exposes `UserProfile` and `UserBehavior` JSONB types on `public.users`; `@unveiled/auth` exposes session resolution (`getSession`), guards, and `provisionNewUser` with `onboardingComplete` derived from `profile.onboarding_complete`. No onboarding domain logic exists yet — wizard routes and middleware (steps 02–03) need shared helpers first.

Source of truth: `.dev-plan/current-iteration/onboarding-01-domain-and-profile-persistence.md`, `docs/migration/features/onboarding.feature`, `docs/migration/database/schema-overview.md` (`profile` fields, `behavior.onboarding_completed_at`, `behavior.preferences_updated_at`).

## Goals / Non-Goals

**Goals:**

- Export typed preference allowlists matching `onboarding.feature` exactly.
- Resolve the correct onboarding path (`/onboarding/age` → `/interests` → `/location` → `/timing`) from profile + behavior state.
- Validate and persist step payloads via `saveOnboardingStep`, merging into `users.profile` without clobbering unrelated fields.
- Mark completion via `completeOnboarding` with Berlin-timezone behavior timestamps.
- Unit-test step resolution, skip-age, validation rejections, and completion — no UI or route changes.

**Non-Goals:**

- HonoX routes, middleware redirects, UI components, i18n copy.
- Stripe, events feed, membership checkout logic.
- Setting `profile.language` (UI locale — separate from onboarding `preferred_languages`).
- New workspace packages.

## Decisions

### 1. Module layout

```
packages/auth/src/
├── onboarding.ts       # constants, types, getOnboardingStepPath, saveOnboardingStep, completeOnboarding
├── onboarding.test.ts  # unit tests (mock or in-memory DB where possible)
└── index.ts            # re-export public onboarding API
```

**Rationale:** Business logic stays in `@unveiled/auth` per AGENTS.md; routes in step 03 only call these helpers.

### 2. Onboarding step model

| Step key | Route segment | Profile fields written | Next step |
|---|---|---|---|
| `age` | `/onboarding/age` | `age_group` (optional) | `interests` |
| `interests` | `/onboarding/interests` | `interests[]`, `moods[]` | `location` |
| `location` | `/onboarding/location` | `districts[]`, `max_distance` | `timing` |
| `timing` | `/onboarding/timing` | `timing[]`, `preferred_days[]`, `preferred_languages[]`, `accessibility` | complete |

**Progress tracking:** Persist `behavior.onboarding_step` as the **next** step after a successful save (e.g. after age → `"interests"`). On completion, set to `null`.

**Step resolution (`getOnboardingStepPath`):** Infer current step from profile field presence when `onboarding_step` is absent (backward-compatible for users provisioned before step 01). Priority order:

1. If `onboarding_complete` → not applicable (callers skip for complete users).
2. If `behavior.onboarding_step` is set → map to path.
3. Else infer: missing age progress → `age`; age done but no interests → `interests`; interests done but no districts → `location`; else → `timing`.

**Age skip:** Accept `{ skip: true }` (or equivalent explicit skip flag in payload type) — do not require `age_group`; advance to `interests` without writing `age_group`.

### 3. Exported constants

Single source of truth arrays (readonly tuples) exported from `onboarding.ts`:

```typescript
export const AGE_GROUPS = ["18-25", "26-35", "36-50", "50+"] as const;
export const INTERESTS = ["Theater", "Kino", ...] as const;
export const MOODS = ["Leicht", "Experimentell", ...] as const;
export const DISTRICTS = ["Mitte", "X-Berg", ...] as const;
export const TIMING_OPTIONS = ["After Work", "Weekend", "Day"] as const;
export const WEEKDAYS = ["Monday", "Tuesday", ..., "Sunday"] as const;
export const PREFERRED_LANGUAGES = ["DE", "EN", "Non-Verbal"] as const;
export const MAX_DISTANCE_MIN = 1;
export const MAX_DISTANCE_MAX = 25;
```

Derive TypeScript union types from these tuples for payload typing. Reuse `AgeGroup` from `@unveiled/db` where it already matches.

### 4. Validation strategy

- **Allowlist checks:** Every array element must be in the corresponding constant set; reject unknown values before DB write.
- **`max_distance`:** Integer in `[1, 25]` inclusive; reject `0`, `26`, non-integers, null when step is `location` and not skipping.
- **Multi-select steps:** Allow empty arrays only where the feature permits optional selection; interests/moods step requires at least one of each OR document that empty is allowed only on explicit skip (match feature — step 2 expects multi-select but does not mandate minimum count; allow empty arrays for forward navigation if user submits empty form — step 03 UI may enforce UX minimums separately).
- **Errors:** Throw a typed `OnboardingValidationError` (or return `Result` discriminated union) with a stable code string for route handlers to map to flash messages in step 03.

**Alternative considered:** Zod schemas in `@unveiled/auth`. Acceptable if already a dependency; otherwise plain allowlist functions keep the package lean.

### 5. Database update pattern

```typescript
// Conceptual — single transaction per save
await db.transaction(async (tx) => {
  const [row] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
  const mergedProfile = { ...row.profile, ...stepFields };
  const mergedBehavior = {
    ...row.behavior,
    onboarding_step: nextStep,
    preferences_updated_at: berlinIsoNow(),
  };
  await tx.update(users).set({ profile: mergedProfile, behavior: mergedBehavior, updatedAt: new Date() })
    .where(eq(users.id, userId));
});
```

- **Merge, not replace:** Spread existing `profile` then overlay step fields only.
- **Never touch:** `first_name`, `last_name`, `language`, `onboarding_complete` during step saves (completion helper sets `onboarding_complete` only).
- **`completeOnboarding`:** Set `profile.onboarding_complete = true`, `behavior.onboarding_completed_at = berlinIsoNow()`, `behavior.onboarding_step = null`, update `updatedAt`.

### 6. Timestamp helper

Use `Europe/Berlin` for ISO strings stored in behavior JSONB (consistent with AGENTS.md date logic). Implement via `Intl` or a small helper (no new date library unless already in monorepo):

```typescript
function berlinIsoNow(): string {
  // e.g. format offset-aware ISO string representing Berlin local instant
}
```

### 7. `UserBehavior` type extension

Add to `packages/db/src/schema/users.ts`:

```typescript
onboarding_step?: "age" | "interests" | "location" | "timing" | null;
```

No Drizzle migration — JSONB is schemaless. Document field in `packages/db` README or inline JSDoc.

### 8. Public API surface

Export from `packages/auth/src/index.ts`:

- Constants: `AGE_GROUPS`, `INTERESTS`, `MOODS`, `DISTRICTS`, `TIMING_OPTIONS`, `WEEKDAYS`, `PREFERRED_LANGUAGES`, distance bounds.
- Types: `OnboardingStep`, step payload types, `OnboardingValidationError`.
- Functions: `getOnboardingStepPath(profile, behavior)`, `saveOnboardingStep(db, userId, step, payload)`, `completeOnboarding(db, userId)`.

Paths returned are **locale-relative** (`/onboarding/age`, not `/:locale/onboarding/age`) — middleware in step 02 prepends locale.

### 9. Testing approach

| Area | Test method |
|---|---|
| Step resolution | Pure unit tests with fixture profile/behavior objects |
| Validation | Pure unit tests for invalid interests, distance 0/26 |
| Age skip | Unit test: skip payload → next step `interests`, `age_group` unchanged |
| DB persistence | Integration test with `DATABASE_URL` (same pattern as `provision-user.test.ts`) or mocked Drizzle tx |
| Completion | Integration test: after timing save + `completeOnboarding`, flags set correctly |

Add `"test": "bun test"` script to `packages/auth/package.json` if missing.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Step inference disagrees with `onboarding_step` pointer | Prefer explicit `onboarding_step` when set; inference only as fallback for legacy rows |
| Concurrent step saves race | Use row-level `FOR UPDATE` in transaction (same pattern as future booking tx) |
| Empty multi-select on interests step | Document behavior; step 03 UI can require selections without changing domain allowlists |
| Berlin DST edge cases | Use established timezone formatting; test one winter and one summer date in unit tests |
| Tests require live DB | Skip integration tests when `DATABASE_URL` unset (match existing auth test pattern) |

## Migration Plan

1. Implement on branch `onboarding-01-domain-and-profile-persistence`.
2. No DB migration — JSONB fields added at runtime.
3. Run `cd packages/auth && bun test`, `bun run typecheck`, `bun run lint`.
4. Hand off to `onboarding-02-guard-middleware`.
5. Rollback: remove onboarding module and type field; no schema migration to revert.

## Open Questions

- None blocking step 01. Exact skip payload shape (`{ skip: true }` vs action enum) will be finalized in step 03 form handlers but must be stable in the exported payload type documented in README.
