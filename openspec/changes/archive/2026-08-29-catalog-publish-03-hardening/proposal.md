## Why

Steps 01–02 shipped `published` flags, `set*Published`, Discover `publishedOnly`, and admin confirm pages, but canonical `docs/product/` and Playwright still assume **create = live on Browse** and **add to featured = live on Discover**. Until Gherkin, e2e helpers, schema/SEO/i18n/decisions, and the coverage matrix match the three-flag contract, CI proves the old “save = live” behavior and the parent feature cannot close.

## What Changes

- Extend `admin-events.feature` with publish/unpublish confirm, list Published/Draft chip, optional `published=` filter, create stays draft, and unpublish does not delete or drop featured membership. Update existing create/featured-add Gherkin that still implies an immediate list redirect or public detail.
- Extend featured scenarios in `admin-events.feature` / `admin-partners.feature`: add-to-featured creates an unpublished row; Discover updates only after featured publish (and catalog `events.published` for events); unpublish featured keeps the catalog row.
- Extend `event-discovery.feature`: unpublished events absent from Browse/map/saved; unpublished featured events/partners absent from Discover; published featured + unpublished event absent from Discover; public `/events/:id` 404 for unpublished (same as missing).
- Extend `booking.feature` (and waitlist one-liner): book/waitlist/save unpublished fails; existing CONFIRMED booking remains after unpublish.
- Add Playwright tests titled `Scenario: <exact Gherkin title>` in the mapped spec files. **BREAKING (e2e helpers):** `createEventViaUI` now lands on publish confirm (draft); helpers that create events for discovery/booking MUST publish; helpers that add featured and then assert Discover MUST publish the featured row (and the catalog event for events).
- Update `schema-overview.md` (`events`, `featured_events`, `featured_partners`). Update `seo-and-metadata.md`: unpublished `/events/:id` is not indexable and not in sitemap (404). Confirm sitemap route table. Add i18n inventory rows for step-02 admin copy. Log the three-flag decision in `gaps-and-decisions.md`. Update `coverage-matrix.md`.
- Out of scope: new product behavior, event preview, partner portal, `partners.published`, bulk/scheduled publish.

## Capabilities

### New Capabilities

_(none — `admin-events`, `admin-featured-partners`, `event-discovery`, `booking`, `waitlist`, and `event-catalog` already exist from steps 01–02)_

### Modified Capabilities

- `admin-events`: Canonical `admin-events.feature` and Playwright SHALL record publish/unpublish confirm, Published/Draft chip, optional `published=` filter, create-as-draft, and unpublish-keeps-featured. Existing create/featured-add titles SHALL stop implying “save = live” or “add = Discover”.
- `admin-featured-partners`: Canonical `admin-partners.feature` and Playwright SHALL record that featured-add creates an unpublished row, Discover updates only after featured publish, and unpublish featured keeps the venue.
- `event-discovery`: Canonical `event-discovery.feature` and Playwright SHALL hide unpublished events from Browse/map/saved, hide unpublished featured rows from Discover (including featured-published + event-draft), and treat unpublished public detail as 404.
- `booking`: Canonical `booking.feature` and Playwright SHALL reject booking an unpublished event and SHALL keep an existing CONFIRMED booking after unpublish.
- `waitlist`: Canonical `waitlist.feature` SHALL reject joining an unpublished event (one-liner + titled Playwright, skip allowed if only domain-observable).
- `event-catalog`: Canonical schema-overview, SEO/sitemap, i18n inventory, and gaps-and-decisions SHALL document the three independent `published` flags and unpublished 404 / not-indexable / not-in-sitemap.

## Impact

- **Product SoT:** `docs/product/features/{admin-events,admin-partners,event-discovery,booking,waitlist}.feature`, `docs/product/database/schema-overview.md`, `docs/product/extras/{seo-and-metadata,content-i18n-inventory,gaps-and-decisions}.md`, `docs/product/sitemap/sitemap.md` (confirm step-02 rows), `docs/product/testing/coverage-matrix.md`.
- **E2E:** `e2e/specs/{admin-events,admin-partners,event-discovery,booking,waitlist}.spec.ts`; helpers in `e2e/fixtures/admin.ts` (`createEventViaUI`, new `publish*ViaUI`) and `e2e/fixtures/catalog.ts` (`ensureDemoFeaturedSplit` / `addFeatured*` must publish when asserting Discover).
- **Runtime:** no intended behavior change. Flags, `set*Published`, Discover `publishedOnly`, and six confirm routes already shipped. Domain package tests already cover unpublished gates.
- **Planning mirror:** `openspec/specs/{admin-events,admin-featured-partners,event-discovery,booking,waitlist,event-catalog}` via this change’s deltas (not product SoT).
- **Parent close-out:** `.dev-plan/current-iteration/catalog-publish-parent-guide.md` mark `catalog-publish-03-hardening` done; walk Release Criteria.
- **Source brief:** `.dev-plan/current-iteration/catalog-publish-03-hardening.md`
- **Parent:** `.dev-plan/current-iteration/catalog-publish-parent-guide.md`
- **Depends on:** `catalog-publish-02-admin-surfaces` (done / archived)
- **Consumed by:** closes the catalog-publish parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; `bun run test:e2e` for the touched specs; grep every new `Scenario:` has a matching `test("Scenario: …")` title
