## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/simplified-header-03-hardening.md`, parent release criteria in `simplified-header-parent-guide.md`, and this change’s `proposal.md` / `design.md` / `specs/app-shell/spec.md`
- [x] 1.2 Confirm step 02 is marked done in the parent guide and skim shipped `AppNavbar` / `AppNavbarMenu` slim IA
- [x] 1.3 Grep `e2e/` + `docs/product/features/` for header nav labels (How it works, Membership, Sign up, Entdecken, Registrieren, So funktioniert, Mitgliedschaft) and list files that assume the old four-link header

## 2. Ladle stories

- [x] 2.1 Update `AppNavbar.stories.tsx` guest / member / admin stories so they reflect slim chrome (real components; no mock four-link lists); ensure guest story makes clear Sign up / How it works / Membership are not in the header
- [x] 2.2 Update `AppShell.stories.tsx` guest / signed-in USER stories for the same slim contract; add Admin AppShell story only if shell chrome differs usefully from AppNavbar Admin
- [x] 2.3 Spot-check stories load via `bun run stories` or document the repo’s equivalent story compile path if serve-only

## 3. E2e / BDD alignment

- [x] 3.1 Patch Playwright specs that click or assert How it works / Membership / Sign up from the header — retarget to footer (`contentinfo`) or in-page CTAs, or remove obsolete header-only assertions
- [x] 3.2 Optionally add a guest banner-scoped absence check (Sign up / How it works / Membership not in header) using proximity selectors only — no CSS-class-only theme assertions
- [x] 3.3 Touch `docs/product/features/*.feature` only if a scenario explicitly names those links as header chrome; prefer clarifying footer/page reachability over rewriting unrelated scenarios
- [x] 3.4 Confirm `docs/product/testing/bdd-and-e2e.md` proximity rules still hold; add a one-line slim-header note only if implementers would otherwise re-expand header IA

## 4. Doc reconcile

- [x] 4.1 Final pass on `docs/product/ui/app-shell.md`, sitemap guest column, and `ui-component-map.md` — fix only contradictions with shipped slim chrome
- [x] 4.2 Update agent UI notes that still claim header Sign up or Membership-as-header-nav (`docs/COMPONENTS.md`, `docs/UX_RULES.md` as needed)

## 5. Validation & cleanup

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (both exit 0)
- [x] 5.2 Run stories check (serve smoke or documented equivalent) and touched Playwright specs when credentials/env allow; otherwise note named deferral with file names
- [x] 5.3 Mentally confirm parent release criteria against local/staging (guest slim header; relocated links reachable; member/admin tools intact)
- [x] 5.4 Mark step 03 done and mark **Simplified Header** feature complete in `.dev-plan/current-iteration/simplified-header-parent-guide.md`
