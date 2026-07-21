## Why

Steps 01–03 shipped featured curation, the admin Featured tab, and the Discover/browse/nav split, but `docs/product/`, BDD/e2e, and demo seed still lag. Without this pass, agents and Playwright assert obsolete Discover/catalog contracts and the parent **Featured Discover** feature cannot be marked released.

## What Changes

- Update Gherkin for Discover = featured-only; Discover audience = guests + non-active members; `/events` (+ map) = booking-eligible only; nav Discover vs Browse events.
- Align sitemap, app-shell, static Discover copy, component map, i18n inventory, and gaps-and-decisions with shipped redirects and labels (step 03 handoff table).
- Add/adjust Playwright coverage for the smoke matrix: guest Discover featured; inactive redirected from `/events`; active nav Browse events; admin remove-from-featured keeps the catalog event.
- Wire demo seed to feature a small set of upcoming events so Discover is non-empty on staging.
- Polish empty featured Discover UI (clear empty state + admin guidance if needed); fix stale Discover/home copy only if touched by this feature’s strings.
- Mark step 04 and the parent feature done when release criteria are checkable.

**Out of scope:** Partner portal; booking/credit rule changes; unrelated admin CRUD refactors; footer Discover ↔ Browse parity (deferred unless already decided); reopening layout debates.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-discovery`: Product SoT + BDD/e2e for featured-only Discover, non-active Discover access, active-only `/events`, empty featured state, and demo seed featured rows.
- `app-shell`: Product docs for Discover vs Browse events primary-nav label/href swap (sticky + drawer) and USER logo home by membership.
- `admin-events`: Product/BDD coverage that admin remove-from-featured keeps the underlying catalog event.

## Impact

- **Product docs:** `docs/product/features/event-discovery.feature` (+ admin scenarios as needed); `docs/product/sitemap/sitemap.md`; `docs/product/ui/app-shell.md`; `docs/product/ui/static-pages-content.md`; `docs/product/ui/ui-component-map.md`; `docs/product/extras/content-i18n-inventory.md`; `docs/product/extras/gaps-and-decisions.md`.
- **Seed:** `packages/db` / `scripts/seed-demo.ts` (or catalog seed helpers) — insert featured rows for a small upcoming set.
- **E2E:** `e2e/specs/event-discovery.spec.ts`, `e2e/specs/static-pages.spec.ts`, admin specs as applicable; proximity selectors per `docs/product/testing/bdd-and-e2e.md`.
- **UI polish:** Discover empty state only if gaps remain after 03 (HeroUI-only; theme tokens).
- **Planning:** `.dev-plan/current-iteration/featured-discover-parent-guide.md` — mark 01–04 done; note deferred items (footer parity, PAST_DUE edge cases if still open).
- **Unchanged runtime (unless e2e reveals regression):** Featured table/helpers, admin Featured tab, Discover/browse redirects, booking eligibility.
- **Source brief:** `.dev-plan/current-iteration/featured-discover-04-hardening.md`
- **Parent:** `.dev-plan/current-iteration/featured-discover-parent-guide.md`
- **Depends on:** `featured-discover-03-discover-browse-and-nav` (done)
- **Consumed by:** closes the Featured Discover feature
- **Verification:** `bun run lint`, `bun run typecheck`, targeted e2e; parent release criteria checkable
