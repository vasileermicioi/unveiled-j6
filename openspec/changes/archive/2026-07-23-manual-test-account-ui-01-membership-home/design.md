## Context

After `manual-test-ux-05-profile-account-tabs`, `/profile` is the default **Credit wallet** tab: balance chip + “Refill credits” link to `/membership` (`ProfilePage.tsx`, `wallet` tab id). Billing already owns Stripe Customer Portal via SSR form POST (`BillingPage` → `handleBillingPortalPost` → `createBillingPortalSession`, return URL hardcoded to `/:locale/profile/billing`). Membership marketing composition lives in `MembershipInfoPage` (`membership-hero`, perk rows, CTA column). Manual evidence: `.dev-plan/current-iteration/manual-test-user-profile-tabs.png` (wallet card circled). Source brief: `.dev-plan/current-iteration/manual-test-account-ui-01-membership-home.md`.

## Goals / Non-Goals

**Goals:**

- Account home tab is **Membership** (not Credit wallet): membership-style card + manage-subscription portal CTA.
- Portal-eligible members open Stripe Customer Portal via SSR form POST from `/profile`.
- Inactive / missing `stripeCustomerId` members see a clear checkout CTA to `/:locale/membership` (no dead portal button).
- PAST_DUE / CANCELLED_PENDING keep portal access when a Stripe customer exists (same gating spirit as Billing).
- DE/EN copy and Ladle stories match the new panel; e2e wallet/refill assertions do not leave CI red.
- Navbar credit chip and booking/ledger credit logic remain unchanged.

**Non-Goals:**

- Profile tabs above header / shared column width (step `02`).
- Admin `PageSectionHeader` restyle (step `03`).
- Full `docs/product/` + e2e scenario rewrite / coverage matrix (step `04`) — only CI-breaking assertion patches here.
- Removing credits from the product model; merging/deleting the Billing tab; new Stripe products; client-only portal redirects.

## Decisions

1. **Tab id rename `wallet` → `membership`; path stays `/profile`**
   - **Choice:** Update `ProfileTab` union, `PROFILE_TAB_ORDER`, path helper names (`profileMembershipPath` or keep `profileWalletPath` as alias then delete), `inferProfileTab` default, and `ProfileTabNav` label source to membership copy keys. URL remains `/:locale/profile`.
   - **Rationale:** Spec wants Membership as account home without a path break; deep links and navbar Profile control already point at `/profile`.
   - **Alternatives:** `/profile/membership` + redirect from `/profile` (extra hop, unnecessary).

2. **Membership-style card composition on `ProfilePage`**
   - **Choice:** Rebuild `ProfilePage` panel using theme classes `membership-hero`, `membership-hero__body`, `membership-benefits__*`, `membership-hero__cta` (same visual language as `MembershipInfoPage`). Show headline/status chip, vertical perk list, and primary CTA column. Prefer a thin presentational extract (e.g. shared perk-row helper) only if duplication is painful — keep ownership in `apps/web` components; do not pull marketing checkout POST into profile.
   - **Rationale:** Brief asks for the same bordered hero / perk composition; theme classes already exist.
   - **Alternatives:** Reuse `MembershipInfoPage` wholesale with a new view state (rejected — page owns guest/checkout Stripe Checkout POST and marketing chrome); plain Card without membership classes (weaker brand match).

3. **CTA gating mirrors Billing portal eligibility**
   - **Choice:** Load subscription in the `/profile` route (reuse `loadUserSubscription`). Show portal form when `stripeCustomerId` exists and status is not `INACTIVE` / `UNPAID` / missing (same as `BillingPage` `showPortal`). Otherwise show Link/Button to `/:locale/membership`. Surface portal errors from POST the same way Billing does (re-render with message).
   - **Rationale:** Aligns with existing billing rules; avoids dead “Manage subscription” when portal cannot open.
   - **Alternatives:** Always show portal button and rely on error message only (worse UX for INACTIVE).

4. **Portal POST on `/profile` via shared helper; return URL = `/profile`**
   - **Choice:** Add POST handler on `routes/[locale]/profile.tsx` calling `handleBillingPortalPost`. Extend the helper with an optional `returnPath` (default remains `profile/billing` for Billing; profile home passes `profile`). Successful portal sessions return members to `/profile` when started from the membership home.
   - **Rationale:** Parent guide open question — returning to the surface that initiated manage is clearer; Billing CTA behavior stays unchanged.
   - **Alternatives:** Always return to `/profile/billing` (simpler code, worse for the new home CTA); duplicate portal session creation in the profile route (rejected — keep one helper).

5. **Copy keys in `profile-content.ts`**
   - **Choice:** Replace home-tab wallet keys with membership keys, e.g. `membershipTabLabel` / `membershipTitle` (“Membership” / “Mitgliedschaft”), status/perk strings (reuse membership perk list from marketing content module or a short profile-local perk array), `manageSubscriptionCta`, `startMembershipCta`. Drop `walletTitle`, `walletBalance`, `refillCta` from the home tab (grep before delete — tab nav currently uses `walletTitle`). Update account subtitle away from “credits” if it still markets a wallet home.
   - **Rationale:** Spec forbids credit-wallet / refill on account home; DE/EN must ship with the UI.
   - **Alternatives:** Keep wallet string keys as aliases (confusing); import full `MembershipCheckoutContent` (heavier coupling).

6. **Stories + minimal e2e patch**
   - **Choice:** `ProfilePage` stories for portal-eligible (ACTIVE), inactive/missing-customer, and portal error. In `e2e/specs/profile.spec.ts`, retitle/assert Membership heading + manage/start CTA instead of credit-wallet / refill (prefer real assertions over skips). Leave `docs/product/features/profile.feature` / coverage matrix / sitemap full rewrite to step `04`, unless a product-doc touch is required for compile (it is not).
   - **Rationale:** Step scope allows CI-safe e2e patches; full SoT sync is step `04`.
   - **Alternatives:** `test.skip` with note (allowed by brief but weaker — prefer real assertions).

## Risks / Trade-offs

- **[Risk] Helper signature change breaks Billing POST** → Mitigation: optional `returnPath` with default `profile/billing`; Billing route unchanged call site.
- **[Risk] Duplicated perk/marketing copy drifts from `/membership`** → Mitigation: import perk strings from shared marketing content if already exported; otherwise note sync in step `04`.
- **[Risk] E2E still keyed to Gherkin “View credit wallet” titles while UI changes** → Mitigation: update Playwright test titles/assertions in this step; document that feature-file rename lands in `04`.
- **[Risk] Tab rename breaks anything matching `activeTab="wallet"`** → Mitigation: grep `wallet` under profile components/routes/stories before merge.
- **[Trade-off] openspec/specs are not product SoT** → Update `docs/product/` in step `04`; this delta archives with the change.

## Migration Plan

1. Rename tab id + nav labels; update `inferProfileTab` default.
2. Extend `handleBillingPortalPost` with optional return path; wire `/profile` POST.
3. Replace `ProfilePage` wallet panel with membership card + gated CTAs; pass subscription + error from route.
4. Update `profile-content.ts`, stories, and CI-breaking e2e assertions.
5. `bun run lint` + `bun run typecheck`; manual ACTIVE + INACTIVE smoke.
6. Mark step `01` done in parent guide; note return-URL decision for step `04` docs.

No DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. DE tab label: prefer “Mitgliedschaft” (parent guide); confirm against `content-i18n-inventory.md` during implement if a reserved string exists — non-blocking, pick the clear Membership/Mitgliedschaft pair.
