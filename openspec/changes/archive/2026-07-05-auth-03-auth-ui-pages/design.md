## Context

Auth step 02 is merged: `/api/auth/*` forwards to `AUTH_URL`, `@unveiled/auth` resolves sessions and provisions starter state on first login. The marketing shell (`AppShell`, `GuestNavbar`, `GuestFooter`, yellow `globals.css` theme) is in place. Auth routes are listed in `docs/migration/sitemap/sitemap.md` but no pages exist yet.

`robots.txt` already disallows `/*/login`, `/*/signup`, `/*/forgot-password`, and `/*/reset-password` (added in Phase 1 in anticipation). This step implements the pages and adds per-page `noindex` meta.

Source of truth: `.dev-plan/current-iteration/auth-03-auth-ui-pages.md`, `docs/migration/features/auth.feature`, `design-tokens.md`, `docs/migration/extras/integrations-and-config.md`.

## Goals / Non-Goals

**Goals:**

- Install and configure `@better-auth-ui/heroui` + `@better-auth-ui/react` + `@better-auth-ui/core` against same-origin `/api/auth`.
- Deliver four locale-prefixed SSR auth routes with HeroUI-styled forms, `noindex` SEO, DE/EN titles, and cross-links.
- Collect first/last name on signup; ensure names reach `provisionNewUser` profile fields.
- Enable Google OAuth via Neon Auth project settings; show "Continue with Google" on login and signup.
- Redirect signed-in users to `/:locale`; expose logout for step 04.

**Non-Goals:**

- Protected-route middleware, authenticated navbar, login redirect for gated pages (step 04).
- Onboarding flow redirect after signup (Phase 3).
- GDPR export/deletion, Stripe checkout.
- `@better-auth-ui/shadcn` or shadcn/ui.
- Apple OAuth.

## Decisions

### 1. SSR route + client island split

Each auth page follows the existing HonoX pattern:

```
apps/web/app/routes/[locale]/login.tsx     → SSR shell: title, robots, cross-links, AuthPageLayout
apps/web/app/islands/AuthSignIn.tsx        → client: AuthProvider + SignIn
```

Same pattern for signup, forgot-password, reset-password islands (`AuthSignUp`, `AuthForgotPassword`, `AuthResetPassword`).

**Rationale:** Auth forms require client interactivity (validation, OAuth redirects, session hooks). HonoX islands are the established pattern (`FaqAccordion`, `CookieConsentBanner`). Route files stay thin — data + `c.render()` only.

**Alternative considered:** Single dynamic `/auth/[path]` route with `Auth path={path}`. Rejected — iteration spec requires distinct routes (`/login`, `/signup`, etc.) with localized URLs and per-page SEO/copy.

### 2. Auth client and provider

```typescript
// apps/web/app/lib/auth-client.ts
import { createAuthClient } from "@better-auth-ui/react";

export const authClient = createAuthClient({
  baseURL: "/api/auth", // same-origin proxy → AUTH_URL
});
```

```typescript
// apps/web/app/components/AuthProvider.tsx (or island-local wrapper)
import { AuthProvider } from "@better-auth-ui/heroui";

export function AppAuthProvider({ locale, children }) {
  const redirectTo = `/${locale}`;
  const navigate = ({ to, replace }) => {
    replace ? window.location.replace(to) : (window.location.href = to);
  };
  return (
    <AuthProvider
      authClient={authClient}
      redirectTo={redirectTo}
      socialProviders={["google"]}
      navigate={navigate}
      // signup field config — see §4
    >
      {children}
    </AuthProvider>
  );
}
```

Mount `AuthProvider` inside each auth island (not globally) to avoid wrapping marketing pages with auth context overhead.

**Alternative considered:** Global provider in `_renderer.tsx`. Rejected — unnecessary React Query / auth context on every marketing page.

### 3. HeroUI auth components per route

| Route | Island component | better-auth-ui view |
|---|---|---|
| `/:locale/login` | `AuthSignIn` | `SignIn` |
| `/:locale/signup` | `AuthSignUp` | `SignUp` |
| `/:locale/forgot-password` | `AuthForgotPassword` | `ForgotPassword` |
| `/:locale/reset-password` | `AuthResetPassword` | `ResetPassword` (reads `token` from query string) |

Wrap each form in a bordered `Card` / `Surface` matching marketing page cards (theme tokens — no ad-hoc Tailwind colors).

Add `@import "@better-auth-ui/heroui/styles"` after `@import "@heroui/styles"` in `globals.css`.

### 4. Signup first/last name → provisioning

