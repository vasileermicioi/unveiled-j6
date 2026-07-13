## Why

Step 01 shipped `waitlist_entries` and domain processors (`joinWaitlist`, `cancelWaitlistEntry`, `processWaitlistForEvent`), but members still cannot join or cancel from the app, sold-out UX still rejects without a waitlist path, and promotions do not notify via email. Without this slice, Phase 7’s sold-out → join → capacity up → promoted → email demo cannot run.

## What Changes

- Add locale-prefixed SSR routes `/:locale/events/:id/waitlist` (join form POST → `joinWaitlist`) and `/:locale/waitlist/:id/cancel` (confirm + POST → `cancelWaitlistEntry`, owner-scoped)
- HeroUI page components for join confirmation, cancel confirm, and sold-out / insufficient-capacity waitlist CTA on event detail and book failure paths
- Auth: anonymous join → sign-in with return path; duplicate join shows existing `WAITING` status/position (no second row)
- `@unveiled/email`: `sendWaitlistPromotion` (redemption + ICS patterns from booking confirmation); invoke post-commit after successful promotions — log failures, never roll back booking/promotion
- Hook capacity increase (`updateEvent` / admin edit POST) → `processWaitlistForEvent` when remaining capacity rises; document call site
- Seed at least one sold-out (zero-remaining) demo event; note id/title for later `DEPLOYMENT.md`
- Optional minimal “my waitlist” affordance for cancel navigation (user-scoped only), if needed
- **No** profile/billing, admin waitlist HQ, Playwright, or full Ladle suite (later steps)

## Capabilities

### New Capabilities

- _(none)_ — member waitlist UI and promotion email extend the existing `waitlist` capability from step 01

### Modified Capabilities

- `waitlist`: SSR join/cancel surfaces; sold-out offers waitlist join; promotion notification email after auto-promote
- `booking`: Phase 6 “sold-out without waitlist” requirement superseded — booking still rejects when capacity is insufficient, but eligible members are offered the waitlist join flow

## Impact

- **Code:** `apps/web` waitlist routes + components; event detail / book sold-out CTA wiring; admin event edit (or `updateEvent`) capacity-increase hook; `@unveiled/email` promotion sender + unit test; demo seed update
- **Deps:** reuse `@unveiled/db` waitlist exports + `createTxDb`; Resend via existing email package env (`RESEND_API_KEY`, `DAILY_CODES_FROM_EMAIL`)
- **Auth:** `waitlist` already reserved under event detail in `auth-middleware`; cancel route must be auth-gated and owner-scoped
- **Downstream:** Consumed by `waitlist-account-05-ladle-e2e-and-release` (Playwright + Ladle + `DEPLOYMENT.md`)
- **Docs:** step plan in `.dev-plan/current-iteration/waitlist-account-02-waitlist-ui-and-email.md`; mark step 02 done in parent guide after apply; note any new i18n strings for later inventory sync
- **Out of scope:** `/admin/waitlist`, profile/billing/preferences, GDPR routes, Playwright, full Ladle, admin booking cancel UI
