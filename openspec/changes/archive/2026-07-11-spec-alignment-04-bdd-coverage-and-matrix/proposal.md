## Why

Phase 5.5 workstream **B** still has an incomplete Discover → public detail → auth journey in Playwright: product Gherkin already defines Discover preview→`/events/:id`, Discover CTA→signup/login→`/events`, guest public detail, and guest `/events` redirect, but `static-pages.spec.ts` and `event-discovery.spec.ts` lack those Scenario titles. Without a checked-in coverage matrix, step 05 cannot prove Phase 5.5 BDD readiness before Stripe.

## What Changes

- Add Playwright tests titled exactly:
  - `Scenario: Discover preview links to public event detail`
  - `Scenario: Discover CTA path to the full member events feed`
  - `Scenario: Guest can view public event detail without authentication`
  - `Scenario: Guest path to full browse requires signup or login`
- Align any remaining title drift in those two spec files with product Gherkin (verbatim `test("Scenario: …")`)
- Prefer one assertion path per scenario; reuse seed/demo fixtures and proximity selectors only (no `data-testid`)
- Check in a **coverage matrix** (`e2e/COVERAGE.md` or `docs/product/testing/coverage-matrix.md`) mapping every MVP `docs/product/features/*.feature` Scenario to Playwright file + title + status (`pass` / `skip` / `deferred` / `unshipped`), including post-MVP skips and Phase 6–8 unshipped rows
- Point `docs/product/testing/bdd-and-e2e.md` Known coverage gaps at the matrix once accurate
- Minimal Discover CTA href fix only if tests prove the primary browse path does not reach signup/login (sitemap already requires it); no broader sitemap audit (step 05)
- Named deferral (scenario + reason + target phase) if a scenario cannot ship in this step

## Capabilities

### New Capabilities

- _(none)_ — coverage matrix is a testing-contract addition under existing `bdd-and-e2e`

### Modified Capabilities

- `bdd-and-e2e`: Require a checked-in coverage matrix as the single inventory of Scenario→Playwright status (including Discover CTA gaps, G7/skip deferrals, post-MVP skips, Phase 6–8 unshipped)
- `static-marketing-pages`: Enforce Discover preview→public detail and Discover CTA→auth→member `/events` as e2e-proven Scenario titles (behavior already in product Gherkin / sitemap)
- `event-discovery`: Enforce guest public `/events/:id` without auth and guest `/events` redirect-to-auth as e2e-proven Scenario titles

## Impact

- **E2E:** `e2e/specs/static-pages.spec.ts`, `e2e/specs/event-discovery.spec.ts`; optional small fixture helpers if Discover preview needs a guaranteed upcoming card; new matrix markdown under `e2e/` or `docs/product/testing/`
- **Docs:** `docs/product/testing/bdd-and-e2e.md` Known coverage gaps; parent guide step 04 + any named deferrals under Risks
- **App (conditional):** `DiscoverPage` / discover content CTA `href` only if browse-all path still anchors `#events` instead of signup/login per sitemap
- **Out of scope:** G7 locator sweeps (step 03 done); full sitemap/deploy (step 05); implementing Stripe/booking/waitlist/profile/admin-users e2e; deleting post-MVP partner portal/QR skips; Phase 6 start
