## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/catalog-publish-03-hardening.md`, parent guide Release Criteria / non-goals / product-decision table, and this change’s proposal/design/specs
- [x] 1.2 Confirm step 02 artifacts exist: six publish/unpublish confirm routes; Published/Draft chips; events `published=` filter; create → event publish confirm; featured-add → featured publish confirm; Discover `publishedOnly: true`; `set*Published`
- [x] 1.3 Skim stale surfaces: `createEventViaUI` expects `/admin/events` list; `Create a single event` calls `expectPublicEventDetail`; featured-add tests expect list redirect; `createPricedSlotEvent` omits `published`; `ensureDemoFeaturedSplit` does not publish featured rows; schema-overview / SEO / i18n / gaps omit the three flags

## 2. Gherkin and product docs

- [x] 2.1 Extend `docs/product/features/admin-events.feature` with verbatim titles: Publish confirm goes live on Browse; Unpublish confirm hides from Browse; Create does not appear on Browse; Event list shows Published or Draft status; Event list filters by published; Unpublish does not delete or drop featured membership. Update **Create a single event** (catalog Draft, not public detail). Update **Add by searching existing events** (unpublished featured row + publish confirm, not Discover)
- [x] 2.2 Extend `docs/product/features/admin-partners.feature` with: Add featured partner stays off Discover until publish; Publish featured partner shows on Discover; Unpublish featured partner keeps venue. Update **Add by searching existing partners** to land on featured-partner publish confirm
- [x] 2.3 Extend `docs/product/features/event-discovery.feature` with: Unpublished featured event stays off Discover; Unpublished featured partner stays off Discover; Unpublished events are hidden from Browse events; Published featured event with unpublished catalog stays off Discover; Unpublished event public detail is not found; Saved list hides unpublished events
- [x] 2.4 Extend `docs/product/features/booking.feature` with: Book unpublished fails; Existing booking remains after unpublish. Add waitlist one-liner **Join unpublished fails** to `waitlist.feature`
- [x] 2.5 Update `schema-overview.md` (`published` on `events`, `featured_events`, `featured_partners`; independence; public vs admin readers). Update `seo-and-metadata.md`: unpublished `/events/:id` is 404 / not indexable / not in sitemap (sold-out/past published stay 200 + noindex). Confirm sitemap six confirm routes + events `published=`
- [x] 2.6 Add i18n inventory rows for step-02 `admin-content.ts` publish keys. Log the three-flag decision in `gaps-and-decisions.md`. Grep `docs/product` for stale “create = live” / “add to featured = Discover” and fix hits (including `ui-component-map.md` if needed)

## 3. E2E helpers

- [x] 3.1 Update `createEventViaUI` to expect `/${locale}/admin/events/:id/publish`, parse `eventId` from the URL, cancel (or goto list) by default, and honor `overrides.publish === true` by confirming publish. Add `publishEventViaUI`. Verify existing admin create tests reach the list with a Draft row unless they opt in
- [x] 3.2 Set `published: true` on `createPricedSlotEvent` and any other raw `events` inserts in `e2e/fixtures/` used for member/public surfaces. After `addFeatured*` in `ensureDemoFeaturedSplit` / `ensureDemoFeaturedPartnersSplit`, call `setFeatured*Published` (and `setEventPublished` if the catalog row could be draft)
- [x] 3.3 Add `publishFeaturedEventViaUI` / `publishFeaturedPartnerViaUI`. Featured-add tests that only need membership cancel back to the list. Tests that assert Discover publish the featured row (and catalog event). Stop `expectEventOnDiscover` from falling back to the admin catalog

## 4. Playwright

- [x] 4.1 Add the six new admin-events titles to `e2e/specs/admin-events.spec.ts`. Update existing create / featured-add / public-detail tests per design decisions 3 and 8. Proximity selectors only. Env-skip `E2E_ADMIN_*` / R2 / `DATABASE_URL` only — never `@skip-no-ui`
- [x] 4.2 Add the three new admin-partners titles to `e2e/specs/admin-partners.spec.ts`. Update featured-add redirect assertions
- [x] 4.3 Add the six new event-discovery titles to `e2e/specs/event-discovery.spec.ts`. Public unpublished detail asserts NotFound heading + HTTP 404. Saved list: save published, unpublish, `/saved` omits
- [x] 4.4 Add booking titles to `e2e/specs/booking.spec.ts` (direct `/events/:id/book` on a draft; existing CONFIRMED survives unpublish). Add **Join unpublished fails** to `waitlist.spec.ts` as `test.skip` pointing at the domain `joinWaitlist` unpublished test

## 5. Coverage matrix and parent close-out

- [x] 5.1 Update `docs/product/testing/coverage-matrix.md` with a row for every new Scenario (pass or documented skip; never `@skip-no-ui` for these MVP scenarios)
- [x] 5.2 Grep every new `Scenario:` in the touched feature files has `test("Scenario: …")`. Grep `docs/product` for leftover create=live / add=Discover wording
- [x] 5.3 Mark `catalog-publish-03-hardening` done in `.dev-plan/current-iteration/catalog-publish-parent-guide.md` and walk parent **Release Criteria** (feature released). Canonical SoT is `docs/product/`; do not treat `openspec/specs/` as product behavior; no new AGENTS.md rule

## 6. Verification

- [x] 6.1 Run `bun run lint` — exits 0
- [x] 6.2 Run `bun run typecheck` — exits 0
- [x] 6.3 Run `bun run test:e2e -- e2e/specs/admin-events.spec.ts e2e/specs/admin-partners.spec.ts e2e/specs/event-discovery.spec.ts e2e/specs/booking.spec.ts e2e/specs/waitlist.spec.ts` — new/updated scenarios pass (or skip only with documented env / domain-test reason)
- [x] 6.4 Prepare PR/handoff linking this change ID and the parent guide
