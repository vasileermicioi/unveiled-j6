## Context

Simplified Header step 02 implements the locked IA from step 01 in live chrome. Product SoT (`docs/product/ui/app-shell.md`) already requires: guest header = logo · Discover · FAQ · DE|EN · Log in; no Sign up / How it works / Membership / logo tagline; member marketing nav = Discover + FAQ plus role tools.

Current code still diverges:

- `NAV_ITEMS` = `["discover", "howItWorks", "membership", "faq"]` in `copy.ts`, consumed by both `AppNavbar` and `AppNavbarMenu`.
- Guest desktop + drawer still render Sign up (`button--primary`).
- Guest logo tagline `Paragraph` still renders under the wordmark.
- Logo `href` always targets `/:locale` (not role-correct for `USER` → `/events`, `ADMIN` → `/admin`).
- Discover and FAQ share the same `NavLink` / `.nav-link` treatment; inspiration and parent guide want Discover as the filled yellow primary control.

Constraints: HeroUI-only markup; Tailwind layout-only; theme tokens in `globals.css` / existing BEM; no offset shadows; drawer may remain an island; SSR-friendly.

## Goals / Non-Goals

**Goals:**

- Ship slim primary nav (Discover + FAQ) in desktop header and mobile drawer for guest / member / admin marketing chrome.
- Remove Sign up and logo tagline from header surfaces; keep Log in secondary.
- Make Discover visually primary via theme classes; FAQ stays text nav.
- Keep member/admin role tools and auth-page guest-auth hiding.
- Align logo routing with app-shell role rules while preserving locale switcher and sticky header.

**Non-Goals:**

- Footer redesign or Discover page CTA copy changes.
- Auth page redesign beyond existing “hide guest auth on auth pages.”
- Ladle / BDD / e2e hardening (step 03).
- Inspiration-mock shadows, palette, or non–Work Sans type.
- Inventing a third logo “home” destination.

## Decisions

1. **Slim via `NAV_ITEMS`, not a parallel list**  
   Change `NAV_ITEMS` to `["discover", "faq"]`. Keep `howItWorks` / `membership` on `NavLinkCopy` + `NAV_SEGMENTS` for footer (and any leftover typed keys). Avoid a second nav-source unless a call site still needs the full four-link set — inventory first; prefer one list.

2. **Discover = `button button--primary`; FAQ = `NavLink` / `.nav-link`**  
   Alternatives considered: (a) rely only on `aria-current` yellow for Discover when active — weaker when Discover is not current; (b) primary button always for Discover — matches inspiration and parent-guide preference. Choose (b): render Discover as HeroUI `Link` with `button button--primary button--md` (desktop + drawer), set `aria-current` when active; FAQ stays `NavLink`. No new color utilities; hover via theme.

3. **Remove Sign up props from drawer API**  
   Drop `signupHref` / `signupLabel` from `AppNavbarMenu` once unused. Keep `copy.signup` for auth/marketing pages. Guest drawer auth = Log in only.

4. **Remove header tagline markup; leave footer tagline**  
   Delete the guest `Paragraph` under the logo. Remove `headerTagline` from `ShellCopy` only if nothing else references it after the cut; do not touch `footer.tagline`.

5. **Logo routing by role**  
   Guest / no session → `/:locale`; `USER` → `/events`; `ADMIN` → `/admin`. Matches app-shell; current code always uses Discover. Do not collapse member logo and Discover nav to one destination.

6. **CSS: prefer zero new rules**  
   Only add a BEM hook in `globals.css` if primary-button Discover needs layout tweaks inside `.site-header` (spacing with FAQ). No per-route color/shadow classes.

7. **Auth pages**  
   Keep `showGuestAuthActions = !session && !isAuthPage(pathname)` so Log in stays hidden on auth routes.

## Risks / Trade-offs

- **[Risk] Sign up less visible in chrome** → Mitigation: Discover / membership page CTAs and `/signup` remain; do not remove those in this step.
- **[Risk] Discover primary button + active `nav-link` FAQ looks uneven at mobile** → Mitigation: same class pattern in drawer; full-width primary for Discover optional via existing `button--full-width` if layout needs it.
- **[Risk] Dead copy keys / type errors after sliming `NAV_ITEMS`** → Mitigation: inventory `NAV_ITEMS` / `headerTagline` / signup props; run typecheck.
- **[Trade-off] OpenSpec vs product docs** → Product docs remain authoritative; this delta adds the Discover CTA treatment and rephrases chrome requirements as shipped behavior for archive/sync.

## Migration Plan

1. Apply code changes to navbar / drawer / copy (+ optional CSS).
2. Spot-check guest / member / admin at `lg+` and `<lg`.
3. Mark step 02 done in `simplified-header-parent-guide.md`.
4. No DB, env, or deploy migration specific to this step.
5. Rollback: restore prior `NAV_ITEMS` and Sign up / tagline markup if needed.

## Open Questions

- None blocking. Step 03 owns story/e2e updates if snapshots or Gherkin still expect Sign up / four-link header.
