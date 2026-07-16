## Why

The guest sticky header still documents a four-link marketing strip (Discover, How it works, Membership, FAQ) plus Log in and Sign up, which overcrowds the chrome and fights the Simplified Header IA. Step 01 locks the slim nav contract in product docs so step 02 does not invent a different header.

## What Changes

- Update `docs/product/ui/app-shell.md` Header so guest primary nav is **Discover** + **FAQ** only; guest auth is **Log in** only (no Sign up in header).
- Remove the guest logo-tagline requirement from sticky header chrome (footer brand tagline unchanged).
- Align member primary text nav with Discover + FAQ; keep role tools (Saved, Bookings, credits, Profile, Logout).
- Keep admin entry; share the same slim marketing nav where applicable.
- Document that How it works, Membership, and Sign up remain reachable via footer and/or Discover page CTAs — not header chrome.
- Sync contradictory notes in related product docs (`ui-component-map.md`, `content-i18n-inventory.md`, sitemap chrome summary if it still lists the old four-link + Sign up header).
- **No** `AppNavbar` / CSS / drawer / e2e / Ladle changes in this step (deferred to `simplified-header-02` / `03`).

## Capabilities

### New Capabilities

- `app-shell`: Sticky header information architecture for guest, member, and admin chrome — which links belong in the header vs footer/CTA surfaces, logo routing, and Discover → Events CTA contract pointers.

### Modified Capabilities

- _(none)_ — Discover → Events CTA behavior in `static-marketing-pages` stays unchanged; this step only narrows header chrome documentation.

## Impact

- **Product SoT:** `docs/product/ui/app-shell.md` (primary); optional touch-ups to `docs/product/ui/ui-component-map.md`, `docs/product/extras/content-i18n-inventory.md`, `docs/product/sitemap/sitemap.md` (chrome summary table).
- **Planning:** `.dev-plan/current-iteration/simplified-header-parent-guide.md` (mark step 01 done on apply).
- **Code (read-only this step):** `apps/web/app/components/AppNavbar.tsx`, `apps/web/app/lib/copy.ts` — implementers of step 02 consume the locked contract; no TSX/CSS edits here.
- **Downstream:** `simplified-header-02-navbar-surfaces` implements against this IA; `simplified-header-03-hardening` aligns stories/e2e.
- **Verification:** docs-only — `bun run lint` exits 0; no typecheck/runtime surface expected to change.
