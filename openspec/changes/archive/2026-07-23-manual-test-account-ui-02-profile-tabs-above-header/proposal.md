## Why

Admin places tabs **above** the page title; member profile still renders `PageSectionHeader` (“Your account”) **then** tabs, and the header rule spans a wider column than the content card (see `.dev-plan/current-iteration/manual-test-user-profile-tabs.png`). Account chrome should match admin order and share one content column so the rule, tab track, and card align.

## What Changes

- Reorder `ProfileLayout` to render `ProfileTabNav` above `PageSectionHeader`, then children (admin tab-above-title order).
- Introduce a single shared content-column width for tabs + header + panel so the header bottom rule is not wider than the card/tabs; prefer filling that column with membership/details cards rather than a narrow card under a wide rule.
- Adjust per-panel `max-w-2xl` (or equivalent) wrappers so cards align with the shared column — avoid double-constraining that re-breaks alignment.
- Keep `PageSectionHeader` eyebrow + headline (Account / Your account); no muted subtitle under the title.
- Update profile Ladle stories / visual expectations if they assume header-then-tabs order.

**Out of scope:** Membership panel content / portal behavior (step `01`); admin `PageSectionHeader` adoption (step `03`); full product-doc rewrite (step `04`) — touch `ui-component-map` only if needed for implementer clarity.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-profile`: Account pages under `/:locale/profile*` SHALL render the profile tablist **above** the shared `PageSectionHeader`. The tablist, page header (including the header rule), and primary content card SHALL share the same content column width. Page-level muted subtitles under the title SHALL NOT be shown.

## Impact

- **UI:** `ProfileLayout.tsx` (order + shared column wrapper); profile panel components that apply `max-w-2xl` / nested width constraints; optional thin CSS class in `globals.css` if a profile column token is required.
- **Stories:** Profile Ladle stories that assume header-then-tabs order.
- **Unchanged:** Tab visual system (reuse `.admin-tabs*` / `.profile-tabs`); locale routes; membership home content from step `01`; admin shell restyle (step `03`).
- **Source brief:** `.dev-plan/current-iteration/manual-test-account-ui-02-profile-tabs-above-header.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-account-ui-parent-guide.md`
- **Depends on:** `manual-test-account-ui-01-membership-home` (done)
- **Consumed by:** `manual-test-account-ui-04-docs-and-hardening`
- **Verification:** `bun run lint`, `bun run typecheck`; manual `/en/profile` and `/en/profile/details` — tabs above title; header rule matches tabs/card column
