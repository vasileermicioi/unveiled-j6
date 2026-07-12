## Why

Steps 01–03 delivered Stripe activation, atomic `bookEvent`, confirm redemption, and confirmation email, but members still have no place to browse past tickets and the design-system storybook does not cover Phase 6 booking/membership shells. Without paginated My Tickets and Ladle coverage, the “ticket out” loop is only reachable via a one-shot confirm URL and is hard to demo without Playwright.

## What Changes

- Add auth-gated SSR `GET /:locale/bookings?page=` — member’s bookings newest-first, page size 20, empty state, redemption-oriented ticket rows linking to confirm / inline code+ICS affordances as appropriate
- Add a `@unveiled/db` list query for the signed-in user’s bookings (paginated; join event summary fields needed by the card)
- Extract shared ticket/redemption presentational components under `apps/web/app/components/booking/` reused by confirm and My Tickets
- Wire member nav “My Tickets” (`myBookings` DE/EN) for signed-in `USER` in app shell (desktop + mobile)
- Add Ladle stories in `apps/web`: booking confirm shell, ticket card, membership checkout shells (`guest` / `checkout` / `active` / `frozen` / past-due on book gate as needed)
- Audit new UI for HeroUI-only markup and theme tokens; no credits-rollover marketing claims

## Capabilities

### New Capabilities

- _(none)_ — My Tickets and Ladle shells extend existing `booking` and `design-system` capabilities

### Modified Capabilities

- `booking`: Authenticated paginated SSR My Tickets list (`/bookings`) with empty state and redemption-oriented ticket presentation
- `design-system`: Phase 6 Ladle stories for booking confirm, ticket card, and membership checkout shell states

## Impact

- **Code:** `packages/db` booking list query; `apps/web` `/bookings` route + shared booking components; `AppNavbar` / copy / mobile menu; Ladle stories under `apps/web/app/components/**/*.stories.tsx`; confirm page refactored to shared ticket UI
- **Deps:** none new — reuse existing HeroUI, Ladle, `@unveiled/db`
- **Downstream:** Consumed by `payments-booking-05` (Playwright booking journey + release demo script story locations)
- **Out of scope:** Playwright, staging `DEPLOYMENT.md`, waitlist, profile/billing, admin cancel/export, new Stripe/webhook behavior, member self-cancel
