## Why

Login and signup currently pass `socialProviders: ["google"]` to `@better-auth-ui/heroui` and the login description mentions Google, so visitors see a control for a flow that is not implemented. This first Hide Google Login step removes that offer from the auth surfaces and updates `auth.feature` so product SoT matches the screens.

## What Changes

- `createAuthProviderConfig` sets `socialProviders` to `[]` (empty array — do not omit; the library may default to Google).
- Login page copy in `auth-content.ts` (DE/EN) drops “oder Google” / “or continue with Google”. Signup copy already omits Google; leave it unless it mentions Google.
- `docs/product/features/auth.feature`: rewrite the header decision (email/password only for MVP; Google not offered because it is not implemented; Apple still out). Remove `Scenario: Sign up or log in with Google`. Replace `Scenario: Social login never creates a PARTNER or ADMIN account` with a self-service email/password scenario **or** drop it if “Sign up as a new member” already guarantees `USER` (prefer one explicit “Auth screens do not offer Google” scenario).
- `docs/product/features/admin-users.feature` header: “email/password or Google” → email/password only.
- `docs/product/product/user-journeys.md`: signup bullet is email/password only.
- Unit test in `auth-ui-config.test.ts`: `socialProviders` is `[]` for `de` and `en`.
- Out of scope (step 02): Playwright, coverage matrix, `DEPLOYMENT.md`, sitemap, `integrations-and-config.md`, `AGENTS.md`. Do not implement OAuth. Do not change Neon Auth env or `/api/auth/*` proxy.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `authentication`: Auth screens SHALL offer email/password only and MUST NOT show a Google/social control or promise Google sign-in. Product Gherkin no longer requires Google OAuth. Automated-coverage and Phase 4½ gate requirements drop Google `test.skip` as a valid skip reason (Playwright implementation is step 02).

## Impact

- **Auth UI config (`apps/web`):** `createAuthProviderConfig` in `apps/web/app/lib/auth-ui-config.ts`; `AppAuthProvider` already spreads that config into `@better-auth-ui/heroui` `AuthProvider`.
- **Copy:** `apps/web/app/lib/auth-content.ts` DE/EN login descriptions.
- **Product SoT:** `docs/product/features/auth.feature` (header + scenarios); `docs/product/features/admin-users.feature` header; `docs/product/product/user-journeys.md` signup bullet.
- **Tests:** `apps/web/app/lib/auth-ui-config.test.ts` asserts empty `socialProviders`.
- **Source brief:** `.dev-plan/current-iteration/02-hide-google-login-01-auth-surfaces.md`
- **Parent:** `.dev-plan/current-iteration/01-hide-google-login-parent-guide.md`
- **Consumed by:** `03-hide-google-login-02-docs-and-e2e`
- **Verification:** `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/auth-ui-config.test.ts`; manual check of `/de/login`, `/en/login`, `/de/signup`, `/en/signup` with `bun run dev`