- Configure `AuthProvider` / `SignUp` with additional signup fields for first name and last name (Better Auth UI `additionalFields` or equivalent signup config).
- On signup, send names to Better Auth as user metadata — prefer setting `name` to `"${firstName} ${lastName}"` so existing `provisionNewUser` `parseName()` in `@unveiled/auth` extracts profile fields without package changes.
- If Better Auth stores separate custom fields, extend first-session provisioning in `@unveiled/auth` only if `parseName()` is insufficient — prefer the combined `name` field first to minimize scope.

Client-side validation (before server contact, per `auth.feature`):

- Email: valid format
- Password: minimum 6 characters
- First name and last name: non-empty

Library defaults may cover some rules; verify and supplement via AuthProvider validation config if needed.

### 5. Page layout and cross-links

Create `AuthPageLayout` component (`apps/web/app/components/AuthPageLayout.tsx`):

- HeroUI `Heading` (page title — localized DE/EN)
- Optional `Paragraph` helper text
- Island slot for the form
- Footer cross-links using HeroUI `Link` with localized paths:
  - Login: link to signup, forgot-password
  - Signup: link to login
  - Forgot-password: link to login

Copy strings in a small `apps/web/app/lib/auth-content.ts` map keyed by locale (minimal — form labels from library where sufficient).

### 6. SEO and robots

Each route passes render options:

```typescript
return c.render(<AuthPageLayout ... />, {
  locale,
  title: meta.title,
  description: meta.description,
  canonicalPath: pathname,
  robots: "noindex",
});
```

`_renderer.tsx` already supports `robots` meta — no structural change needed.

Verify `robots.txt.ts` disallow rules remain correct (already present — no code change expected unless audit finds gaps).

### 7. Redirects and logout

- **Post sign-in / sign-up success:** `AuthProvider` `redirectTo={`/${locale}`}` — home for Phase 2.
- **Reset password success:** redirect to `/${locale}/login` (configure via AuthProvider or component callback).
- **Logout:** export `authClient.signOut()` wrapper in `auth-client.ts` (or re-export from `@better-auth-ui/react` hooks doc) for step 04 navbar; optional SSR POST route deferred to step 04 if client signOut suffices.

### 8. Google OAuth

- Enable Google provider in Neon Auth project dashboard (client ID/secret configured there — **no app env vars** per `integrations-and-config.md`).
- Set `socialProviders={["google"]}` on `AuthProvider`.
- OAuth callback handled by Neon Auth backend; session cookie set via existing proxy (step 02).
- Document Neon dashboard steps in `DEPLOYMENT.md` under a "Google OAuth (Neon Auth)" subsection.

### 9. Reset-password token

`reset-password.tsx` SSR loader reads `token` query param from URL; pass to island as prop. `ResetPassword` component consumes token per better-auth-ui API. Missing/invalid token shows library error state.

### 10. Already-authenticated visitors

Optional SSR guard: if `getSession(c)` returns a session, redirect to `/${locale}` before rendering login/signup forms. Improves UX; not blocking if deferred to step 04.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| better-auth-ui expects TanStack Query globally | AuthProvider may bundle internal QueryClient — scope provider to auth islands only; add `@tanstack/react-query` if library requires explicit provider |
| Signup names not reaching DB profile | Test end-to-end: signup → check `public.users.profile.first_name/last_name`; adjust Better Auth field mapping or provisioning |
| Google OAuth misconfigured in Neon | Document dashboard steps; staging manual test before merge |
| Theme clash between better-auth-ui styles and Uber reskin | Import heroui auth styles after HeroUI base; tune via `@layer components` in `globals.css` if needed |
| Client-only forms fail SSR-first rule | Routes are SSR pages with form shell in HTML; island hydrates interactive form — matches "islands only where unavoidable" rule |
| Reset-password link locale mismatch | Configure Neon Auth reset email redirect URL to include locale or use locale-agnostic reset route that reads token only |

## Migration Plan

1. Branch `auth-03-auth-ui-pages`.
2. `cd apps/web && bun add @better-auth-ui/heroui@latest @better-auth-ui/react@latest @better-auth-ui/core@latest`.
3. Add auth styles import to `globals.css`.
4. Implement auth client, provider, layout, islands, and four routes.
5. Enable Google OAuth in Neon Auth staging project.
6. Run `bun run lint` && `bun run typecheck`.
7. Manual verification: signup, login, forgot-password, Google OAuth, reset-password token flow.
8. Update `DEPLOYMENT.md` with Google OAuth notes.
9. Deploy to staging; hand off to step 04.

## Open Questions

- None blocking. If `better-auth-ui` requires `@tanstack/react-query` as peer dependency, add it to `apps/web` during implementation.
