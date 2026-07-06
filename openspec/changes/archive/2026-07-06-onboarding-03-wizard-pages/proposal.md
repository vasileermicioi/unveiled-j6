## Why

Onboarding steps 01–02 delivered server-side persistence helpers (`saveOnboardingStep`, `completeOnboarding`, `getOnboardingStepPath`) and locale middleware guards that redirect incomplete USERs away from member app routes. Without wizard UI, new members cannot actually complete preferences — they hit redirect loops or dead ends. This step ships the user-visible four-step SSR wizard so a signed-up USER can finish age (skippable) → interests → location → timing and land on `/:locale/membership`.

## What Changes

- Add four locale-prefixed onboarding routes with GET (render form) and POST (save + redirect) handlers:
  - `apps/web/app/routes/[locale]/onboarding/age.tsx`
  - `apps/web/app/routes/[locale]/onboarding/interests.tsx`
  - `apps/web/app/routes/[locale]/onboarding/location.tsx`
  - `apps/web/app/routes/[locale]/onboarding/timing.tsx`
- Add shared onboarding UI:
  - `apps/web/app/components/onboarding/OnboardingLayout.tsx` — brand-yellow page shell, 4-step progress indicator, title/subtitle from i18n
  - Step form components using HeroUI `RadioGroup`, `CheckboxGroup`, `Slider`/`NumberField`, `Switch`, `Button`/`Link` with `button--primary` / `button--secondary`
- Add `apps/web/app/lib/onboarding-content.ts` — DE/EN strings from `content-i18n-inventory.md` plus option labels from `@unveiled/auth` allowlists
- POST handlers call `@unveiled/auth` save/complete helpers; age supports `skip` → interests without `age_group`; timing calls `completeOnboarding` then 302 → `/:locale/membership`
- Route-level auth: `requireAuth` + `requireRole('USER')`; complete USERs redirect to `/:locale/events` (defense in depth alongside middleware)
- Step-order enforcement on POST: reject out-of-order submissions by redirecting to resolved step via `getOnboardingStepPath`
- SEO: `robots: "noindex"` on all onboarding page renders
- Optional `apps/web/app/routes/[locale]/onboarding/index.tsx` — redirect to current step via `getOnboardingStepPath`
- **Out of scope:** Stripe checkout on `/membership` (Phase 6), `/events` feed UI (Phase 5), `/profile/preferences` edit (Phase 7), staging deploy and `DEPLOYMENT.md` (step 04)

## Capabilities

### New Capabilities

- _(none — wizard UI requirements extend existing `member-onboarding` capability)_

### Modified Capabilities

- `member-onboarding`: Add wizard route map, four SSR step forms with POST persistence, skippable age step, HeroUI-themed UI, and `noindex` SEO for onboarding pages.

## Impact

- **Apps:** `apps/web/app/routes/[locale]/onboarding/*` (4 routes + optional index), `apps/web/app/components/onboarding/*`, `apps/web/app/lib/onboarding-content.ts`
- **Packages:** `@unveiled/auth` — consumed only (no changes); `@unveiled/db` — read via session and save helpers
- **Dependencies:** Existing HeroUI form primitives; no new npm packages
- **Downstream:** Consumed by `onboarding-04-hardening-and-release` (deploy, manual QA, parent guide)
- **Verification:** `bun run typecheck`, `bun run lint`; manual full wizard + skip-age flows on `/de` and `/en`
- **Branch:** `onboarding-03-wizard-pages` per iteration convention
