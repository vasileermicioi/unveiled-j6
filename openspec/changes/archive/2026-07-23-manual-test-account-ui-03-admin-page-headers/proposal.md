## Why

Member and marketing surfaces use `PageSectionHeader` (muted uppercase eyebrow, bold headline, full-width rule on yellow). Admin pages still render a bare `Heading` + optional muted subtitle in `AdminPageShell` (`admin-shell__intro`), so titles like “PARTNERS” feel like a different system (see `.dev-plan/current-iteration/manual-test-admin-tabs.png`). Admin intros should share the same on-yellow header pattern while keeping tabs above the title.

## What Changes

- Update `AdminPageShell` to render the primary page title via shared `PageSectionHeader` (eyebrow + headline + rule).
- Add a shared Admin eyebrow string in `admin-content` (DE/EN); do not invent per-route eyebrow styling.
- Keep optional subtitle as muted `Paragraph` **below** the header rule; preserve breadcrumbs (above the header), toolbar `actions`, and `wrapInCard`.
- Trim obsolete `.admin-shell__intro` title-only styling if superseded; do not restyle tables/cards.
- Update `AdminPageShell` Ladle stories that assert the old bare heading chrome.

**Out of scope:** Profile layout (step `02`); admin table/search/KPI redesign; full product-doc / e2e sweep (step `04`); moving admin tabs below the title.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `platform-foundation`: Admin authenticated pages that use `AdminPageShell` SHALL render their primary page title through the shared `PageSectionHeader` pattern. Optional admin subtitle and action toolbar MAY appear below the header. Admin tab navigation SHALL remain above the page header.

## Impact

- **UI:** `AdminPageShell.tsx` (+ stories); reuse `PageSectionHeader` from `apps/web/app/components/marketing/PageSectionHeader.tsx`.
- **Copy:** `admin-content.ts` — shared Admin eyebrow (DE/EN).
- **Theme:** Optional cleanup of `.admin-shell__intro` / related intro rules in `globals.css` if no longer needed for the bare heading stack.
- **Unchanged:** `AdminLayout` tab order; `noindex` admin; `renderAdminPage`; table/KPI layouts; HeroUI-only markup; theme tokens for header look.
- **Source brief:** `.dev-plan/current-iteration/manual-test-account-ui-03-admin-page-headers.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-account-ui-parent-guide.md`
- **Depends on:** `manual-test-account-ui-01-membership-home` (sequencing; code-independent of `02`)
- **Consumed by:** `manual-test-account-ui-04-docs-and-hardening`
- **Verification:** `bun run lint`, `bun run typecheck`; manual `/en/admin/partners` + one nested breadcrumb page
