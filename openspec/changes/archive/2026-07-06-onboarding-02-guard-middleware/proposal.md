## Why

Phase 2 auth protects routes with login and role checks but deliberately defers onboarding completion enforcement. Without middleware guards, incomplete USERs can reach member app routes (`/events`, `/saved`, `/bookings`, `/profile`) before finishing preferences, and completed USERs can re-enter the wizard — violating `onboarding.feature`. Step 01 delivered `getOnboardingStepPath` in `@unveiled/auth`; this step wires redirect behavior into locale middleware so guards are verifiable before wizard UI ships in step 03.

## What Changes

- Add `apps/web/app/lib/onboarding-middleware.ts` with `evaluateOnboardingRedirect({ locale, pathname, session })` returning a redirect URL or `null`.
- Add `apps/web/app/lib/onboarding-middleware.test.ts` covering USER incomplete, USER complete, PARTNER, and ADMIN cases from the feature file.
- Integrate onboarding evaluation into `apps/web/app/routes/[locale]/_middleware.tsx` **after** auth redirect evaluation (runs only when a session exists).
- Redirect rules:
  - **Unauthenticated:** no change (auth middleware handles login).
  - **PARTNER / ADMIN:** never redirect to onboarding; if they hit `/onboarding/*`, redirect to role home (`/partner` or `/admin` stub → `/:locale` until those routes exist).
  - **USER, `onboardingComplete === false`:** member app prefixes (`events`, `saved`, `bookings`, `profile`) → redirect to `/:locale` + `getOnboardingStepPath(...)`. Allow `/onboarding/*` and `/membership`.
  - **USER, `onboardingComplete === true`:** `/onboarding/*` → redirect to `/:locale/events`.
- Optionally extend `AppSession` / `getSession` to carry `profile` + `behavior` slices needed for step path resolution without extra DB reads in middleware.
- **Out of scope:** onboarding wizard pages and form POST handlers (step 03), `/events` page implementation (Phase 5), Stripe membership checkout (Phase 6).

## Capabilities

### New Capabilities

- _(none — middleware requirements extend existing `member-onboarding` capability)_

### Modified Capabilities

- `member-onboarding`: Add middleware requirements — block member app prefixes until onboarding complete, allow `/membership` during onboarding, redirect completed USERs away from wizard, skip onboarding for PARTNER/ADMIN.
- `authentication`: Clarify protected-route redirect requirement — incomplete USERs on member app prefixes are redirected to onboarding by onboarding middleware (evaluated after session establishment), not login.

## Impact

- **Apps:** `apps/web/app/lib/onboarding-middleware.ts` (+ tests), `apps/web/app/routes/[locale]/_middleware.tsx`.
- **Packages (optional):** `@unveiled/auth` — extend `AppSession` / `getSession` if step path needs `profile` + `behavior` beyond `onboardingComplete`.
- **Dependencies:** `@unveiled/auth` (`getOnboardingStepPath`), existing auth middleware helpers (`getLocalePathSegment`, `isAuthConfigured`).
- **Downstream:** Consumed by `onboarding-03-wizard-pages` (wizard routes assume guards are in place).
- **Verification:** `cd apps/web && bun test app/lib/onboarding-middleware.test.ts app/lib/auth-middleware.test.ts`, `bun run typecheck`, `bun run lint`; manual curl/session checks for incomplete USER on `/de/events` and complete USER on `/de/onboarding/age`.
- **Branch:** `onboarding-02-guard-middleware` per iteration convention.
