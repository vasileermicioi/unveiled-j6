# BDD coverage matrix (MVP)

Single inventory of product Gherkin Scenarios → Playwright tests for Phase 5.5+.

**Status vocabulary:**

| Status | Meaning |
|---|---|
| `pass` | Titled Playwright test exists and is expected to run (env skips like missing R2 are OK) |
| `skip` | `@skip-no-ui` or hard `test.skip(true, …)` — usually post-MVP |
| `deferred` | MVP-required; named deferral with target phase in Notes |
| `unshipped` | Feature not implemented yet; e2e ships with Phases 6–8 |

**Rules:** [`bdd-and-e2e.md`](./bdd-and-e2e.md) · **Harness:** [`e2e/README.md`](../../../e2e/README.md)

## MVP features

| Feature file | Scenario title | Playwright | Status | Notes |
|---|---|---|---|---|
| `admin-events.feature` | Create a single event | `e2e/specs/admin-events.spec.ts` · `Scenario: Create a single event` | `pass` |  |
| `admin-events.feature` | Supply the event image as a direct upload | `e2e/specs/admin-events.spec.ts` · `Scenario: Supply the event image as a direct upload` | `pass` |  |
| `admin-events.feature` | Supply the event image as a remote URL | `e2e/specs/admin-events.spec.ts` · `Scenario: Supply the event image as a remote URL` | `pass` |  |
| `admin-events.feature` | Event image is required | `e2e/specs/admin-events.spec.ts` · `Scenario: Event image is required` | `pass` |  |
| `admin-events.feature` | Redemption configuration validation on create | `e2e/specs/admin-events.spec.ts` (create flows) | `pass` | Covered alongside event create |
| `admin-events.feature` | Shared generated code is created automatically | `e2e/specs/admin-events.spec.ts` · `Scenario: Shared generated code is created automatically` | `pass` |  |
| `admin-events.feature` | Default values on creation | `e2e/specs/admin-events.spec.ts` · `Scenario: Default values on creation` | `pass` |  |
| `admin-events.feature` | Create an event series with manual slots | `e2e/specs/admin-events.spec.ts` · `Scenario: Create an event series with manual slots` | `pass` |  |
| `admin-events.feature` | Create an event series with a date-range builder | `e2e/specs/admin-events.spec.ts` · `Scenario: Create an event series with a date-range builder` | `pass` |  |
| `admin-events.feature` | Update an event's capacity | `e2e/specs/admin-events.spec.ts` · `Scenario: Update an event's capacity` | `pass` |  |
| `admin-events.feature` | Edit event details | `e2e/specs/admin-events.spec.ts` · `Scenario: Edit event details` | `pass` |  |
| `admin-events.feature` | Delete an event | `e2e/specs/admin-events.spec.ts` · `Scenario: Delete an event` | `pass` |  |
| `admin-events.feature` | Optional accessibility and audience metadata | `e2e/specs/admin-events.spec.ts` · `Scenario: Optional accessibility and audience metadata` | `pass` |  |
| `admin-events.feature` | Export redemption codes for an event | `e2e/specs/admin-events.spec.ts` · `Scenario: Export redemption codes for an event` | `pass` |  |
| `admin-events.feature` | Seed demo data (empty environment only) | `e2e/specs/admin-events.spec.ts` · `Scenario: Seed demo data (empty environment only)` | `skip` | hard-skipped in e2e |
| `admin-events.feature` | Seed demo data is a no-op when data exists | `e2e/specs/admin-events.spec.ts` · `Scenario: Seed demo data is a no-op when data exists` | `pass` |  |
| `admin-partners.feature` | Create a partner | `e2e/specs/admin-partners.spec.ts` · `Scenario: Create a partner` | `pass` |  |
| `admin-partners.feature` | Supply the partner logo as a direct upload or a remote URL | `e2e/specs/admin-partners.spec.ts` · `Scenario: Supply the partner logo as a direct upload or a remote URL` | `pass` | R2 env-skip when vars missing |
| `admin-partners.feature` | Partner creation validation | `e2e/specs/admin-partners.spec.ts` (validation paths in create flows) | `pass` | Covered alongside create partner |
| `admin-partners.feature` | Edit a partner | `e2e/specs/admin-partners.spec.ts` · `Scenario: Edit a partner` | `pass` |  |
| `admin-partners.feature` | Renaming a partner propagates to its events | `e2e/specs/admin-partners.spec.ts` · `Scenario: Renaming a partner propagates to its events` | `pass` |  |
| `admin-partners.feature` | Delete a partner | `e2e/specs/admin-partners.spec.ts` · `Scenario: Delete a partner` | `skip` | post-MVP portal/QR — leave skipped |
| `admin-users.feature` | List all members | — | `unshipped` | Phase 8 |
| `admin-users.feature` | Search members | — | `unshipped` | Phase 8 |
| `admin-users.feature` | View a member's collapsed summary | — | `unshipped` | Phase 8 |
| `admin-users.feature` | Expand a member's detail / "intel" panel | — | `unshipped` | Phase 8 |
| `admin-users.feature` | Adjust a member's credits from their detail panel | — | `unshipped` | Phase 8 |
| `admin-users.feature` | Freeze or unfreeze a member from their detail panel | — | `unshipped` | Phase 8 |
| `admin-users.feature` | Issue a complimentary ticket to a member | — | `unshipped` | Phase 8 |
| `auth.feature` | Sign up as a new member | `e2e/specs/auth.spec.ts` · `Scenario: Sign up as a new member` | `pass` |  |
| `auth.feature` | Signup validation | `e2e/specs/auth.spec.ts` · `Scenario Outline: Signup validation — …` | `pass` | Outline examples covered as separate titled tests |
| `auth.feature` | Log in with valid credentials | `e2e/specs/auth.spec.ts` · `Scenario: Log in with valid credentials` | `pass` |  |
| `auth.feature` | Post-login routing by role and state | `e2e/specs/auth.spec.ts` · covered via login + role protection scenarios | `pass` | Behavior asserted across auth scenarios |
| `auth.feature` | Log in with invalid credentials | `e2e/specs/auth.spec.ts` · `Scenario: Log in with invalid credentials` | `pass` |  |
| `auth.feature` | Log in without a password | `e2e/specs/auth.spec.ts` · `Scenario: Log in without a password` | `pass` |  |
| `auth.feature` | Request a password reset | `e2e/specs/auth.spec.ts` · `Scenario: Request a password reset` | `pass` |  |
| `auth.feature` | Request a password reset with no email | `e2e/specs/auth.spec.ts` · `Scenario: Request a password reset with no email` | `pass` |  |
| `auth.feature` | Log out | `e2e/specs/auth.spec.ts` · `Scenario: Log out` | `pass` |  |
| `auth.feature` | Route protection for authenticated-only areas | `e2e/specs/auth.spec.ts` · `Scenario: Route protection for authenticated-only areas` | `pass` |  |
| `auth.feature` | Route protection by role | `e2e/specs/auth.spec.ts` · `Scenario: Route protection by role` | `pass` |  |
| `auth.feature` | Sign up or log in with Google | `e2e/specs/auth.spec.ts` · `Scenario: Sign up or log in with Google` | `deferred` | Phase 8 — Google OAuth / GDPR named deferral |
| `auth.feature` | Social login never creates a PARTNER or ADMIN account | `e2e/specs/auth.spec.ts` · `Scenario: Social login never creates a PARTNER or ADMIN account` | `deferred` | Phase 8 — Google OAuth / GDPR named deferral |
| `auth.feature` | Request a data export | `e2e/specs/auth.spec.ts` · `Scenario: Request a data export` | `deferred` | Phase 8 — Google OAuth / GDPR named deferral |
| `auth.feature` | Request account deletion | `e2e/specs/auth.spec.ts` · `Scenario: Request account deletion` | `deferred` | Phase 8 — Google OAuth / GDPR named deferral |
| `auth.feature` | Account deletion is distinct from subscription cancellation | `e2e/specs/auth.spec.ts` · `Scenario: Account deletion is distinct from subscription cancellation` | `deferred` | Phase 8 — Google OAuth / GDPR named deferral |
| `auth.feature` | Admin can process account deletion on a member's behalf | `e2e/specs/auth.spec.ts` · `Scenario: Admin can process account deletion on a member's behalf` | `deferred` | Phase 8 — Google OAuth / GDPR named deferral |
| `booking.feature` | Booking requires authentication | `e2e/specs/booking.spec.ts` · `Scenario: Booking requires authentication` | `pass` | Needs `DATABASE_URL` for seeded event id |
| `booking.feature` | Booking requires an active subscription | `e2e/specs/booking.spec.ts` · `Scenario: Booking requires an active subscription` | `pass` |  |
| `booking.feature` | Successful booking | `e2e/specs/booking.spec.ts` · `Scenario: Successful booking` | `pass` | Seeds ACTIVE via billing fixture |
| `booking.feature` | Redemption info by ticket type and secret code mode | `e2e/specs/booking.spec.ts` · outline rows | `pass` | SECRET_CODE/MANUAL pass; SHARED/UNIQUE/VOUCHER deferred (no seed) |
| `booking.feature` | Sold out — automatic waitlist offer | `e2e/specs/booking.spec.ts` · `Scenario: Sold out — automatic waitlist offer` | `deferred` | Phase 7 — waitlist UI |
| `booking.feature` | Booking fails — insufficient credits | `e2e/specs/booking.spec.ts` · `Scenario: Booking fails — insufficient credits` | `pass` |  |
| `booking.feature` | Booking fails — subscription frozen (past due) | `e2e/specs/booking.spec.ts` · `Scenario: Booking fails — subscription frozen (past due)` | `pass` |  |
| `booking.feature` | Idempotent retry | `e2e/specs/booking.spec.ts` · `Scenario: Idempotent retry` | `skip` | Covered by `book-event.integration.test` |
| `booking.feature` | Post-booking actions | `e2e/specs/booking.spec.ts` · `Scenario: Post-booking actions` | `pass` |  |
| `booking.feature` | Booking confirmation email | `e2e/specs/booking.spec.ts` · `Scenario: Booking confirmation email` | `skip` | Staging Resend checklist — no inbox harness |
| `booking.feature` | Admin cancels a confirmed booking | `e2e/specs/booking.spec.ts` · `Scenario: Admin cancels a confirmed booking` | `deferred` | Phase 8 |
| `booking.feature` | Cannot cancel a booking that is not confirmed | `e2e/specs/booking.spec.ts` · `Scenario: Cannot cancel a booking that is not confirmed` | `deferred` | Phase 8 |
| `booking.feature` | Members cannot self-cancel or self-refund | `e2e/specs/booking.spec.ts` · `Scenario: Members cannot self-cancel or self-refund` | `pass` |  |
| `credits-subscription.feature` | New signups start inactive with starter credits | `e2e/specs/credits-subscription.spec.ts` · `Scenario: New signups start inactive with starter credits` | `pass` |  |
| `credits-subscription.feature` | Activating a subscription via real Stripe Checkout | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Activating a subscription via real Stripe Checkout` | `skip` | Opt-in `E2E_STRIPE_CHECKOUT=1`; staging smoke SoT |
| `credits-subscription.feature` | Checkout blocked while frozen | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Checkout blocked while frozen` | `pass` | Seeds `UNPAID` |
| `credits-subscription.feature` | Already-active member revisits checkout | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Already-active member revisits checkout` | `pass` |  |
| `credits-subscription.feature` | Failed payment marks the account past due | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Failed payment marks the account past due` | `pass` | Seeds `PAST_DUE` + book gate; full Stripe fail = staging webhook |
| `credits-subscription.feature` | Recovering from past due | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Recovering from past due` | `deferred` | Phase 7 — Customer Portal |
| `credits-subscription.feature` | Monthly renewal resets credits (no rollover) | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Monthly renewal resets credits (no rollover)` | `skip` | Billing package / webhook tests |
| `credits-subscription.feature` | Cancelling a subscription | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Cancelling a subscription` | `deferred` | Phase 7 |
| `credits-subscription.feature` | Cancellation takes effect at period end | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Cancellation takes effect at period end` | `deferred` | Phase 7 |
| `credits-subscription.feature` | Reactivating after cancellation | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Reactivating after cancellation` | `deferred` | Phase 7 |
| `credits-subscription.feature` | Booking gate by subscription status | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Booking gate by subscription status` | `pass` |  |
| `credits-subscription.feature` | Admin manually adjusts a member's credits | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin manually adjusts a member's credits` | `deferred` | Phase 8 |
| `credits-subscription.feature` | Admin adjustment rejects a zero amount | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin adjustment rejects a zero amount` | `deferred` | Phase 8 |
| `credits-subscription.feature` | Admin issues a manual credit refund (support gesture) | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin issues a manual credit refund (support gesture)` | `deferred` | Phase 8 |
| `credits-subscription.feature` | Admin freezes a member's account | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin freezes a member's account` | `deferred` | Phase 8 |
| `credits-subscription.feature` | Admin unfreezes a member's account | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin unfreezes a member's account` | `deferred` | Phase 8 |
| `credits-subscription.feature` | Admin creates a complimentary ticket | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Admin creates a complimentary ticket` | `deferred` | Phase 8 |
| `event-discovery.feature` | Public discovery preview for guests | `e2e/specs/event-discovery.spec.ts` · `Scenario: Public discovery preview for guests` | `pass` |  |
| `event-discovery.feature` | Guest can view public event detail without authentication | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest can view public event detail without authentication` | `pass` |  |
| `event-discovery.feature` | Guest path to full browse requires signup or login | `e2e/specs/event-discovery.spec.ts` · `Scenario: Guest path to full browse requires signup or login` | `pass` |  |
| `event-discovery.feature` | Default feed shows today's events only | `e2e/specs/event-discovery.spec.ts` · `Scenario: Default feed shows today's events only` | `pass` |  |
| `event-discovery.feature` | Events with invalid or past dates are hidden | `e2e/specs/event-discovery.spec.ts` · `Scenario: Events with invalid or past dates are hidden` | `pass` |  |
| `event-discovery.feature` | Filter by category | `e2e/specs/event-discovery.spec.ts` · `Scenario: Filter by category` | `pass` |  |
| `event-discovery.feature` | Filter by partner (venue) | `e2e/specs/event-discovery.spec.ts` · `Scenario: Filter by partner (venue)` | `pass` |  |
| `event-discovery.feature` | Filter by custom date range | `e2e/specs/event-discovery.spec.ts` · `Scenario: Filter by custom date range` | `pass` |  |
| `event-discovery.feature` | Reset filters | `e2e/specs/event-discovery.spec.ts` · `Scenario: Reset filters` | `pass` |  |
| `event-discovery.feature` | No results | `e2e/specs/event-discovery.spec.ts` · `Scenario: No results` | `pass` |  |
| `event-discovery.feature` | Map view mirrors the filtered feed | `e2e/specs/event-discovery.spec.ts` · `Scenario: Map view mirrors the filtered feed` | `pass` |  |
| `event-discovery.feature` | Saved events view | `e2e/specs/event-discovery.spec.ts` · `Scenario: Saved events view` | `pass` |  |
| `event-discovery.feature` | Save and unsave an event | `e2e/specs/event-discovery.spec.ts` · `Scenario: Save and unsave an event` | `pass` |  |
| `event-discovery.feature` | Saving requires authentication | `e2e/specs/event-discovery.spec.ts` · `Scenario: Saving requires authentication` | `pass` |  |
| `onboarding.feature` | Onboarding is required before using the app | `e2e/specs/onboarding.spec.ts` · `Scenario: Onboarding is required before using the app` | `pass` |  |
| `onboarding.feature` | Non-USER roles skip onboarding | `e2e/specs/onboarding.spec.ts` · `Scenario: Non-USER roles skip onboarding` | `pass` |  |
| `onboarding.feature` | Already-onboarded users skip onboarding | `e2e/specs/onboarding.spec.ts` · `Scenario: Already-onboarded users skip onboarding` | `pass` |  |
| `onboarding.feature` | Step 1 — age group (skippable) | `e2e/specs/onboarding.spec.ts` · `Scenario: Step 1 — age group (skippable)` | `pass` |  |
| `onboarding.feature` | Step 2 — interests and moods | `e2e/specs/onboarding.spec.ts` · `Scenario: Step 2 — interests and moods` | `pass` |  |
| `onboarding.feature` | Step 3 — districts and travel radius | `e2e/specs/onboarding.spec.ts` · `Scenario: Step 3 — districts and travel radius` | `pass` |  |
| `onboarding.feature` | Step 4 — timing, days, languages, accessibility | `e2e/specs/onboarding.spec.ts` · `Scenario: Step 4 — timing, days, languages, accessibility` | `pass` |  |
| `onboarding.feature` | Completing onboarding | `e2e/specs/onboarding.spec.ts` · `Scenario: Completing onboarding` | `pass` |  |
| `profile.feature` | View and edit identity | — | `unshipped` | Phase 7 |
| `profile.feature` | Change password | — | `unshipped` | Phase 7 |
| `profile.feature` | View billing information | — | `unshipped` | Phase 7 |
| `profile.feature` | Update billing information | — | `unshipped` | Phase 7 |
| `profile.feature` | Cancel subscription | — | `unshipped` | Phase 7 |
| `profile.feature` | Access account deletion and data export | — | `unshipped` | Phase 7 |
| `profile.feature` | Edit cultural preferences ("Vibes") | — | `unshipped` | Phase 7 |
| `profile.feature` | View credit wallet | — | `unshipped` | Phase 7 |
| `profile.feature` | Refill credits | — | `unshipped` | Phase 7 |
| `static-pages.feature` | Discover is the home page | `e2e/specs/static-pages.spec.ts` · `Scenario: Discover is the home page` | `pass` |  |
| `static-pages.feature` | Discover preview links to public event detail | `e2e/specs/static-pages.spec.ts` · `Scenario: Discover preview links to public event detail` | `pass` |  |
| `static-pages.feature` | Discover CTA path to the full member events feed | `e2e/specs/static-pages.spec.ts` · `Scenario: Discover CTA path to the full member events feed` | `pass` | CTA → signup?returnTo=/events; onboarding finish still → membership; auto returnTo polish → Phase 8 |
| `static-pages.feature` | How it works | `e2e/specs/static-pages.spec.ts` · `Scenario: How it works` | `pass` |  |
| `static-pages.feature` | FAQ | `e2e/specs/static-pages.spec.ts` · `Scenario: FAQ` | `pass` |  |
| `static-pages.feature` | Legacy /discover redirects to locale home | `e2e/specs/static-pages.spec.ts` · `Scenario: Legacy /discover redirects to locale home` | `pass` |  |
| `static-pages.feature` | Bilingual content | `e2e/specs/static-pages.spec.ts` · `Scenario: Bilingual content` | `pass` |  |
| `static-pages.feature` | Legal pages exist and are linked from the footer | `e2e/specs/static-pages.spec.ts` · `Scenario: Legal pages exist and are linked from the footer` | `pass` |  |
| `static-pages.feature` | Cookie consent banner on first visit | `e2e/specs/static-pages.spec.ts` · `Scenario: Cookie consent banner on first visit` | `pass` |  |
| `static-pages.feature` | Declining consent disables the map embed | `e2e/specs/static-pages.spec.ts` · `Scenario: Declining consent disables the map embed` | `pass` |  |
| `static-pages.feature` | Error tracking is not gated behind consent | `e2e/specs/static-pages.spec.ts` · `Scenario: Error tracking is not gated behind consent` | `pass` | Phase 9 Sentry not wired; asserts no consent gate today |
| `waitlist.feature` | Join the waitlist | — | `unshipped` | Phase 7 |
| `waitlist.feature` | Joining the waitlist requires authentication | — | `unshipped` | Phase 7 |
| `waitlist.feature` | Duplicate waitlist join is prevented | — | `unshipped` | Phase 7 |
| `waitlist.feature` | I can cancel my own waitlist entry | — | `unshipped` | Phase 7 |
| `waitlist.feature` | Automatic promotion when capacity frees up | — | `unshipped` | Phase 7 |
| `waitlist.feature` | Promotion is skipped if I'm no longer eligible | — | `unshipped` | Phase 7 |
| `waitlist.feature` | Promotion respects queue order and partial capacity | — | `unshipped` | Phase 7 |
| `waitlist.feature` | Admin can manually trigger promotion for a specific entry | — | `unshipped` | Phase 7 |
| `waitlist.feature` | Admin visibility | — | `unshipped` | Phase 7 |
| `waitlist.feature` | User visibility is scoped to their own entries | — | `unshipped` | Phase 7 |

