## Why

Steps 01–02 locked and shipped the slim sticky header (logo · Discover · FAQ · DE|EN · Log in), but Ladle stories, Playwright/BDD assertions, and a few agent UI notes may still assume the old four-link chrome or header Sign up. Without this close-out, the quieter header can regress and the parent **Simplified Header** feature is not releasable.

## What Changes

- Update AppShell / AppNavbar Ladle stories so guest, member, and admin chrome match the slim IA (no Sign up / How it works / Membership / tagline in the header region).
- Fix or retarget e2e that click or assert How it works / Membership / Sign up **from the header** — use footer or in-page CTAs, or drop obsolete header-only assertions.
- Confirm BDD proximity selectors remain valid per `docs/product/testing/bdd-and-e2e.md`; do not re-expand header IA while fixing tests.
- Final pass on `docs/product/` (and agent UI notes that contradict slim chrome) if anything drifted during step 02.
- Mark step 03 and parent **Simplified Header** done in the parent guide after verification.

**Out of scope:** New marketing pages, footer visual redesign, Phase 6+ billing chrome, inspiration-mock shadows/palette, inventing a third logo home.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `app-shell`: Add header regression coverage — Ladle (or equivalent) stories SHALL cover guest slim header, member tools chrome, and admin entry; automated e2e that previously asserted header links for How it works, Membership, or Sign up SHALL be updated to the new reachability paths or removed if obsolete.

## Impact

- **Stories:** `apps/web/app/components/AppShell.stories.tsx`, `apps/web/app/components/AppNavbar.stories.tsx` (and any navbar-related story helpers/fixtures if needed).
- **E2E / BDD:** `e2e/specs/*` that assert nav labels from the header; optionally `docs/product/features/*.feature` only if scenarios name header links explicitly; `docs/product/testing/bdd-and-e2e.md` if locator notes need a slim-header clarifying line.
- **Product / agent docs:** Final reconcile of `docs/product/ui/app-shell.md` (and related inventory) if drifted; touch `docs/COMPONENTS.md` / `docs/UX_RULES.md` only where they still describe header Sign up or Membership-as-header-nav.
- **Planning:** `.dev-plan/current-iteration/simplified-header-parent-guide.md` — mark step 03 and feature complete.
- **Depends on:** `simplified-header-02-navbar-surfaces` (merged/archived).
- **Consumed by:** closes the Simplified Header feature.
- **Verification:** `bun run lint`, `bun run typecheck`, stories build/compile path, touched Playwright specs pass locally when credentials/env allow (else named deferral with file names).
