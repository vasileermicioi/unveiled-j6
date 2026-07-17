## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/discovery-booking-ux-04-hardening.md`, parent release criteria in `discovery-booking-ux-parent-guide.md`, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Grep `docs/product/`, `docs/UX_RULES.md`, `docs/COMPONENTS.md`, and `e2e/` for “See details” / “Mehr sehen” / Unlock-on-card / PageHero-as-FAQ-default; list every stale hit
- [x] 1.3 Confirm shipped stories exist: `PageSectionHeader`, `EventCard / Guest — Book Now`, `EventDetailPage` guest/eligible/sold-out; note gaps only

## 2. Product docs & Gherkin

- [x] 2.1 Update `docs/product/ui/ui-component-map.md`: EventCard CTA precedence (guest Book Now / sold-out Waitlist → detail); add/refresh Event Detail checkout layout notes (identity + dark summary card, close Link, no credit POST on detail)
- [x] 2.2 Update `docs/product/ui/static-pages-content.md` Discover guest CTA to Book Now / Bin dabei; clarify FAQ/auth use `PageSectionHeader` (not PageHero-only pattern)
- [x] 2.3 Update `docs/product/sitemap/sitemap.md` and `docs/product/CHARTER.md` Discover CTA bullets from “See details” to Book Now
- [x] 2.4 Update `docs/product/extras/content-i18n-inventory.md` — remove obsolete guest “See details” / inactive “Unlock event” card-label notes; align with `bookNow` / Waitlist
- [x] 2.5 MODIFY `docs/product/features/static-pages.feature` Discover preview scenario step to Book Now / Bin dabei (keep scenario title); align `event-discovery.feature` guest detail notes if still describing stacked-detail-only behavior

## 3. Agent UI docs & stories

- [x] 3.1 Update `docs/UX_RULES.md` Event card CTA table: guest → Book Now / Bin dabei (Waitlist when sold out); drop “guests never see … book labels”
- [x] 3.2 Update `docs/COMPONENTS.md` to document `PageSectionHeader` and distinguish it from `PageHero`
- [x] 3.3 Fill any missing Ladle story for the three surfaces; otherwise leave stories as-is
- [x] 3.4 Optionally fix stale “See details” lines in `docs/manual-smoke-testing/` if still present after grep

## 4. Playwright / BDD

- [x] 4.1 Fix `e2e/specs/static-pages.spec.ts` Discover preview test: assert `/bin dabei|book now/i` (match `event-discovery.spec.ts`); keep scenario title verbatim
- [x] 4.2 Add or extend proximity assertions for FAQ (and auth if covered) ruled header via eyebrow/H1 role/name — no CSS-class or `data-testid` selectors
- [x] 4.3 Add or extend guest public-detail assertion for checkout summary/total + login (or unlock) CTA near the card (prefer existing `event-discovery` guest detail test)

## 5. Validation & cleanup

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (both exit 0)
- [x] 5.2 Run targeted Playwright: static-pages + discovery/detail specs related to this feature
- [x] 5.3 Grep sanity: no remaining product SoT claiming guest EventCard CTA is only “See details” without Book Now
- [x] 5.4 Walk parent release criteria; mark step 04 **done** and feature complete in `.dev-plan/current-iteration/discovery-booking-ux-parent-guide.md`; resolve decided Risks / open questions (defer MembershipInfoPage hero explicitly if still out of pattern)
