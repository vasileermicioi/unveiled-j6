## Why

The membership page is a narrow centered card that looks sparse next to Discover / How it works / FAQ (`max-w-7xl` shells). Benefits are plain muted lines with no visual weight. The header still shows a redundant "Become a member" CTA beside Sign up and the Membership nav item. FAQ still shows a centered Back button that adds noise without helping navigation.

## What Changes

- Widen `/membership` to the same content shell as other marketing pages (`max-w-7xl`) and restructure the layout so headline, benefits, and CTA read as a full-width composition—not a skinny checkout stub.
- Make the three membership perks visually prominent (Discover-style value cards / bordered perk tiles), keeping existing DE/EN perk copy verbatim.
- Remove the guest header CTA "Mitglied werden" / "Become a member" from desktop and mobile drawer on all pages (Sign up + Membership nav remain).
- Remove the FAQ page Back button (and stop rendering `backButton` on that page).
- Update Ladle stories / static-page E2E only where assertions depend on the removed CTA or Back control.
- Record the intentional product delta vs. older `app-shell.md` / FAQ back-button notes in migration extras if needed during apply.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `static-marketing-pages`: Membership page layout and perk presentation; FAQ without Back button; guest chrome no longer exposes a separate "Become a member" header CTA.

## Impact

- **Touched:** `MembershipInfoPage.tsx` (+ stories/theme layout classes as needed), `AppNavbar.tsx`, `AppNavbarMenu.tsx`, `FaqPage.tsx`, possibly `copy.ts` / FAQ content types if `backButton` / `guestCta` become unused, `e2e/specs/static-pages.spec.ts` if it asserts the removed controls.
- **Not touched:** Stripe checkout (Phase 6), membership pricing copy, Discover/How-it-works page content, Uber theme color tokens (layout + component composition only).
- **Risk:** Low — marketing/chrome UX only; no auth or schema changes.
