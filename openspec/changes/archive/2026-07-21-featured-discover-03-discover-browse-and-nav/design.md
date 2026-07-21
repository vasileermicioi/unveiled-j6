## Context

Parent feature: Featured Discover & membership browse split (`.dev-plan/current-iteration/featured-discover-parent-guide.md`). Steps 01–02 are done: `featured_events` + helpers (`listFeaturedEvents` with `upcomingOnly`) and ADMIN Featured tab. Discover still calls `listUpcomingEvents(db, { limit: 6 })`. Member feed/map use `guardMemberAppRoute` (auth + role only); inactive USERs still reach `/events` and see a subscription banner. Session (`AppSession`) carries credits/role but not subscription status. Locale middleware sets `session` + `savedCount`; `_renderer` passes them into `AppShell` → `AppNavbar` / `AppNavbarMenu`. Marketing nav is built from `NAV_ITEMS` / `NAV_SEGMENTS` (`discover` → `"discover"`). USER logo always → `/events`.

Constraints: SSR redirects only; HeroUI-only UI touch-ups; Tailwind layout only; reuse `isBookingEligibleStatus`; locale-prefixed URLs; public `/events/:id` unchanged; business logic stays in packages / thin route guards; no client-only nav mutation for the swap.

## Goals / Non-Goals

**Goals:**

- Discover lists featured upcoming events only.
- Active (booking-eligible) USER cannot linger on Discover; inactive USER cannot open feed/map.
- Sticky + drawer nav and USER logo reflect Discover vs Browse events from subscription state.
- Shell receives a booking-eligible flag via existing SSR context path.

**Non-Goals:**

- Admin Featured UI changes; featured schema work.
- Full `docs/product/` / BDD / e2e suite (step 04).
- Footer Discover ↔ Browse parity (keep footer Discover → `/discover`).
- Changing booking purchase eligibility beyond browse/nav access.
- Partner portal; algorithmic featuring.

## Decisions

1. **“Active” = booking-eligible**
   - **Choice:** Treat browse/nav “active” as `isBookingEligibleStatus(status)` → `ACTIVE` | `CANCELLED_PENDING`. Treat `INACTIVE`, `PAST_DUE`, missing subscription, and (for USER) null status as non-active → Discover.
   - **Rationale:** Parent guide default; one definition shared with booking; avoids a parallel boolean.
   - **Alternatives:** Give `PAST_DUE` Browse access (rejected for this step — document for step 04 if product flips).

2. **Where to load subscription for shell**
   - **Choice:** In `apps/web/app/routes/[locale]/_middleware.tsx`, when `session.user.role === "USER"`, load subscription status (same DB path as saved-count) and `c.set("canBrowseEvents", isBookingEligibleStatus(status))`. Guests/ADMIN/PARTNER → `false` (ADMIN nav stays Discover; logo stays `/admin`). Pass `canBrowseEvents` through `_renderer` → `AppShell` → `AppNavbar` / `AppNavbarMenu`.
   - **Rationale:** Mirrors `savedCount`; one query per USER request; SSR props only; island receives boolean from server.
   - **Alternatives:** Embed status on `AppSession` in `@unveiled/auth` (broader auth change — defer unless already cheap); per-route prop drilling (misses chrome on all pages).

3. **Discover route data + redirect**
   - **Choice:** In `discover.tsx`: if session USER and `canBrowseEvents` (or inline eligibility check) → `302` `/:locale/events`. Else load `listFeaturedEvents(db, { upcomingOnly: true })` (no artificial limit 6 unless product wants a cap — prefer all upcoming featured, ordered by helper). Keep partner marquee via `listPartners`. ADMIN: no redirect to `/events`.
   - **Rationale:** Step brief; featured list is already curated/small.
   - **Alternatives:** Cap at 6 featured (unnecessary if curation is intentional); redirect ADMIN to `/admin` (worse for QA).

