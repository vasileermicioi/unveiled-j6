## Why

Membership marketing/checkout still presents plan benefits as a horizontal three-card strip (refs: `.dev-plan/manual-test-sub-page.png`, `.dev-plan/manual-test-post-sub-page.png`), while guest home already uses a clearer vertical icon-bullet list. Separately, book/confirm (and peer booking-adjacent pages) still use bare centered `Heading` chrome instead of the shared `PageSectionHeader` pattern used on Discover/FAQ (ref: `.dev-plan/manual-test-book-page.png`). This step closes both gaps so the subscribe → book smoke path matches the established on-yellow page language.

## What Changes

- Replace the membership perk `SectionCard` three-up grid with a **vertical** benefits list: each row = distinct icon bullet + localized perk text.
- Apply that list on all `MembershipInfoPage` views that show perks (guest, checkout/error, active, frozen as applicable).
- Theme the list under `@layer components` (e.g. `.membership-benefits__*`); Tailwind for layout only.
- Reuse existing DE/EN perk strings from `membership.ts` unless a string is wrong; presentation-only by default.
- Migrate book-event and booking confirmation page titles to `PageSectionHeader` (eyebrow + headline + ruled pattern); include waitlist join/cancel if they share the same one-off title chrome in the same pass.
- Update product UI docs (`static-pages-content.md` / `ui-component-map.md`) so membership benefits layout and booking header usage are documented.
- Update Ladle `MembershipInfoPage` stories to reflect the vertical list.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `credits-subscription`: Membership marketing benefits SHALL render as a vertical icon-bullet list (not horizontal three-up perk cards).
- `platform-foundation`: Booking (and peer member flows that use the default on-yellow page title) SHALL use shared `PageSectionHeader` instead of one-off title chrome.

## Impact

- **UI:** `apps/web/app/components/marketing/MembershipInfoPage.tsx` (+ stories); booking pages under `apps/web/app/components/booking/` (`BookEventPage`, `BookConfirmPage`); optionally waitlist join/cancel in the same header pass.
- **Copy:** `apps/web/app/lib/content/membership.ts` (reuse perks; add eyebrow strings for book/confirm if missing); booking/waitlist copy modules as needed for `PageSectionHeader` eyebrow.
- **Theme:** `apps/web/app/styles/globals.css` — `.membership-benefits__*` (can adapt guest-home perk icon treatment for yellow-page cream/dark surfaces, with distinct icons per item).
- **Docs:** `docs/product/ui/static-pages-content.md`, `docs/product/ui/ui-component-map.md` (benefits layout + header coverage).
- **Precedent:** Guest home vertical perks in `LandingPage.tsx` / `.guest-home__perk*` — visual reference, not a requirement to share class names.
- **Unchanged:** Stripe/price/copy product changes; guest-home redesign; map popup close (step 05); auth width / native forms (steps 02–03 done); membership hero card CTA layout (keep hero; only swap perk presentation).
- **Source brief:** `.dev-plan/current-iteration/manual-test-ux-04-membership-benefits-and-page-headers.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- **Depends on (soft):** `manual-test-ux-03-native-forms-and-preference-i18n` (done)
- **Consumed by:** `manual-test-ux-05-map-close-and-hardening`
- **Verification:** `bun run lint`, `bun run typecheck`; manual `/en/membership` vertical icon benefits; manual book page header matches Discover/FAQ pattern; Ladle membership story updated
