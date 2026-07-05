## Why

Auth step 02 merged the same-origin Better Auth proxy (`/api/auth/*`), `@unveiled/auth` session parsing, and first-login provisioning — but members still have no way to sign up, sign in, or reset a password in the app. Without branded HeroUI auth pages wired to the proxy, Phase 2 cannot be demoed and step 04 (route protection + navbar auth state) is blocked.

## What Changes

- Install `@better-auth-ui/heroui`, `@better-auth-ui/react`, and `@better-auth-ui/core` in `apps/web`; import HeroUI auth styles in `globals.css`.
- Create `auth-client.ts` with same-origin base path `/api/auth` (forwarded to `AUTH_URL` by step 02).
- Add SSR routes under `apps/web/app/routes/[locale]/`: `login.tsx`, `signup.tsx`, `forgot-password.tsx`, `reset-password.tsx` — each wrapped in `AppShell` on the yellow page background with `noindex` robots meta.
- Compose interactive auth forms via client islands using `@better-auth-ui/heroui` (`SignIn`, `SignUp`, `ForgotPassword`, `ResetPassword` or equivalent) inside an `AuthProvider` wrapper.
- Add localized page titles, helper copy (DE/EN), and cross-links between auth pages (`login` ↔ `signup` ↔ `forgot-password`).
- Wire signup to collect first name and last name; map into provisioning metadata consumed by `@unveiled/auth` `provisionNewUser`.
- Configure Google OAuth in the Neon Auth project settings (no app env vars); expose "Continue with Google" on login and signup.
- Post-success redirect: signed-in USER → `/:locale` (home); logout → `/:locale`.
- Export logout helper via auth client/hooks for step 04 navbar.
- **Out of scope:** Protected-route middleware and authenticated navbar (step 04), onboarding redirect after signup (Phase 3), GDPR profile pages, Stripe/membership checkout, `@better-auth-ui/shadcn`.

## Capabilities

### New Capabilities

<!-- None — auth UI extends existing authentication capability -->

### Modified Capabilities

- `authentication`: Add requirements for locale-prefixed auth route map, HeroUI auth UI variant, signup client-side validation, password reset flow, and Google OAuth sign-in.
- `platform-foundation`: Extend robots.txt requirement with an explicit scenario that locale-prefixed auth paths are disallowed (routes now exist; verify spec matches implementation).

## Impact

- **Dependencies:** `@better-auth-ui/heroui`, `@better-auth-ui/react`, `@better-auth-ui/core` added to `apps/web/package.json`; `@better-auth-ui/shadcn` must not be installed.
- **New routes:** `apps/web/app/routes/[locale]/login.tsx`, `signup.tsx`, `forgot-password.tsx`, `reset-password.tsx`.
- **New modules:** `apps/web/app/lib/auth-client.ts`, optional `apps/web/app/components/AuthProvider.tsx`, client island(s) under `apps/web/app/islands/` for auth form hydration.
- **Styles:** `@import "@better-auth-ui/heroui/styles"` in `apps/web/app/styles/globals.css`.
- **External config:** Google OAuth provider enabled in Neon Auth project dashboard for staging/production.
- **Documentation:** Google OAuth setup steps noted in `apps/web/DEPLOYMENT.md`.
- **Downstream:** Consumed by `auth-04-route-protection-and-release`; no protected-route redirects or navbar session UI in this step.
- **Branch:** `auth-03-auth-ui-pages` or `phase-2-auth` per iteration convention.
