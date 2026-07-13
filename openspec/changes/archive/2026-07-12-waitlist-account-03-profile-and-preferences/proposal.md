## Why

Phase 7 members need a self-service account home before billing (step 04). Auth UI already points settings at `/:locale/profile`, and middleware already treats `profile` as a member-app prefix, but no profile routes or identity/preferences update helpers exist — members cannot view credits, edit identity, or update cultural “Vibes” after onboarding.

## What Changes

- Add package-level profile helpers in `@unveiled/auth` to update identity (`first_name`, `last_name`, email sync to `public.users`) and cultural preferences (reuse onboarding allowlists/validation; set `behavior.preferences_updated_at` without mutating `onboarding_step`).
- Add SSR routes `/:locale/profile` (credit wallet, identity form POST, nav links) and `/:locale/profile/preferences` (Vibes editor POST).
- Add HeroUI page components under `apps/web/app/components/profile/`, reusing onboarding option sets/labels from `@unveiled/auth/constants` and `onboarding-content.ts`.
- Wire change-password entry via `@better-auth-ui/heroui` (settings/security path under profile) — not a custom credential store.
- Add refill CTA → `/:locale/membership`; stub/link path for `/:locale/profile/billing` (step 04); optional GDPR entry links only (Phase 8 pages).
- Optionally add navbar account link to `/profile` if missing (app-shell expects it).
- Unit test for preference/identity update helpers (no cloud services required for pure validation paths).

**Out of scope:** `/profile/billing` Stripe portal + cancel (step 04); GDPR export/delete handlers (Phase 8); waitlist UI (step 02); Playwright / Ladle / release docs (step 05).

## Capabilities

### New Capabilities

- `member-profile`: Authenticated profile home and preferences editor — identity + credit wallet SSR page, cultural preferences (“Vibes”) SSR editor, password-change entry via Neon Auth / Better Auth UI, refill link to membership.

### Modified Capabilities

- _(none — no existing `openspec/specs/` capability requirements change; profile pages are introduced here)_

## Impact

- **Packages:** `@unveiled/auth` (new profile update module + tests; re-exports); possibly thin reuse of onboarding validation helpers.
- **App:** `apps/web` — new `profile` / `profile/preferences` routes, `components/profile/*`, auth-UI security/password island wiring; possible `AppNavbar` profile link.
- **Auth:** Session + onboarding-complete guards already cover `/profile/*`; USER required per sitemap.
- **Dependencies:** No new npm packages; uses existing `@better-auth-ui/heroui`, Drizzle, HeroUI.
- **Downstream:** Consumed by `waitlist-account-04-billing-portal-and-cancel` (billing under profile shell) and step 05 e2e.
- **Verification:** `bun run lint`, `bun run typecheck`, package unit tests for profile helpers.
- **Branch:** `waitlist-account-03-profile-and-preferences` (or `phase-7-profile-and-preferences` per iteration convention).
- **Product SoT:** `docs/product/features/profile.feature` — update only if implementation diverges.