4. **Feed/map gate**
   - **Choice:** Extend member feed guard (prefer a dedicated helper e.g. `guardActiveMemberFeedRoute` or options on `guardMemberAppRoute`) used by `/events` and `/events/map`: after existing auth/role checks, if role is `USER` and not booking-eligible → `302` `/:locale/discover`. Keep guest → login. Do not send ADMIN to Discover via this inactive path (ADMIN either keeps current feed access or is out of scope — prefer leave existing ADMIN allowance on feed if already allowed, without forcing Discover).
   - **Rationale:** Removes banner-as-primary-gate; map must match list.
   - **Alternatives:** Only gate index and leave map open (inconsistent); soft-block with empty feed (weaker).

5. **Nav label/href swap**
   - **Choice:** When building marketing nav links, if `canBrowseEvents`: label from shared copy key aligned with `browseEvents` (“Browse events” / “Events entdecken”), href `events`; else label `copy.nav.discover`, href `discover`. Apply in desktop `AppNavbar` and drawer `AppNavbarMenu`. Active state via `isActiveNavPath` on resolved href. Primary/secondary button treatment unchanged, keyed off `isActive`.
   - **Rationale:** Step brief + existing DE/EN browse phrasing.
   - **Alternatives:** Separate nav key `browseEvents` in `NavLinkCopy` (clearer than overloading `discover` key — prefer explicit `browseEvents` shell string while keeping `NAV_ITEMS` slot as the first marketing item).

6. **USER logo home**
   - **Choice:** `logoHref = canBrowseEvents ? eventsHref : discoverHref` for USER; ADMIN unchanged (`/admin`); guest unchanged (`/:locale` home).
   - **Rationale:** Parent open question default.
   - **Alternatives:** Always `/discover` for USER (breaks active members’ muscle memory for feed).

7. **Subscription banner cleanup**
   - **Choice:** Once inactive USERs cannot reach the feed, remove or no-op the inactive subscription banner branch on the feed page if it is now dead code; do not invent new banner UX.
   - **Rationale:** Optional in brief; avoids contradictory messaging.
   - **Alternatives:** Keep banner for CANCELLED_PENDING messaging (only if still useful for active-eligible cancel-pending — optional, not required).

8. **Footer**
   - **Choice:** Leave footer Discover → `/discover` for all audiences this step.
   - **Rationale:** Explicit default in step brief; parity deferred.

9. **Docs this step**
   - **Choice:** Minimal — mark parent guide step 03 done after ship; list ADMIN / PAST_DUE redirect choices for step 04. No broad sitemap/feature rewrite here.
   - **Rationale:** Step 04 owns product docs + e2e.

## Risks / Trade-offs

- **[Risk] Extra subscription query on every USER page** → Mitigation: single findFirst by userId next to saved-count; fail closed to `canBrowseEvents=false` on DB error (safe Discover nav).
- **[Risk] e2e/fixtures assume inactive USER can open `/events`** → Mitigation: note breakage for step 04; this step only smoke-tests manually unless a trivial fixture fix is required to keep CI green.
- **[Risk] `PAST_DUE` users lose Browse** → Mitigation: intentional per parent default; document in handoff.
- **[Risk] Locale home `/:locale` vs `/discover` inconsistency for guests** → Mitigation: nav already uses `/discover`; do not change guest logo home unless already aliased; step 04 docs align app-shell.md.
- **[Trade-off] Footer still says Discover for active members** → Mitigation: accepted; top nav is the product ask.
- **[Trade-off] openspec delta vs product SoT** → Mitigation: planning contract; `docs/product/` updates in step 04.

## Migration Plan

1. Middleware + context: load subscription → `canBrowseEvents`; thread through renderer/shell/navbar/menu (+ stories).
2. Discover: featured query + active USER redirect.
3. Feed/map: booking-eligible gate → Discover for non-active USER.
4. Nav + logo swap; optional banner cleanup.
5. `bun run lint`, `bun run typecheck`; smoke matrix (guest / inactive / active).
6. Mark step done in parent guide; note ADMIN + PAST_DUE choices for step 04.
7. Rollback = revert route/shell/middleware commits; no schema migration this step.

## Open Questions

- None blocking. Confirm at apply time only if CI e2e fails on inactive `/events` access — then either skip/adjust the failing assertion minimally or defer to step 04 with a named note.
