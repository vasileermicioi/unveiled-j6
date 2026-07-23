## Context

After step `01` (membership home), `/profile*` still renders `PageSectionHeader` then `ProfileTabNav` inside an outer `max-w-7xl` shell, while each panel card uses `max-w-2xl` — so the header rule is wider than the tabs/card (`.dev-plan/current-iteration/manual-test-user-profile-tabs.png`). Admin reference order is tabs first (`AdminLayout` → `AdminTabNav`, then `AdminPageShell` title). Auth pages already keep header + card on one inner column via `auth-page__column`. Source brief: `.dev-plan/current-iteration/manual-test-account-ui-02-profile-tabs-above-header.md`.

## Goals / Non-Goals

**Goals:**

- Profile chrome order: `ProfileTabNav` → `PageSectionHeader` → children (admin-like).
- One shared content column for tabs + header (incl. bottom rule) + primary content card.
- Cards fill that column (remove nested `max-w-2xl` that re-narrows under a wider rule).
- Keep eyebrow + headline; no muted subtitle under the title.
- Stories still render correctly under the reordered shell.

**Non-Goals:**

- Membership panel / portal CTA content (step `01`).
- Admin `PageSectionHeader` adoption (step `03`).
- Full product-doc / e2e rewrite (step `04`).
- New tab visual system or token redesign (reuse `.admin-tabs*` / `.profile-tabs`).
- Locale route or tab-id changes.

## Decisions

1. **Reorder in `ProfileLayout` only**
   - **Choice:** Render `ProfileTabNav`, then `PageSectionHeader`, then `{children}`. Do not move tabs into individual pages.
   - **Rationale:** One shell owns chrome order for every profile route; matches how `AdminLayout` owns tab placement.
   - **Alternatives:** Per-page reordering (rejected — easy to drift).

2. **Shared column = auth-style inner wrapper at `max-w-2xl`**
   - **Choice:** Keep outer shell at `max-w-7xl` for page padding consistency with other member surfaces. Wrap tabs + header + children in an inner `Surface` (e.g. `profile-page__column` or reuse layout classes) with `mx-auto w-full max-w-2xl flex flex-col gap-*`. Prefer mirroring `AuthPageLayout`’s `auth-page__column` pattern; add a thin `.profile-page__column` rule in `globals.css` only if auth’s width is theme-defined and should be shared/tokenized — otherwise Tailwind `max-w-2xl` on the wrapper is enough.
   - **Rationale:** Parent guide requires picking one column so rule/tabs/card align; cards already target `max-w-2xl`; filling that column matches “prefer filling that column with the membership/details cards rather than leaving a narrow card under a wide rule.” Auth precedent: header and card share one column inside a wider outer shell.
   - **Alternatives:** Widen cards to `max-w-7xl` (tabs become a short strip under a huge rule — worse density for form cards); put `max-w-2xl` only on the header (tabs still full-bleed — still misaligned).

3. **Remove nested card `max-w-2xl` / `mx-auto` width constraints**
   - **Choice:** On all profile panel pages (`ProfilePage`, `ProfileDetailsPage`, `PreferencesPage`, `BillingPage`, `BillingCancelPage`, `SecurityPage`, `DataExportPage`, `DeleteAccountPage`), drop `max-w-2xl` (and redundant `mx-auto` when the column already centers) so cards are `w-full` inside the shared column. Keep semantic theme classes (`membership-hero`, `onboarding-card`, etc.).
   - **Rationale:** Double `max-w-2xl` is harmless width-wise but `mx-auto` on cards inside an already-centered column is noise; more importantly, any future column tweak must be single-source in the layout.
   - **Alternatives:** Leave per-card `max-w-2xl` (works if column equals `2xl`, but re-breaks if column width changes).

4. **Tab track horizontal overflow unchanged**
   - **Choice:** Keep existing `.profile-tabs` / `.admin-tabs__track` overflow behavior; many tabs may scroll horizontally on small viewports. Shared column constrains width; do not wrap tabs into multiple rows unless already themed that way.
   - **Rationale:** Brief explicitly allows horizontal overflow on small viewports.
   - **Alternatives:** Multi-row tabs (rejected — invents a second tab layout).

5. **Stories**
   - **Choice:** Update any Profile Ladle stories or docs that describe/assert header-then-tabs order; no new story suite required beyond visual correctness of existing compositions.
   - **Rationale:** Layout change is shell-level; existing page stories should still mount.
   - **Alternatives:** Full visual regression suite (deferred to step `04` if needed).

## Risks / Trade-offs

- **[Risk] Narrower column makes long DE tab labels feel cramped** → Mitigation: keep horizontal scroll on the tab track; spot-check `/de/profile*` tabs.
- **[Risk] Membership hero looks odd at `max-w-2xl` full bleed of column** → Mitigation: already used `max-w-2xl` on the card; filling the column is the intended look from the brief.
- **[Risk] Outer `max-w-7xl` + inner `max-w-2xl` leaves empty side margins on large screens** → Mitigation: intentional (same as auth); not a bug.
- **[Trade-off] openspec/specs are not product SoT** → Product docs / feature files update in step `04`; this delta archives with the change.

## Migration Plan

1. Reorder `ProfileLayout` (tabs → header → children) and add shared column wrapper.
2. Strip nested `max-w-2xl` from profile panel cards; verify spacing/gaps.
3. Optional thin CSS class if tokenizing the column with auth.
4. Spot-check all profile tab routes + update stories if needed.
5. `bun run lint` + `bun run typecheck`; manual visual vs admin tabs-above-title reference.
6. Mark step `02` done in parent guide; note any CSS class for step `04` docs.

No DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. Column width locked to `max-w-2xl` (match current cards + auth-style single column). If design review prefers `max-w-3xl`, change only the layout wrapper once — do not reintroduce per-card max-widths.
