## Context

Simplified Header step 01 is **spec-first**: lock guest/member/admin header IA in `docs/product/` before any `AppNavbar` work. Today `docs/product/ui/app-shell.md` still requires a four-link guest primary nav (Discover, How it works, Membership, FAQ), guest Sign up in the header, and a guest-only logo tagline. Inspiration (`.dev-plan/1-simplified-header.png`) and the parent guide define the slim set: logo · Discover · FAQ · DE|EN · Log in.

Product behavior SoT remains `docs/product/` (not `openspec/specs/`). This change’s OpenSpec artifacts mirror the step plan so `/opsx:apply` has a clear apply path; implementers update product docs first.

## Goals / Non-Goals

**Goals:**

- Rewrite the Header structure in `app-shell.md` for guest / member / admin to the slim IA.
- Keep How it works + Membership in footer (and Discover CTAs); keep Sign up reachable outside header.
- Drop guest logo tagline from sticky-header requirements.
- Leave Discover → Events CTA contract unchanged.
- Sync any product docs that still describe the old four-link + Sign up header.

**Non-Goals:**

- No `AppNavbar.tsx`, drawer island, CSS, Ladle, or e2e changes (steps 02–03).
- No footer column IA redesign beyond documenting that How it works / Membership stay there.
- No logo routing changes (guest → `/:locale`, USER → `/events`, ADMIN → `/admin`).
- No visual restyle to inspiration mock shadows/palette (`DESIGN.md` unchanged).
- No inventing new marketing slogans; DE/EN inventory-driven copy only.

## Decisions

1. **Docs before code**  
   Update product SoT in this step only. Code still shows the old chrome until step 02 — that temporary docs/code drift is intentional and accepted for a one-step window.

2. **Capability name `app-shell`**  
   Matches the step-plan Spec Delta and `docs/product/ui/app-shell.md`. Not folded into `static-marketing-pages` (Discover CTA unchanged) or `design-system` (visual ownership unchanged).

3. **Guest auth = Log in only in header**  
   Sign up remains on Discover / membership CTAs and auth pages. Footer may continue to surface membership paths; do not add a new Sign up header control.

4. **Member marketing nav = Discover + FAQ**  
   Role tools (Saved, Bookings / My Tickets, credits, Profile, Logout) stay. How it works / Membership leave member primary text nav too.

5. **Admin**  
   Keep admin entry / dashboard chrome; where admin shares marketing primary nav, use the same Discover + FAQ slim set.

6. **Tagline**  
   Remove guest tagline from header requirements. Footer brand tagline stays (separate surface).

7. **Related doc sync**  
   Touch `ui-component-map.md`, `content-i18n-inventory.md`, and sitemap chrome summary **only if** they still list the old header items — do not expand into full sitemap rewrites.

## Risks / Trade-offs

- **[Risk] Docs ahead of code** → Mitigation: parent guide orders 01 → 02; step 02 consumes this contract immediately; do not ship step 01 as a long-lived docs-only state without 02 queued.
- **[Risk] Sign up less visible in chrome** → Mitigation: parent guide already notes Discover hero/membership CTAs must keep signup clear; do not remove those CTAs in this step.
- **[Risk] Member logo → `/events` vs Discover nav → `/:locale` looks inconsistent** → Mitigation: keep existing routing; no third home; document both explicitly in app-shell.
- **[Trade-off] OpenSpec `app-shell` vs product docs** → Product docs are authoritative for apply; OpenSpec delta is planning/traceability for the CLI workflow.

## Migration Plan

1. Apply: edit `docs/product/ui/app-shell.md` (+ related contradictions).
2. Mark step 01 done in `simplified-header-parent-guide.md`.
3. No DB, env, or deploy migration.
4. Rollback: restore prior app-shell Header bullets if needed; no runtime rollback.

## Open Questions

- None blocking apply. Inspiration Discover-as-filled-yellow control is a step 02 theme-class choice (`aria-current` / primary button), not a docs decision here.
