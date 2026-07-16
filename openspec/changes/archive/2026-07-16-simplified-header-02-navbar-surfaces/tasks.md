## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/simplified-header-02-navbar-surfaces.md` and this change’s `proposal.md` / `design.md` / `specs/app-shell/spec.md`
- [x] 1.2 Confirm step 01 is marked done in `simplified-header-parent-guide.md` and skim updated `docs/product/ui/app-shell.md` Header
- [x] 1.3 Inventory `NAV_ITEMS`, `headerTagline`, signup header props, and `AppNavbar` / `AppNavbarMenu` call sites (including any stories — note only; story fixes are step 03)

## 2. Nav list & copy

- [x] 2.1 Slim `NAV_ITEMS` in `apps/web/app/lib/copy.ts` to `["discover", "faq"]`; keep footer `nav` keys / `NAV_SEGMENTS` for How it works + Membership
- [x] 2.2 Remove `headerTagline` from `ShellCopy` and locale copy objects if unused after navbar cut; do not delete footer tagline strings
- [x] 2.3 Keep `copy.signup` for auth/marketing pages; stop using it in header chrome

## 3. AppNavbar desktop

- [x] 3.1 Remove guest logo tagline `Paragraph` from `AppNavbar.tsx`
- [x] 3.2 Wire logo `href` by role: guest → `/:locale`, `USER` → `/events`, `ADMIN` → `/admin`
- [x] 3.3 Render Discover as theme primary (`Link` + `button button--primary button--md` + `aria-current` when active); keep FAQ as `NavLink` / `.nav-link`
- [x] 3.4 Remove Sign up from guest desktop auth; keep Log in as `button--secondary`; preserve `showGuestAuthActions` auth-page hide
- [x] 3.5 Preserve member tools (Saved, Bookings, credits, Profile, Logout) and admin dashboard link

## 4. Mobile drawer

- [x] 4.1 Sync `AppNavbarMenu` to the slim `navLinks` set (no How it works / Membership orphans)
- [x] 4.2 Remove Sign up from drawer guest auth; drop unused `signupHref` / `signupLabel` props
- [x] 4.3 Apply the same Discover primary / FAQ text treatment in the drawer; keep member/admin role tools

## 5. Theme polish (only if needed)

- [x] 5.1 Add minimal `globals.css` layout hook under `.site-header` only if Discover primary + FAQ spacing needs it; no new colors/shadows

## 6. Validation & cleanup

- [x] 6.1 Run `bun run lint` and `bun run typecheck` (both exit 0)
- [x] 6.2 Visually confirm guest / member / admin at desktop (`lg+`) and mobile (`<lg`) widths against slim IA
- [x] 6.3 Spot-check auth pages still hide guest auth actions
- [x] 6.4 Mark step 02 done in `.dev-plan/current-iteration/simplified-header-parent-guide.md`
