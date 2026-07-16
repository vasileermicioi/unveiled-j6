## Context

Simplified Header steps 01–02 locked product docs and shipped slim chrome in `AppNavbar` / `AppNavbarMenu` (`NAV_ITEMS` = Discover + FAQ; guest Log in only; no tagline; Discover as `button--primary`). Parent release criteria still require stories, e2e/BDD alignment, and feature close-out.

Current state after step 02:

- Live header matches slim IA; footer still lists How it works + Membership; Sign up remains on Discover/auth CTAs.
- `AppNavbar.stories.tsx` already exports Guest / Signed-in USER / Admin; `AppShell.stories.tsx` exports Guest / Signed-in USER — they render live components, so visuals should already be slim, but stories lack explicit regression assertions / admin AppShell coverage / narrative that documents the slim guest contract for reviewers.
- `e2e/specs/static-pages.spec.ts` “Discover is the home page” asserts page-wide Log in + Sign up links (not header-scoped); Gherkin says “navigation to How it works, FAQ, and Membership as applicable” without requiring those in the header. Direct URL visits for How it works / FAQ already pass.
- Agent docs `docs/COMPONENTS.md` / `docs/UX_RULES.md` still describe Login + Sign up in header and Membership as a header nav item — drift vs `docs/product/ui/app-shell.md`.
- Product SoT `app-shell.md` / sitemap / ui-component-map already describe slim chrome.

Constraints: proximity/layout selectors only in e2e; no brittle CSS-class-only theme assertions; do not re-expand header IA while fixing tests; HeroUI-only markup unchanged.

## Goals / Non-Goals

**Goals:**

- Ladle stories clearly cover guest slim header, member tools chrome, and admin entry.
- E2e that assume header How it works / Membership / Sign up are retargeted to footer or in-page CTAs, or dropped if obsolete.
- BDD proximity rules confirmed; optional clarifying note only if needed.
- Reconcile leftover doc contradictions (product + agent UI notes that contradict slim chrome).
- Parent guide: step 03 done + feature complete after verification.

**Non-Goals:**

- New marketing pages or footer visual redesign.
- Phase 6+ billing chrome changes.
- Re-implementing navbar IA (step 02 owns shipped chrome).
- Inspiration-mock shadows, palette, or non–Work Sans type.
- Expanding header back to four marketing links “to make tests pass.”

## Decisions

1. **Stories: keep co-located AppNavbar / AppShell stories; assert slim IA via composition, not CSS snapshots**  
   Prefer documenting expected chrome in story names / brief story comments or lightweight visible structure checks that Ladle reviewers can see. Add `AppShell / ADMIN` if missing and useful. Do not add Playwright-style assertions inside stories unless the repo already has a story-test harness — visual + prop fidelity to live `AppNavbar` is enough. Alternatives considered: (a) Chromatic/visual diffs — out of scope; (b) duplicate mock nav lists in stories — rejected; stories must use real components so they cannot drift from shipped chrome.

2. **E2e: scope header assertions with `banner` / header proximity; relocate marketing links to footer**  
   Where a test needs How it works / Membership reachability, use `getByRole('contentinfo')` (footer) or in-page CTAs — never reintroduce those links into the header to satisfy a test. Sign up on Discover remains page-level (hero/CTA), not header. Alternatives considered: (a) drop the Discover “navigation to …” Gherkin line — only if e2e cannot assert footer links without flaking; prefer asserting footer Navigation first; (b) change Gherkin to say “footer” explicitly — do only if product SoT reviewers want that clarity; keep verbatim titles unless the scenario text is wrong.

3. **Gherkin edits are last resort**  
   Touch `docs/product/features/*.feature` only when a scenario **names header** links for How it works / Membership / Sign up. Ambiguous “I see navigation to …” may stay if e2e proves footer/page reachability.

4. **Doc reconcile targets**  
   - Product: skim `app-shell.md`, sitemap guest column, ui-component-map — fix only contradictions.  
   - Agent UI (`docs/COMPONENTS.md`, `docs/UX_RULES.md`): update GuestNavbar / nav rules that still claim header Sign up or Membership-as-header-nav so implementers do not regress.  
   - Do not rewrite `gaps-and-decisions.md` history rows unless they mislead current implementers as normative (prefer a short clarifying note only if needed).

5. **Stories verification command**  
   Prefer `bun run stories` if it stays up for a smoke check, or the package’s Ladle build/compile path if one exists (`apps/web` currently has `ladle serve` only). If no non-interactive build script exists, document: load AppNavbar/AppShell stories locally and confirm exit of `bun run typecheck` covers story TS compile via the web package. Do not invent a new CI story runner in this step unless already present.

6. **E2e deferral policy**  
   Touched Playwright specs must pass when env/credentials allow. If blocked, record named deferral with file names in the parent guide or PR notes — not silent skip of chrome regression.

## Risks / Trade-offs

- **[Risk] Page-wide Sign up assertion still passes while header Sign up is gone** → Mitigation: for header regression, assert Sign up / How it works / Membership are **absent from** `getByRole('banner')` (or equivalent header region) in at least one focused guest smoke if cheap; keep Discover page Sign up CTA assertions separate.
- **[Risk] Footer link labels differ DE/EN** → Mitigation: use existing locale-aware regex patterns from static-pages / copy inventory.
- **[Risk] Stories look “done” without admin AppShell** → Mitigation: AppNavbar already has Admin story; add AppShell Admin only if shell chrome differs meaningfully.
- **[Trade-off] Agent docs vs product SoT** → Product docs remain authoritative; agent docs are corrected so they do not contradict.

## Migration Plan

1. Grep e2e + features for header nav labels; inventory story gaps.
2. Update stories; patch e2e/BDD; reconcile docs.
3. Run lint, typecheck, stories check, touched e2e.
4. Mark step 03 + feature complete in `simplified-header-parent-guide.md`.
5. Rollback: revert story/e2e/doc commits only — live chrome from step 02 stays.

## Open Questions

- None blocking. If Discover Gherkin “navigation to How it works…” is interpreted as header-only by a reviewer, clarify scenario text to footer/page in the same PR.
