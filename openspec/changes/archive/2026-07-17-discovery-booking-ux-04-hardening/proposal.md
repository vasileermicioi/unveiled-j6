## Why

Steps 01–03 shipped `PageSectionHeader`, EventCard **Book Now** → public detail, and the checkout-focused event detail page, but product SoT, Gherkin, Playwright, and agent UI docs still describe “See details” / stacked-detail / PageHero-only headers. Without this hardening pass, agents and e2e keep asserting obsolete contracts and the parent **Discovery & Booking Surfaces UX** feature cannot be marked complete.

## What Changes

- Update `docs/product/` passages that contradict shared `PageSectionHeader`, Book Now→detail, and checkout-focused detail (component map, static pages content, sitemap, charter, i18n inventory).
- Update Gherkin scenario titles/steps that name “See details” to Book Now / equivalent; prefer MODIFY existing scenarios over duplicates.
- Fix Playwright coverage: Discover Book Now → detail; FAQ/auth ruled header presence (role/name assertions, not CSS-class selectors); guest checkout card CTA on detail.
- Confirm Ladle/Theme stories cover `PageSectionHeader`, EventCard Book Now (guest), and EventDetail checkout states (already present — verify, fill gaps only).
- Refresh agent UI docs (`docs/COMPONENTS.md`, `docs/UX_RULES.md`) that still document PageHero-only headers or guest “See details”.
- Mark all four steps done in the parent guide; resolve open questions decided during implementation.

**Out of scope:** Further visual redesign beyond e2e regression fixes; partner portal; Phase 6+ Stripe/billing UI; new domain features (waitlist algorithm, credit economics).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-discovery`: Discover EventCard CTAs SHALL use Book Now / Bin dabei for bookable events and navigate to public `/events/:id`; documentation and BDD SHALL describe this path (not “See details” as the sole guest CTA). Product docs SHALL also describe the checkout-focused public detail surface shipped in step 03.
- `platform-foundation`: Product UI docs SHALL describe shared on-yellow `PageSectionHeader` (eyebrow + headline + rule) as the default page/section header for Discover, FAQ, auth, and member browse surfaces, distinct from optional bordered `PageHero` on long-form marketing/legal pages.

## Impact

- **Product docs:** `docs/product/ui/ui-component-map.md`, `static-pages-content.md`, `sitemap/sitemap.md`, `CHARTER.md`, `extras/content-i18n-inventory.md`; Gherkin `features/static-pages.feature`, `event-discovery.feature` (+ booking notes if CTA/detail paths are stale).
- **Agent UI docs:** `docs/COMPONENTS.md`, `docs/UX_RULES.md` (and related notes only if they still claim PageHero-only / See details).
- **E2E:** `e2e/specs/static-pages.spec.ts` (Discover CTA currently asserts `/mehr sehen|see details/i` — **broken vs shipped UI**); add/adjust discovery/detail specs for header + checkout card.
- **Stories:** verify `PageSectionHeader.stories.tsx`, `EventCard.stories.tsx` (Guest — Book Now), `EventDetailPage.stories.tsx` (guest/eligible/sold-out); add only if missing.
- **Planning:** `.dev-plan/current-iteration/discovery-booking-ux-parent-guide.md` — mark step 04 done and feature complete.
- **Depends on:** `discovery-booking-ux-03-event-detail-checkout` (done/archived).
- **Consumed by:** closes the Discovery & Booking Surfaces UX feature.
- **Verification:** `bun run lint`, `bun run typecheck`, targeted Playwright (static pages + discovery/detail); grep sanity — no product SoT claiming guest EventCard CTA is only “See details” without Book Now.
)