## Post-MVP (`features/post-mvp/`)

Partner portal / check-in is **out of MVP**. Overlapping stubs in `e2e/specs/admin-partners.spec.ts` remain `@skip-no-ui` until post-MVP.

| Feature file | Scenario title | Playwright | Status | Notes |
|---|---|---|---|---|
| `post-mvp/partner-and-checkin.feature` | Regenerate a partner's venue check-in QR token | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Create partner portal login access | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Creating portal access when it already exists | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Creating portal access requires a valid email | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Creating portal access with an email already in use | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | View partner dashboard summary | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | View my venue check-in QR link | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | View guest list | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Guest list is scoped to my venue only | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Search the guest list | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Filter the guest list by event | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Manually check in a guest | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Check-in action is disabled outside the window or after use | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Export guest codes | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Create my own event | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Edit my own event | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Delete my own event | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Cannot manage another partner's events | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Cannot reassign an event to another partner | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Admin retains full override across all partners | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Partner manually checks in a guest (door) | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Admin can check in any booking | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Cannot check in outside the window | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Cannot check in a booking that isn't confirmed | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Re-checking in an already-used booking | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Guest self-check-in via venue QR code | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Guest scans venue QR while signed out | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Guest scans venue QR with no eligible booking | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Re-scanning an already-used venue QR check-in | — | `skip` | post-MVP |
| `post-mvp/partner-and-checkin.feature` | Venue token mismatch | — | `skip` | post-MVP |

## Locator / harness notes (step 03)

| Item | Status | Notes |
|---|---|---|
| Admin event date/time `input[name=…]` (G7) | remediated | `getByLabel` / roles in admin-events + fixtures |
| File inputs (`image`, `logo`) | exception | `// BDD exception: file-input` |
| `e2e/fixtures/onboarding.ts` `page.locator("label").filter` | deferred polish | proximity-adjacent; left as-is in step 03 |
| Remote-URL event image | pass | unskipped in step 03 |
