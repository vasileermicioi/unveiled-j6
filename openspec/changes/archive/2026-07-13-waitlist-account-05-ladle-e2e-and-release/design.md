## Context

Phase 7 steps 01–04 shipped waitlist schema/domain/UI + promotion email, profile identity/preferences, and `/profile/billing` (Customer Portal + cancel → `CANCELLED_PENDING`). Coverage matrix still marks waitlist/profile rows `unshipped`, and Phase 6 specs still `test.skip` portal/cancel/waitlist-offer scenarios with “Phase 7” reasons.

This step closes Phase 7: Ladle stories, Playwright mapping, matrix/`e2e/README.md` updates, staging demo evidence, and `DEPLOYMENT.md` — then **stop before Phase 8**.

Sources: `.dev-plan/current-iteration/waitlist-account-05-ladle-e2e-and-release.md`, parent guide, `docs/product/features/{waitlist,profile,credits-subscription}.feature`, `docs/product/testing/bdd-and-e2e.md`, `packages/billing/README.md` (portal dashboard handoff), seed title `Sold Out: Waitlist Demo Night` (`DEMO_DISCOVERY_TITLES.soldOutWaitlist`).

## Goals / Non-Goals

**Goals:**

- Ladle stories for waitlist join/cancel and profile billing/preferences (and related profile pages as needed) using existing component props + story fixtures.
- Playwright: `waitlist.spec.ts`, `profile.spec.ts`; un-skip Phase 7 rows in `credits-subscription.spec.ts` and booking waitlist offer.
- Named Phase 8 deferrals for admin waitlist + GDPR page mechanics; Stripe Portal deep interactions follow Phase 6 Checkout opt-in/seed pattern.
- Coverage matrix + `e2e/README.md` reflect pass/skip/deferred.
- `DEPLOYMENT.md` Phase 7 section: sold-out seed, portal config, demo script, stop before Phase 8.
- Staging demo walkthrough recorded.

**Non-Goals:**

- Implementing `/admin/waitlist`, manual promote UI, admin booking cancel, GDPR export/delete pages, SEO polish, Sentry.
- Partner portal / check-in.
- New product routes or Stripe products.
- Claiming Playwright can drive the full Stripe Customer Portal hosted UI without opt-in/mock (document like Checkout).

## Decisions

### 1. Stories co-located under `apps/web` page components

Add `*.stories.tsx` beside:

| Component | Story states (minimum) |
|---|---|
| `WaitlistJoinPage` | form; status (created); status (existing/duplicate) |
| `WaitlistCancelPage` | confirm |
| `BillingPage` | ACTIVE; PAST_DUE; CANCELLED_PENDING; INACTIVE; missing customer |
| `BillingCancelPage` | confirm |
| `PreferencesPage` / `PreferencesForm` | default filled; validation error if props allow |
| `ProfilePage` | wallet + identity (optional if already thin) |

Follow `BookEventPage.stories.tsx` pattern: `@ladle/react` `Story`, content helpers, `storyLocale` / mock fixtures under `apps/web/app/components/stories/`. No new DS primitives in `@unveiled/ui` unless a shared piece is missing (prefer page stories).

**Rationale:** Design-system policy already colocates app page stories with components; waitlist/profile are app-owned.

### 2. Playwright file → feature mapping (verbatim titles)

| Feature | Spec file |
|---|---|
| `waitlist.feature` | `e2e/specs/waitlist.spec.ts` |
| `profile.feature` | `e2e/specs/profile.spec.ts` |
| Existing | Update `credits-subscription.spec.ts`, `booking.spec.ts` |

Rules from `bdd-and-e2e.md`:

- `test("Scenario: <exact Gherkin title>", …)`
- Proximity selectors only (`getByRole` / `getByLabel` / `getByText` / filter / nth) — no `data-testid`, no CSS class selectors.
- Prefer seed + admin capacity bump for promotion e2e (sold-out seed event → join → admin edit capacity → assert booking/promotion), not inventing member booking-cancel.

### 3. In-scope vs deferred scenario matrix

**Waitlist — implement:**

- Join the waitlist
- Joining the waitlist requires authentication
- Duplicate waitlist join is prevented
- I can cancel my own waitlist entry
- Automatic promotion when capacity frees up (admin capacity increase)
- Promotion is skipped if I'm no longer eligible (seed ineligible member + capacity bump; assert skip / next eligible as harness allows)
- Promotion respects queue order and partial capacity (as far as harness allows with multiple seeded users)
- User visibility is scoped to their own entries (if a member “my waitlist” surface exists; otherwise assert cancel/status only shows own entry — document if UI is entry-scoped only)

