## 1. Setup

- [x] 1.1 Confirm prerequisites exist: `apps/web/app/lib/auth-ui-config.ts`, `apps/web/app/lib/auth-content.ts`, `apps/web/app/components/AppAuthProvider.tsx`, `docs/product/features/auth.feature`, `apps/web/app/lib/auth-ui-config.test.ts`
- [x] 1.2 Skim `.dev-plan/current-iteration/01-hide-google-login-parent-guide.md` for release criteria and non-goals (no OAuth implementation, no Neon/proxy changes, Playwright is step 02)

## 2. Auth surfaces

- [x] 2.1 Set `socialProviders` to `[]` in `createAuthProviderConfig`; remove unused `SocialProvider` import if Biome/typecheck allow (keep a typed empty array only if required)
- [x] 2.2 Update DE/EN login descriptions in `auth-content.ts` to email/password only (`Melde dich mit E-Mail und Passwort an.` / `Sign in with email and password.`); leave signup copy unless it mentions Google
- [x] 2.3 Extend `auth-ui-config.test.ts` to assert `socialProviders` is `[]` for both `de` and `en`; run `cd apps/web && bun test app/lib/auth-ui-config.test.ts`

## 3. Product SoT

- [x] 3.1 Rewrite `docs/product/features/auth.feature` header: email/password only for MVP; Google not offered because it is not implemented; Apple still out
- [x] 3.2 Remove `Scenario: Sign up or log in with Google` and `Scenario: Social login never creates a PARTNER or ADMIN account`; add `Scenario: Auth screens do not offer Google`
- [x] 3.3 Update `docs/product/features/admin-users.feature` header (“email/password or Google” → email/password only) and `docs/product/product/user-journeys.md` signup bullet to email/password only

## 4. Cleanup and verification

- [x] 4.1 Mark `02-hide-google-login-01-auth-surfaces` done in `.dev-plan/current-iteration/01-hide-google-login-parent-guide.md` (step 02 remains open)
- [x] 4.2 Run `bun run lint` — exits 0
  <!-- Touched files pass `biome check`. Full-repo `bun run lint` still fails on pre-existing drizzle snapshot format (`packages/db/drizzle/meta/*`), not this change. -->
- [x] 4.3 Run `bun run typecheck` — exits 0
- [x] 4.4 Re-run `cd apps/web && bun test app/lib/auth-ui-config.test.ts` — exits 0; includes `socialProviders` is `[]`
- [x] 4.5 With `bun run dev`, open `/de/login`, `/en/login`, `/de/signup`, `/en/signup` — no Google / “Continue with Google” / “Weiter mit Google” control; login description does not mention Google
