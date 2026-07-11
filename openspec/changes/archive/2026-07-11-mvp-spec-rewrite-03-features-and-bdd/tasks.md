## 1. Setup

- [x] 1.1 Read `docs/product/CHARTER.md` Locked decisions §1–5 and target tree; skim `docs/product/sitemap/sitemap.md` + `ui/design-system.md` for alignment targets
- [x] 1.2 Diff charter + new sitemap against each `docs/migration/features/*.feature`; classify keep / rewrite / post-mvp (table in working notes or journeys appendix)
- [x] 1.3 Inventory shipped `e2e/specs/*.spec.ts` `Scenario:` titles vs migration features; draft “known coverage gaps” list for the testing doc (do not fix Playwright code)
- [x] 1.4 Amend `docs/product/CHARTER.md` target tree: `testing/bdd-playwright.md` → `testing/bdd-and-e2e.md` if still outdated

## 2. User journeys

- [x] 2.1 Write `docs/product/product/user-journeys.md` — MVP journeys: guest→member (Discover home, public detail, auth CTA → `/events`), subscription/booking/credits, waitlist, payment recovery, cancellation/deletion, admin catalog/support
- [x] 2.2 Add explicit **Post-MVP** section for partner onboarding / portal / check-in (former migration Journey 5); no partner as active MVP persona

## 3. MVP feature files

- [x] 3.1 Create `docs/product/features/` and rewrite `static-pages.feature` — Discover = locale home; Discover→Events CTAs; public marketing/legal/cookie scenarios; prefer shipped e2e titles when behavior matches
- [x] 3.2 Port/rewrite `auth.feature` and `onboarding.feature` for MVP (Select wording only; no Radio/Checkbox)
- [x] 3.3 Rewrite `event-discovery.feature` — guest Discover preview, **public** `/events/:id`, member feed/filters/saved/map; no public full feed
- [x] 3.4 Port `admin-events.feature`; rewrite `admin-partners.feature` as venue CRUD only (drop portal-access / check-in QR scenarios from MVP file)
- [x] 3.5 Port/trim `admin-users.feature`, `booking.feature`, `credits-subscription.feature`, `waitlist.feature`, `profile.feature` for MVP (align routes to product sitemap)

## 4. Post-MVP feature parking

- [x] 4.1 Create `docs/product/features/post-mvp/` and move/park partner portal + check-in (combined `partner-and-checkin.feature` or two files) with a clear “Not in MVP” header
- [x] 4.2 Ensure top-level `docs/product/features/*.feature` has no partner-portal / `/partner/` MVP requirements

## 5. BDD / testing contract

- [x] 5.1 Write `docs/product/testing/bdd-and-e2e.md` — Gherkin SoT; one `e2e/specs/<basename>.spec.ts` per feature; verbatim `Scenario:` titles; proximity/layout selectors only; forbid `data-testid` / CSS-class / `#id`; file-input exception policy; `@skip-no-ui` coverage gate; Ladle/Theme Overview pointer
- [x] 5.2 Include known coverage gaps section from task 1.3 (title drift, `@skip-no-ui` on portal scenarios, locator debt for step 04)
- [x] 5.3 Update `docs/product/README.md` reading order: features + `product/user-journeys.md` + `testing/bdd-and-e2e.md` present (not “step 03 stub”)

## 6. Validation and cleanup

- [x] 6.1 Run `ls docs/product/features/*.feature docs/product/testing/bdd-and-e2e.md docs/product/product/user-journeys.md`
- [x] 6.2 Run `rg -n "Scenario:" docs/product/features/event-discovery.feature docs/product/features/static-pages.feature | head`
- [x] 6.3 Run `rg -n "proximity|getByRole|data-testid|Scenario:" docs/product/testing/bdd-and-e2e.md` — rules present
- [x] 6.4 Run `rg -n "partner-portal|/partner/" docs/product/features/*.feature` — no MVP partner portal requirements in top-level features
- [x] 6.5 Run `rg -n "public|without.*auth|guest" docs/product/features/event-discovery.feature` — public detail covered
- [x] 6.6 Spot-check: every MVP sitemap route mentioned by at least one journey or feature
- [x] 6.7 Mark step 03 done in `.dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md`
