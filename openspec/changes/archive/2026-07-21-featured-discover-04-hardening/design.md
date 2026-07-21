## Context

Steps 01–03 of Featured Discover are shipped:

| Step | Shipped truth |
|---|---|
| 01 | `featured_events` + catalog helpers (`listFeaturedEvents`, add/remove, `upcomingOnly`) |
| 02 | Admin Featured tab SSR list / search-add / remove (keeps catalog event) |
| 03 | Discover = featured upcoming; booking-eligible USER → `/events`; non-eligible → Discover; nav Discover ↔ Browse events; USER logo split |

Product SoT, seed, and e2e still lag:

| Surface | Stale / missing | Shipped truth |
|---|---|---|
| `event-discovery.feature` | Curated guest preview; no featured-only / access-split scenarios | Featured-only Discover; non-active Discover; active-only `/events` |
| `app-shell.md` / sitemap / static copy / i18n / component map | Pre-split Discover/browse language | Step 03 redirect + nav table in parent guide |
| Demo seed | Creates partners/events only — no `featured_events` rows | Small upcoming set featured so Discover non-empty |
| Playwright | Guest Discover / public detail; no featured vs catalog, inactive redirect, Browse events nav, admin remove | Smoke matrix from step brief |
| Empty Discover copy | “No upcoming events…” | Clear empty featured state (DE/EN); optional admin guidance |
| Parent guide | Step 04 open | Mark 04 + feature done when criteria checkable |

Constraints: product SoT is `docs/product/` (do not treat `openspec/specs/` as agent SoT); proximity e2e selectors per `bdd-and-e2e.md`; no new product scope beyond polish; HeroUI-only for any empty-state UI touch; SSR-only mutations already shipped.

## Goals / Non-Goals

**Goals:**

- Align Gherkin, sitemap, app-shell, static Discover copy, component map, i18n inventory, and gaps-and-decisions with shipped 01–03 behavior.
- Seed featured rows so staging/demo Discover is non-empty.
- Add Playwright coverage for the smoke matrix (guest featured, inactive `/events` redirect, active Browse events nav, admin remove-keeps-event).
- Polish empty featured Discover copy/UI if still catalog-era wording.
- Make parent **Release Criteria** checkable; mark feature done.

**Non-Goals:**

- Partner portal / partner-managed featured lists.
- Changing booking/credit rules or `isBookingEligibleStatus`.
- Footer Discover ↔ Browse parity (document as deferred in gaps if still open).
- Reopening PAST_DUE access debate — keep step 03 choice (`PAST_DUE` = non-active / Discover); note residual in gaps if product wants revisit.
- Unrelated admin Events CRUD refactors.
- Syncing historical `openspec/specs/` as implementer SoT beyond this change’s delta archive.

## Decisions

1. **Docs catch-up, not behavior redesign**  
   Prefer updating `docs/product/` and e2e/seed to match shipped routes. Touch `apps/web` only for empty-state copy/polish or e2e-required accessible names — not redirect/nav redesign. Alternatives: reopen step 03 redirect table — rejected (parent guide already locked for this feature).

2. **Active = booking-eligible (unchanged)**  
   Document and test `ACTIVE` | `CANCELLED_PENDING` via `isBookingEligibleStatus`. Treat `INACTIVE`, `PAST_DUE`, missing sub as Discover audience. Alternatives: give `PAST_DUE` Browse access — deferred; log in gaps-and-decisions if still an open product question.

3. **Prefer MODIFY existing Gherkin over parallel duplicates**  
   Rewrite/enrich `event-discovery.feature` (and admin scenarios if a feature file covers Featured) rather than a second feature file. Keep Scenario titles stable where Playwright already matches verbatim; add new Scenario lines for featured / nav / remove-keeps-event. Alternatives: coverage-only in e2e without Gherkin — rejected (BDD is behavioral SoT).

