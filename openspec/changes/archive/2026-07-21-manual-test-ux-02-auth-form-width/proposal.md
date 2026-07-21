## Why

On signup (and sibling auth pages), the page header rule / SSR skeleton spans a wider measure than the hydrated `@better-auth-ui/heroui` form card, so the form visibly shrinks after load (ref: `.dev-plan/manual-test-register-page.png`). Auth pages should keep one stable content width from first paint through hydration.

## What Changes

- Align signup/login (and shared `AuthPageLayout` siblings) form card width with the page header / skeleton content measure — no post-hydrate shrink.
- Fix via shared layout + theme CSS (and `AuthPageLayout` width props/classes) — do **not** fork `@better-auth-ui/*`.
- Apply consistently across auth pages that share the layout (signup, login, forgot-password, reset-password as applicable).
- Optional: update `AuthPageLayout` Ladle story if width expectations are documented there.
- Spec delta: auth pages SHALL keep form card width equal to the header/skeleton measure across hydration.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `authentication`: Auth pages (signup, login, and shared auth layout siblings) SHALL render the form card at the same content width as the page header/skeleton so the layout does not visibly shrink after client hydration.

## Impact

- **UI:** `apps/web/app/components/AuthPageLayout.tsx`; `apps/web/app/components/AuthFormFallback.tsx` (skeleton measure); auth islands under `apps/web/app/islands/Auth*.tsx`.
- **Theme:** `apps/web/app/styles/globals.css` — `.auth-form` / card max-width overrides; optional shared auth content-width token/class.
- **Routes:** `apps/web/app/routes/[locale]/signup.tsx`, `login.tsx`, and related forgot/reset password routes that use `AuthPageLayout`.
- **Stories:** `AuthPageLayout.stories.tsx` if present and width-sensitive.
- **Unchanged:** Neon Auth / Better Auth backend, onboarding preference forms (step 03), membership benefits / page headers (step 04), guest event detail gating (step 01), booking domain.
- **Source brief:** `.dev-plan/current-iteration/manual-test-ux-02-auth-form-width.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- **Consumed by:** `manual-test-ux-03-native-forms-and-preference-i18n`
- **Verification:** `bun run lint`, `bun run typecheck`; manual `/en/signup` + `/en/login` — card width matches header rule; hard-refresh check for no shrink
