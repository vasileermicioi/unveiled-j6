## Why

Manual testing shows `/profile` as a **Credit wallet** tab with balance + “Refill credits” (see `.dev-plan/current-iteration/manual-test-user-profile-tabs.png`). Members should manage their subscription from a membership-style account home, not a wallet/refill surface — the Stripe Customer Portal already exists on Billing; the account home should reuse that path with the membership marketing composition.

## What Changes

- Rename the first profile tab from credit wallet → **Membership** (tab id, path helpers, `ProfileTabNav` labels, `inferProfileTab` default). Path stays `/:locale/profile`.
- Replace `ProfilePage` wallet UI (balance chip + refill link) with a membership-style card: headline/status, vertical perk list (membership perk copy or thin profile-membership content slice), primary CTA **Manage subscription** via SSR form POST → Stripe Customer Portal.
- Wire `POST` on `apps/web/app/routes/[locale]/profile.tsx` reusing `handleBillingPortalPost` / `createBillingPortalSession`; document `return_url` choice (`/profile` vs `/profile/billing`).
- Inactive / missing Stripe customer: show membership checkout CTA to `/:locale/membership` (no dead portal button). PAST_DUE / CANCELLED_PENDING: still allow portal when `stripeCustomerId` exists (align with billing rules); keep detailed plan/cancel on Billing tab.
- Update DE/EN copy in `profile-content.ts` (drop wallet/refill home strings; add membership + manage CTA).
- Update Ladle `ProfilePage` stories for active / inactive / error states.
- Patch e2e assertions that hard-fail on “credit wallet” / “refill credits” so CI stays green if this step merges alone (full product-doc rewrite deferred to step `04`).

**Out of scope:** Profile tab order above header / column width (step `02`); admin header restyle (step `03`); full product-doc + e2e scenario rewrite (step `04`); navbar credit chip; ledger/booking credit logic.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-profile`: Account home at `/:locale/profile` SHALL be a membership-style manage surface (not credit-wallet balance / refill). Primary CTA for portal-eligible members SHALL open Stripe Customer Portal via SSR form POST. Inactive / missing-customer members SHALL get a CTA to `/:locale/membership`. Tab label SHALL be Membership (not Credit wallet). Identity editing remains on `/profile/details`.

## Impact

- **UI:** `ProfilePage.tsx` (+ stories), `ProfileTabNav.tsx`, `profile-tabs.ts`; optional thin shared presentational extract with `MembershipInfoPage` perk rows (stay in `apps/web`).
- **Routes:** `apps/web/app/routes/[locale]/profile.tsx` — add POST for portal intent; load subscription for CTA gating.
- **Lib:** Reuse `handleBillingPortalPost` in `billing-route.ts` (extend return URL if decided); `profile-content.ts` DE/EN strings.
- **Billing:** No new Stripe products; reuse Customer Portal session helper from `@unveiled/billing`.
- **E2E:** Patch wallet/refill assertions that would fail CI; full scenario rewrite in step `04`.
- **Unchanged:** Navbar credit display; booking/ledger credits; Billing tab plan/cancel detail; HeroUI-only markup; theme `membership-hero*` classes.
- **Source brief:** `.dev-plan/current-iteration/manual-test-account-ui-01-membership-home.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-account-ui-parent-guide.md`
- **Consumed by:** `manual-test-account-ui-02-profile-tabs-above-header`, `manual-test-account-ui-03-admin-page-headers` (indirect), `manual-test-account-ui-04-docs-and-hardening`
- **Verification:** `bun run lint`, `bun run typecheck`; manual ACTIVE + INACTIVE paths on `/en/profile`
