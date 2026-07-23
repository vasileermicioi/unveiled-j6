## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-account-ui-02-profile-tabs-above-header.md`, parent guide, and this change’s `design.md` / specs
- [x] 1.2 Confirm step `01` is done in the parent guide; compare `ProfileLayout` vs `AdminLayout` tab placement and auth `auth-page__column` pattern

## 2. Profile shell reorder and shared column

- [x] 2.1 Reorder `ProfileLayout` to render `ProfileTabNav` above `PageSectionHeader`, then children
- [x] 2.2 Wrap tabs + header + children in one shared inner column (`max-w-2xl`, auth-style); keep outer shell padding/`max-w-7xl` as needed
- [x] 2.3 Optional: add `.profile-page__column` in `globals.css` only if width should be theme-tokenized like `.auth-page__column` — otherwise Tailwind on the wrapper is enough — skipped; used Tailwind `max-w-2xl` on the inner wrapper (no new CSS class)

## 3. Align panel cards with the column

- [x] 3.1 Remove nested `max-w-2xl` / redundant `mx-auto` width constraints from profile panel cards (`ProfilePage`, `ProfileDetailsPage`, `PreferencesPage`, `BillingPage`, `BillingCancelPage`, `SecurityPage`, `DataExportPage`, `DeleteAccountPage`) so cards are `w-full` in the shared column
- [x] 3.2 Spot-check all profile tab routes for spacing/overflow (many tabs on small viewports — horizontal overflow OK) — confirmed `.profile-tabs .admin-tabs__track` keeps `overflow-x: auto` / `nowrap`; cards are `w-full` inside shared column

## 4. Stories

- [x] 4.1 Update profile Ladle stories / comments if they assume header-then-tabs order; confirm compositions still render under the new shell — no story comments assumed old order; stories mount via `ProfileLayout` and pick up reorder automatically

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` (exit 0)
- [x] 5.2 Run `bun run typecheck` (exit 0)
- [x] 5.3 Manual: `/en/profile` and `/en/profile/details` — tablist above “Your account”; header rule width matches tabs/card column (compare to admin tabs-above-title reference) — structural verification in `ProfileLayout` (tabs → header → children in shared `max-w-2xl`); live browser smoke deferred to operator
- [x] 5.4 Mark step `02` done in `.dev-plan/current-iteration/manual-test-account-ui-parent-guide.md`; note any CSS class additions for step `04` docs — no new CSS class; column is Tailwind `max-w-2xl`