**Waitlist — deferred Phase 8:**

- Admin can manually trigger promotion for a specific entry
- Admin visibility

**Profile — implement:**

- View and edit identity
- Change password (reach auth UI entry; full Neon Auth change may be smoke/assert entry if e2e cannot complete provider flow)
- View billing information
- Update billing information (portal CTA / SSR POST redirect to Stripe — deep portal interaction opt-in or assert redirect URL host)
- Cancel subscription (in-app cancel confirm → `CANCELLED_PENDING`)
- Edit cultural preferences ("Vibes")
- View credit wallet
- Refill credits → membership

**Profile — deferred / soft:**

- Access account deletion and data export — assert entry links if present; page mechanics → Phase 8 (`deferred`)

**Credits-subscription — un-skip Phase 7 UI:**

- Recovering from past due — portal CTA on billing (seed `PAST_DUE`)
- Cancelling a subscription — in-app cancel
- Cancellation takes effect at period end — assert `CANCELLED_PENDING` + still bookable until period end (seed period end in future)
- Reactivating after cancellation — seed `INACTIVE` → membership CTA

**Credits-subscription — remain skip/deferred:**

- Monthly renewal resets credits — package/webhook tests (keep skip + note)
- Admin credit/freeze/comp — Phase 8
- Real Checkout — existing `E2E_STRIPE_CHECKOUT=1` opt-in

**Booking:**

- Un-skip `Sold out — automatic waitlist offer`

### 4. Stripe Portal / deep hosted UI policy

Mirror Phase 6 Checkout:

- Default CI: seed subscription state + assert in-app CTAs and cancel SSR path (Stripe mocked at package level already).
- Portal “update billing”: assert form POST redirects to Stripe portal URL **or** skip with named reason when secrets/customer missing; optional `E2E_STRIPE_PORTAL=1` for deep interaction if practical.
- Document in `e2e/README.md` next to Checkout policy.

### 5. Fixtures and promotion harness

Reuse `fixtures/auth.ts`, `fixtures/billing.ts`, `fixtures/catalog.ts`. Add thin helpers only if needed:

- Resolve sold-out demo event by title `Sold Out: Waitlist Demo Night` (or catalog fixture).
- Admin login → edit event capacity upward to trigger `processWaitlistForEvent`.
- Optional: seed second member for queue-order tests via signup or DB seed helpers (prefer existing patterns; avoid new product APIs).

### 6. Coverage matrix + DEPLOYMENT.md

- Flip waitlist/profile rows from `unshipped` → `pass` / `deferred` / `skip` with notes.
- Flip booking waitlist offer + credits Phase 7 rows accordingly.
- `DEPLOYMENT.md` new **Phase 7** section: env (no new secrets), portal dashboard checklist (from billing README), sold-out seed title, demo steps (join → raise capacity → promote → email), billing cancel → `CANCELLED_PENDING`, “Phase 7 complete — do not start Phase 8”.
- Mark parent guide step 05 done when verified.

### 7. Branch and verification

Branch: `waitlist-account-05-ladle-e2e-and-release`.

```bash
bun run lint
bun run typecheck
bun run stories   # or web Ladle smoke
SITE_URL=… bun run test:e2e -- e2e/specs/waitlist.spec.ts e2e/specs/profile.spec.ts \
  e2e/specs/credits-subscription.spec.ts e2e/specs/booking.spec.ts
```

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Multi-user queue / ineligible promotion hard in e2e | Implement as far as harness allows; otherwise `deferred` with reason + rely on `waitlist.integration.test.ts` |
| Stripe Portal not automatable | Assert CTA + redirect; opt-in deep test; staging manual smoke |
| Password change depends on Neon Auth UI | Assert security entry + provider form presence; document staging manual if full change flaky |
| Accidental Phase 8 scope | Tasks checklist explicitly forbids admin waitlist/GDPR pages |
| Capacity bump requires admin UI access | Use existing admin event edit + `E2E_ADMIN_*` |

## Migration Plan

N/A — no schema or API migrations. Docs/matrix/e2e/stories only (+ bugfixes found while testing).

## Open Questions

_(none blocking — product deferrals already named in parent guide)_