4. **Product doc surfaces (fixed set)**  
   Update: `event-discovery.feature`, `sitemap.md`, `app-shell.md`, `static-pages-content.md`, `ui-component-map.md`, `content-i18n-inventory.md`, `gaps-and-decisions.md`. Do not invent new design-system pages. Footer may keep Discover → `/discover` — document explicitly.

5. **Demo seed: feature a small upcoming subset after create**  
   In `runDemoSeed` (after events are created), call `addFeaturedEvent` for a small fixed set of upcoming demo titles (e.g. 3–6 from `DEMO_DISCOVERY_TITLES` / known upcoming seed events). Cascade delete on `featured_events` means `resetCatalogData` does not need a special featured wipe. Alternatives: separate `seed:featured` script — rejected (Discover empty on normal `seed:demo`). Idempotency: seed already skips when catalog exists; force reset recreates featured with events.

6. **Playwright smoke matrix (proximity selectors only)**  
   - Guest Discover: with seeded featured row, assert featured title visible; assert a known non-featured upcoming catalog title is absent from Discover (or not linked solely for being soon).  
   - Inactive USER: `/events` → lands on Discover (`302` follow).  
   - Active USER: primary nav shows Browse events (localized) linking to `/events`.  
   - Admin: remove-from-featured confirm POST; Discover no longer lists it; event still on `/admin/events`.  
   Reuse existing auth/demo fixtures; document staging-only gaps with owner if env lacks ADMIN/INACTIVE seeds. Alternatives: screenshot diffs — rejected.

7. **Empty Discover copy**  
   Update `discover.ts` empty strings to featured-aware wording (DE/EN), e.g. no featured upcoming events — not “no upcoming catalog events.” Optional one-line admin path in empty state only if HeroUI Link to `/admin/featured` is appropriate for ADMIN viewers; guests get plain empty copy. Alternatives: keep catalog-era empty copy — rejected (misleading after featured swap).

8. **Parent guide closure**  
   When verification passes, mark step 04 done and note feature complete against release criteria; call out deferred footer parity / PAST_DUE in gaps. Do not mark done before lint/typecheck/targeted e2e.

## Risks / Trade-offs

- **[Risk] E2E needs featured seed + role fixtures (guest / inactive / active / admin)** → Mitigation: wire demo seed featured rows; reuse existing e2e auth helpers; skip with documented owner if a role seed is missing in CI.
- **[Risk] Asserting “non-featured absent” is flaky if seed titles change** → Mitigation: use stable `DEMO_DISCOVERY_TITLES` (or document the chosen featured vs non-featured pair in the test).
- **[Risk] Over-editing CHARTER Locked decisions** → Mitigation: do not touch CHARTER; prefer feature files + sitemap + gaps log.
- **[Risk] Gherkin Scenario title changes break verbatim Playwright matches** → Mitigation: keep existing titles stable; add new Scenario lines for new coverage.
- **[Trade-off] Footer stays Discover → `/discover`** → Acceptable per step 03; document in app-shell/gaps so agents do not “fix” it.
- **[Trade-off] Historical openspec/specs may lag product docs** → Acceptable per AGENTS.md; this change’s deltas capture the hardening contract for archive.

## Migration Plan

1. Diff `docs/product/` against shipped Discover/browse/nav; list stale hits (“upcoming catalog preview”, ungated `/events` for inactive, nav always Discover).
2. Update Gherkin + sitemap/app-shell/static/i18n/component-map/gaps.
3. Wire `runDemoSeed` featured rows; confirm `seed:demo` leaves Discover non-empty.
4. Polish empty Discover copy (DE/EN).
5. Add/adjust Playwright smoke matrix; run lint, typecheck, targeted e2e.
6. Mark parent guide 01–04 done; note deferred items.
7. Rollback: revert doc/seed/e2e/copy commits — runtime from 01–03 unchanged unless empty-copy-only.

## Open Questions

- None blocking. Residual product questions (`PAST_DUE` Browse access; footer nav parity) stay deferred in gaps-and-decisions, not reopened here.
