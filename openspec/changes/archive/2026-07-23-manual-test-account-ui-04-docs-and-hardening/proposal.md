## Why

Steps `01`–`03` shipped membership home, profile tabs-above-header, and admin `PageSectionHeader` titles, but product Gherkin, sitemap, UI maps, coverage matrix, and Playwright scenario titles still describe a credit-wallet / refill account home. Without this hardening slice the feature is not releasable: the next phase can reintroduce wallet-tab copy or divergent admin header docs.

## What Changes

- Rewrite `docs/product/features/profile.feature`: remove “View credit wallet” / “Refill credits”; add membership home + manage-subscription (+ inactive checkout) scenarios; document tabs-above-header IA.
- Update sitemap `/profile` blurb to membership manage home (not credit wallet tab).
- Update `ui-component-map.md` / `static-pages-content.md`: profile tab order (tabs above header, shared column width); `PageSectionHeader` used by admin `AdminPageShell`; membership home card (not wallet).
- Update `coverage-matrix.md` rows for replaced scenarios; point Playwright titles at new scenario names.
- Harden `e2e/specs/profile.spec.ts`: assert membership home + portal CTA (or membership checkout when inactive); assert tablist precedes account heading; reuse existing billing fixtures for portal redirect (no deep Stripe Portal browser automation).
- Optional: one non-flaky admin Playwright or story assertion that partners/overview exposes `PageSectionHeader` eyebrow/rule.
- Inventory any new i18n strings in `content-i18n-inventory.md` if required.
- Mark all parent-guide steps done; record intentional deferrals; close the feature.
- **No** new Stripe products, credit ledger changes, billing-tab redesign, or partner portal.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-profile`: Product docs, coverage matrix, and Playwright SHALL describe `/profile` as the membership manage home (Stripe portal CTA; membership checkout when ineligible) with tablist above `PageSectionHeader`, and SHALL NOT describe a credit-wallet / refill account-home tab.
- `platform-foundation`: Agent-facing UI docs SHALL state that admin `AdminPageShell` titles use the shared `PageSectionHeader` pattern and that profile tabs render above the account header with shared column width.

## Impact

- **Product SoT:** `docs/product/features/profile.feature`; `sitemap/sitemap.md`; `ui/ui-component-map.md`; `ui/static-pages-content.md`; `testing/coverage-matrix.md`; optionally `extras/content-i18n-inventory.md`.
- **E2E:** `e2e/specs/profile.spec.ts` (+ optional admin header assertion); proximity/layout selectors per `bdd-and-e2e.md`.
- **Planning:** parent guide step `04` → done; feature releasable.
- **Unchanged:** App UI behavior from steps `01`–`03` (docs/tests catch up only); Billing tab detail; navbar credit chip; ledger/booking credits.
- **Source brief:** `.dev-plan/current-iteration/manual-test-account-ui-04-docs-and-hardening.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-account-ui-parent-guide.md`
- **Depends on:** `manual-test-account-ui-01-membership-home`, `02-profile-tabs-above-header`, `03-admin-page-headers` (all done)
- **Consumed by:** closes Manual-test account UI
- **Verification:** `bun run lint`, `bun run typecheck`; relevant Playwright profile specs; grep sanity — no remaining “credit wallet” account-home claims in `profile.feature` / sitemap profile row
