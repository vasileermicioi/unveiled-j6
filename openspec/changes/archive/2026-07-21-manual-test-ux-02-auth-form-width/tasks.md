## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-ux-02-auth-form-width.md`, parent guide, and this change’s `design.md` / `specs/authentication/spec.md`
- [x] 1.2 On `/en/signup`, compare computed widths of `PageSectionHeader`, `AuthFormFallback` card, and hydrated better-auth-ui form/card (devtools)
- [x] 1.3 Inventory width hooks: `AuthPageLayout.tsx` column (`max-w-lg`), `.auth-form` in `globals.css`, `AuthFormFallback`, islands `AuthSignUp` / `AuthSignIn` / `AuthForgotPassword` / `AuthResetPassword`

## 2. Width alignment

- [x] 2.1 Define a single auth content-width class or keep one shared column measure for header + form (theme or `AuthPageLayout`)
- [x] 2.2 Override conflicting better-auth-ui / HeroUI card `max-width` so `.auth-form` (and nested card if needed) fills the auth column at `width: 100%` — do not fork `@better-auth-ui/*`
- [x] 2.3 Ensure `AuthFormFallback` outer border box matches the hydrated form width (same classes / box model)
- [x] 2.4 Smoke `/en/login`, `/en/forgot-password`, and `/en/reset-password` for the same alignment

## 3. Stories and docs

- [x] 3.1 Update `AuthPageLayout.stories.tsx` if needed so Login/Signup stories use the shared column + skeleton/card width
- [x] 3.2 Touch `docs/product/features/auth.feature` only if a layout-width scenario belongs there; otherwise rely on the openspec authentication delta

## 4. Validation and handoff

- [x] 4.1 Run `bun run lint` (exit 0) — touched files pass `biome check`; repo-wide lint still reports pre-existing errors outside this change
- [x] 4.2 Run `bun run typecheck` (exit 0)
- [x] 4.3 Manual: `/en/signup` and `/en/login` — form card width matches header rule; hard-refresh / disable-cache once — no shrink after hydrate (ref: `.dev-plan/manual-test-register-page.png`) — Playwright: header/form both 512px; `max-w-sm` present but computed `maxWidth: none`
- [x] 4.4 Mark `manual-test-ux-02-auth-form-width` done in `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- [x] 4.5 Note any leftover width/CLS issues for step 05 only if still needed after this slice — none for width; vertical skeleton CLS out of scope
