## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/simplified-header-01-nav-contract.md` and this change’s `proposal.md` / `design.md` / `specs/app-shell/spec.md` end-to-end
- [x] 1.2 Confirm parent guide + inspiration IA (`.dev-plan/current-iteration/simplified-header-parent-guide.md`, `.dev-plan/1-simplified-header.png`)
- [x] 1.3 Skim parent release criteria and non-goals; note code paths are read-only this step (`AppNavbar.tsx`, `copy.ts`)

## 2. App-shell Header rewrite

- [x] 2.1 Rewrite Header structure bullets in `docs/product/ui/app-shell.md` for guest: logo → `/:locale`; primary nav Discover + FAQ only; DE|EN; Log in only
- [x] 2.2 Rewrite member Header: marketing nav Discover + FAQ; keep Saved / Bookings / credits / Profile / Logout; logo → `/events`
- [x] 2.3 Rewrite admin Header notes: keep admin entry; slim marketing nav Discover + FAQ where shared; logo → `/admin`
- [x] 2.4 Explicitly state How it works, Membership, and Sign up are out of header; footer Navigation still lists How it works + Membership; Sign up via Discover/auth CTAs
- [x] 2.5 Remove or demote guest logo tagline from header requirements (footer brand tagline unchanged)
- [x] 2.6 Confirm Discover → Events CTA contract section remains accurate and unchanged

## 3. Related product doc sync

- [x] 3.1 Sync `docs/product/ui/ui-component-map.md` Navbar notes if they still imply the old four-link guest nav
- [x] 3.2 Sync `docs/product/extras/content-i18n-inventory.md` header/nav rows if present and contradictory
- [x] 3.3 Sync `docs/product/sitemap/sitemap.md` chrome summary row if it still lists guest How it works / Membership / Sign up as header items

## 4. Validation & cleanup

- [x] 4.1 Diff-review Header: guest items listed exactly once; Sign up / How it works / Membership not under Header primary/auth
- [x] 4.2 Confirm Footer still lists How it works + Membership
- [x] 4.3 Re-read app-shell Header against parent release criteria
- [x] 4.4 Run `bun run lint` — exits 0 (docs-only; no code change expected)
- [x] 4.5 Mark step 01 done in `.dev-plan/current-iteration/simplified-header-parent-guide.md`
