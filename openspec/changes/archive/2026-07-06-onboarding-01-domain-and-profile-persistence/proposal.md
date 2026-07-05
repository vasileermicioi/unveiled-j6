## Why

Phase 3 onboarding cannot ship wizard pages or redirect guards until shared server-side logic exists for preference allowlists, step resolution, and profile persistence. Phase 2 auth is merged (`@unveiled/db`, `@unveiled/auth`, session middleware, `UserProfile` JSONB); this step adds the typed domain layer that steps 02 (middleware) and 03 (SSR form POST handlers) will consume — with unit tests and no UI changes.

## What Changes

- Add `packages/auth/src/onboarding.ts` with exported preference constants, `getOnboardingStepPath`, `saveOnboardingStep`, and `completeOnboarding`.
- Add `packages/auth/src/onboarding.test.ts` covering step resolution, age skip, validation failures, and completion.
- Extend `UserBehavior` in `packages/db/src/schema/users.ts` with optional `onboarding_step` (`"age" | "interests" | "location" | "timing" | null`) — JSONB only, no migration.
- Re-export onboarding API from `packages/auth/src/index.ts`.
- Document onboarding helpers in `packages/auth/README.md`.
- **Out of scope:** HonoX routes, middleware redirects, UI components, i18n copy, Stripe, events feed, setting `profile.language` (UI locale preference).

## Capabilities

### New Capabilities

- `member-onboarding`: Server-side onboarding domain in `@unveiled/auth` — preference allowlists from `onboarding.feature`, step path resolution for incomplete USERs, validated profile merge helpers, and completion marking with behavior timestamps.

### Modified Capabilities

- _(none — no existing `openspec/specs/` capability requirements change; this introduces `member-onboarding` from scratch)_

## Impact

- **Packages:** `@unveiled/auth` (new module + tests + README); `@unveiled/db` (type-only `UserBehavior` extension).
- **Dependencies:** No new npm packages; uses existing Drizzle client from `@unveiled/db`.
- **Downstream:** Consumed by `onboarding-02-guard-middleware` (redirects) and `onboarding-03-wizard-pages` (form POST handlers).
- **Verification:** `cd packages/auth && bun test`, `bun run typecheck`, `bun run lint`.
- **Branch:** `onboarding-01-domain-and-profile-persistence` per iteration convention.
