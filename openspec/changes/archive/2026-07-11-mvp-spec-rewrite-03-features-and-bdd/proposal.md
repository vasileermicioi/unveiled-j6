## Why

Step 02 delivered the structural half of `docs/product/` (vision, sitemap, UI, schema, extras), but the behavioral half is still missing: MVP Gherkin features, user journeys, and an enforceable BDD/Playwright contract. Without them, agents still lean on `docs/migration/features/` (partner mixed into MVP) and treat proximity selectors / `Scenario:` title matching as optional folklore (gap G7).

## What Changes

- Create `docs/product/product/user-journeys.md` — MVP journeys only (guest→member, admin catalog, discovery, booking/credits/waitlist/profile); partner onboarding/check-in in an explicit **Post-MVP** section
- Rewrite MVP Gherkin under `docs/product/features/` aligned with new sitemap/UI/schema:
  - `static-pages.feature` — Discover = locale home; Discover→Events CTAs; public surfaces
  - `auth.feature`, `onboarding.feature`
  - `event-discovery.feature` — guest preview, **public** detail, member feed/saved/map
  - `admin-events.feature`, `admin-partners.feature` (venues only; portal-access → post-MVP)
  - `admin-users.feature` (MVP admin ops subset per charter)
  - `booking.feature`, `credits-subscription.feature`, `waitlist.feature`, `profile.feature`
- Park partner/check-in under `docs/product/features/post-mvp/` (not MVP top-level)
- Create **`docs/product/testing/bdd-and-e2e.md`** — hard rules: Gherkin SoT; one `e2e/specs/<basename>.spec.ts` per feature; `test("Scenario: …")` matches `Scenario:` verbatim; proximity/layout selectors only; forbid `data-testid` / CSS-class / `#id` test selectors; narrow documented exceptions; `@skip-no-ui` coverage gate; Ladle Theme Overview policy pointer
- Update `docs/product/README.md` reading order for features + testing; amend CHARTER target-tree filename if it still says `bdd-playwright.md`
- Document known e2e↔feature title drift / coverage gaps (do not fix Playwright code here)
- Mark step 03 done in `.dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md`
- Do **not** write Playwright/Ladle code, `IMPLEMENTATION-PLAN.mvp.md` (04), or flip `AGENTS.md` (05)

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-discovery`: MODIFIED — Gherkin under `docs/product/features/event-discovery.feature` SHALL specify guest Discover preview, public `/events/:id`, and authenticated member feed/filter/saved/map aligned with `docs/product/sitemap/sitemap.md`
- `platform-foundation`: ADDED — product spec SHALL include `docs/product/testing/bdd-and-e2e.md` requiring verbatim `Scenario:` ↔ Playwright titles and proximity/layout selectors only (with narrow documented native-input exceptions)

## Impact

- **Docs only** under `docs/product/` (features, journeys, testing) plus parent-guide checkbox and optional CHARTER/README filename alignment
- **Consumers:** step 04 (MVP plan schedules e2e remediation + remaining phases), step 05 (AGENTS SoT flip)
- **Sources:** charter Locked decisions §1–5; `docs/product/` sitemap/UI/schema from step 02; port/rewrite from `docs/migration/features/*.feature` and `user-journeys.md`; shipped `e2e/specs/` titles for drift inventory
- **Out of scope:** application/Playwright/Ladle code; deleting `docs/migration/`; partner portal implementation
