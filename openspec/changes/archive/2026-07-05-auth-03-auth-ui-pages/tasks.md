## 1. Pre-flight

- [x] 1.1 Read `.dev-plan/current-iteration/auth-03-auth-ui-pages.md`, `proposal.md`, `design.md`, and spec deltas
- [x] 1.2 Confirm `/api/auth/*` proxy works locally (`curl -s http://localhost:3000/api/auth/get-session`)
- [x] 1.3 Read `docs/migration/sitemap/sitemap.md` auth routes table and `docs/migration/features/auth.feature` validation scenarios
- [x] 1.4 Review `design-tokens.md` and `globals.css` for auth screen theming constraints

## 2. Dependencies and styles

- [x] 2.1 Install `@better-auth-ui/heroui@latest`, `@better-auth-ui/react@latest`, `@better-auth-ui/core@latest` in `apps/web`
- [x] 2.2 Add `@import "@better-auth-ui/heroui/styles"` to `apps/web/app/styles/globals.css` after HeroUI base import
- [x] 2.3 Add `@tanstack/react-query` if required as peer dependency by better-auth-ui
- [x] 2.4 Verify `@better-auth-ui/shadcn` is not added to `package.json`

## 3. Auth client and provider

- [x] 3.1 Create `apps/web/app/lib/auth-client.ts` — `createAuthClient({ baseURL: "/api/auth" })`
- [x] 3.2 Export `signOut` helper from auth client for step 04 navbar consumption
- [x] 3.3 Create `apps/web/app/components/AuthProvider.tsx` (or island-local wrapper) with `redirectTo`, `navigate`, and `socialProviders={["google"]}`

## 4. Shared auth UI

- [x] 4.1 Create `apps/web/app/lib/auth-content.ts` — DE/EN page titles and helper copy for auth routes
- [x] 4.2 Create `apps/web/app/components/AuthPageLayout.tsx` — HeroUI heading, helper text, form slot, localized cross-links

## 5. Client islands

- [x] 5.1 Create `apps/web/app/islands/AuthSignIn.tsx` — `AppAuthProvider` + `SignIn`
- [x] 5.2 Create `apps/web/app/islands/AuthSignUp.tsx` — `SignUp` with first/last name fields and client-side validation
- [x] 5.3 Create `apps/web/app/islands/AuthForgotPassword.tsx` — `ForgotPassword` with empty-email validation
- [x] 5.4 Create `apps/web/app/islands/AuthResetPassword.tsx` — `ResetPassword` accepting `token` prop from query string

## 6. SSR routes

- [x] 6.1 Create `apps/web/app/routes/[locale]/login.tsx` — `AuthPageLayout` + `AuthSignIn`, `robots: "noindex"`
- [x] 6.2 Create `apps/web/app/routes/[locale]/signup.tsx` — `AuthPageLayout` + `AuthSignUp`, `robots: "noindex"`
- [x] 6.3 Create `apps/web/app/routes/[locale]/forgot-password.tsx` — `AuthPageLayout` + `AuthForgotPassword`, `robots: "noindex"`
- [x] 6.4 Create `apps/web/app/routes/[locale]/reset-password.tsx` — read `token` query param, pass to `AuthResetPassword`, `robots: "noindex"`
- [x] 6.5 Optional: redirect already-authenticated visitors from login/signup to `/:locale`

## 7. Signup provisioning integration

- [x] 7.1 Wire signup first/last name into Better Auth user `name` or metadata so `provisionNewUser` populates `profile.first_name` / `profile.last_name`
- [ ] 7.2 Manual test: email signup creates session + DB row with correct starter state and name fields

## 8. Google OAuth

- [ ] 8.1 Enable Google OAuth provider in Neon Auth project settings for staging
- [x] 8.2 Verify "Continue with Google" visible on `/de/login` and `/de/signup`
- [ ] 8.3 Manual test: Google OAuth sign-in completes and provisions starter state on first login

## 9. SEO verification

- [x] 9.1 Confirm each auth page renders `<meta name="robots" content="noindex">` in View Source
- [x] 9.2 Verify `robots.txt` disallow rules for `/*/login`, `/*/signup`, `/*/forgot-password`, `/*/reset-password` (already present — audit only)

## 10. Validation

- [x] 10.1 Run `bun run lint` — passes
- [x] 10.2 Run `bun run typecheck` — passes
- [x] 10.3 Manual: `/de/login` and `/en/signup` render on yellow background with HeroUI-styled forms
- [ ] 10.4 Manual: invalid signup (bad email, short password, empty name) shows client-side validation errors
- [ ] 10.5 Manual: login with valid/invalid credentials
- [ ] 10.6 Manual: forgot-password request flow sends reset email
- [ ] 10.7 Manual: reset-password route accepts token query param and completes reset

## 11. Wrap-up

- [x] 11.1 Document Google OAuth Neon dashboard setup in `apps/web/DEPLOYMENT.md`
- [ ] 11.2 Mark step 03 done in auth parent guide when change is archived
- [x] 11.3 Hand off to `auth-04-route-protection-and-release`
