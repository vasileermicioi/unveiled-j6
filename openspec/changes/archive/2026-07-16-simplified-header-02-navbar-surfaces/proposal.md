## Why

Step 01 locked the slim header IA in product docs, but live chrome still ships a four-link marketing strip, guest Sign up, and a logo tagline. Guests and members need `AppNavbar` + the mobile drawer to match that contract so the quieter header ships for real.

## What Changes

- Slim primary `NAV_ITEMS` (header + drawer) to **Discover** + **FAQ** only; keep How it works / Membership in footer copy and routes.
- Remove guest logo tagline `Paragraph` from `AppNavbar`.
- Guest auth: keep **Log in** (secondary); remove **Sign up** from desktop header and drawer.
- Treat Discover as the theme primary CTA (`button button--primary`); FAQ remains text / secondary `nav-link`.
- Sync `AppNavbarMenu` drawer IA with the same set (no orphan Sign up / How it works / Membership).
- Preserve member tools (Saved, Bookings, credits, Profile, Logout), admin dashboard link, sticky header, locale switcher, and role-correct logo routing (guest → `/:locale`, `USER` → `/events`, `ADMIN` → `/admin`).
- Minimal `globals.css` tweaks only if Discover-as-primary needs a dedicated BEM hook; prefer existing theme classes.
- **No** footer redesign, auth page redesign, or e2e/Ladle hardening (step 03).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `app-shell`: Shipped sticky-header chrome must match the slim IA (Discover + FAQ; Log in only; no tagline/Sign up). Add Discover primary CTA treatment vs FAQ secondary / text nav, using theme tokens only.

## Impact

- **Code:** `apps/web/app/components/AppNavbar.tsx`, `apps/web/app/islands/AppNavbarMenu.tsx`, `apps/web/app/lib/copy.ts` (`NAV_ITEMS` / related), optionally `apps/web/app/components/NavLink.tsx`, optionally `apps/web/app/styles/globals.css`.
- **Product SoT:** `docs/product/ui/app-shell.md` already updated in step 01; this step implements against it (optional tiny doc note only if Discover CTA treatment needs an explicit line — prefer code + OpenSpec delta).
- **Planning:** `.dev-plan/current-iteration/simplified-header-parent-guide.md` (mark step 02 done on apply).
- **Downstream:** `simplified-header-03-hardening` aligns stories/e2e to the new chrome.
- **Verification:** `bun run lint` and `bun run typecheck` exit 0; manual guest / member / admin check at desktop + mobile widths.
