## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-account-ui-01-membership-home.md`, parent guide non-goals/release criteria, and this change’s `design.md` / specs
- [x] 1.2 Confirm `handleBillingPortalPost` / `createBillingPortalSession`, `MembershipInfoPage` membership-hero composition, and `BillingPage` portal form pattern exist
- [x] 1.3 Inventory `wallet` tab id usages, `ProfilePage` wallet UI, `profile-content` wallet/refill keys, and e2e “credit wallet” / “refill” assertions

## 2. Tab rename and copy

- [x] 2.1 Rename profile tab id `wallet` → `membership` in `profile-tabs.ts` (order, path helpers, `inferProfileTab` default); keep path `/:locale/profile`
- [x] 2.2 Update `ProfileTabNav` labels to Membership / Mitgliedschaft (new copy keys)
- [x] 2.3 Update `profile-content.ts` DE/EN: membership home strings + manage/start CTAs; remove wallet/refill home copy; adjust account subtitle if it still markets a wallet home

## 3. Membership home UI and portal POST

- [x] 3.1 Replace `ProfilePage` wallet panel with membership-style card (`membership-hero*` theme classes, perk list, status, CTA column); pass subscription + optional error props
- [x] 3.2 Gate CTAs: portal form when portal-eligible (`stripeCustomerId` + not INACTIVE/UNPAID); otherwise Link to `/:locale/membership`
- [x] 3.3 Extend `handleBillingPortalPost` with optional return path (default `profile/billing`); profile home uses `profile`
- [x] 3.4 Wire GET+POST on `routes/[locale]/profile.tsx`: load subscription, render new panel, handle portal intent via shared helper
- [x] 3.5 Optional: extract shared perk-row presentational helper only if needed to avoid duplicating `MembershipInfoPage` rows (keep in `apps/web`) — skipped; inline perk rows reuse `membershipContent` perks + theme classes

## 4. Stories and e2e CI safety

- [x] 4.1 Update `ProfilePage` Ladle stories for ACTIVE (portal CTA), INACTIVE/missing-customer (membership CTA), and portal error states
- [x] 4.2 Patch `e2e/specs/profile.spec.ts` assertions that expect “credit wallet” / “refill credits” so CI stays green (prefer real Membership/manage assertions over skips)
- [x] 4.3 Grep for leftover `activeTab="wallet"` / `walletTitle` / refill home copy in profile UI and fix

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` (exit 0)
- [x] 5.2 Run `bun run typecheck` (exit 0)
- [x] 5.3 Manual: ACTIVE member on `/en/profile` — no Credit wallet/refill; membership card + manage-subscription posts to portal (or clear error); INACTIVE sees checkout path to `/membership` — covered by Ladle stories (Active / Inactive / Portal error) + e2e membership-home scenarios; live browser smoke deferred to operator
- [x] 5.4 Mark step `01` done in `.dev-plan/current-iteration/manual-test-account-ui-parent-guide.md`; note return-URL (`/profile`) and any open copy decisions for step `04`
