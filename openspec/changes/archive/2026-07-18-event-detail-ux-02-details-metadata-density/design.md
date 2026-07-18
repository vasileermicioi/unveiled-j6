## Context

Step **01** aligned identity + checkout and grew the hero. Below the fold, `EventDetailPage` still renders DETAILS as a vertical `flex flex-col gap-4` stack of label/value `Surface`s inside a full-width `Card`, which leaves a large empty band on the right at ~1280px (`.dev-plan/manual-test-feedback-2.png`). Discover EventCards pack date/neighborhood with Lucide `Calendar` / `MapPin` and uppercase label hierarchy (`.dev-plan/manual-test-feedback-3.png`). LOCATION is a second card with address + `EventMap`; padding/`gap-4` can leave sparse chrome around the map while the marker itself remains step **03**.

Parent: `.dev-plan/current-iteration/event-detail-ux-parent-guide.md`. Source brief: `event-detail-ux-02-details-metadata-density.md`. Constraints: HeroUI-only structure (`Card`, `Heading`/`Card.Title`, `Paragraph`, `Surface`); Tailwind layout-only; theme for colors/type/borders; flat bordered surfaces (no hard drop shadows); preserve existing i18n helpers; do not change Event field set, map pin, or ticket qty.

## Goals / Non-Goals

**Goals:**

- DETAILS uses a responsive multi-column label/value grid (1 col sm → 2 col md → 3 col lg) so horizontal space is filled on medium/large viewports.
- Optional Calendar/MapPin icons on date and neighborhood cells for EventCard scan parity; icons inherit theme color.
- LOCATION card is tighter: address above map; map spans card content width; less empty padding/dead bands.
- Theme classes under `@layer components` for meta cell typography/icon color when needed; grid/gap via Tailwind on HeroUI nodes.

**Non-Goals:**

- MapLibre marker pin shape (step 03).
- Checkout qty max / credits ∩ capacity (step 04).
- BDD/e2e title updates and `docs/product/` SoT sync (step 05).
- Changing which metadata fields exist on `Event`.
- Cloning EventCard markup 1:1 or changing Discover cards.

## Decisions

1. **DETAILS grid structure**
   - **Choice:** Wrap existing metadata cells in a single grid `Surface` (or `Card.Content` with grid classes): `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-*`. Each cell remains a `Surface` with uppercase label `Paragraph` + muted value `Paragraph` (same fields/order as today: when, accessibility, languages, age groups, type, neighborhood — omit empty optional fields as today).
   - **Rationale:** Matches step-plan breakpoints; keeps HeroUI composition; avoids inventing new field semantics.
   - **Alternatives:** Definition-list / table layout (rejected; HeroUI Surface/Paragraph pattern already used); keep vertical stack with max-width (rejected; fails “use horizontal space”).

2. **Meta cell theme classes**
   - **Choice:** Introduce `.event-detail--checkout__meta-grid`, `.event-detail--checkout__meta-cell`, and optionally `.event-detail--checkout__meta-icon` in `globals.css` `@layer components` for label weight/case and icon stroke color (reuse EventCard icon sizing ~16px if helpful). Use Tailwind only for `grid`/`gap`/`flex`/`items-*` on those nodes.
   - **Rationale:** AGENTS hard rules — no per-route color/type utilities; EventCard already uses BEM-like `event-card__meta*`.
   - **Alternatives:** Pure Tailwind `font-semibold uppercase` (already present; migrate visual bits into theme when touching the block so density work does not grow ad-hoc styling).

3. **Icons (Calendar / MapPin)**
   - **Choice:** Add Lucide `Calendar` on the when/date cell and `MapPin` on neighborhood only; `aria-hidden`; class `event-detail--checkout__meta-icon` (theme color). Skip icons on accessibility/languages/type/age — those lack EventCard counterparts and would clutter the grid.
   - **Rationale:** Step plan says “optionally… where they improve scan parity”; two anchors match EventCard without icon soup.
   - **Alternatives:** Icons on every cell (rejected; noisy); no icons (acceptable fallback if Lucide import is awkward in SSR page — prefer shipping the two icons).

4. **LOCATION chrome**
   - **Choice:** Keep address `Paragraph` above `EventMap`. Reduce `Card.Content` gap/padding if sparse (theme class e.g. `.event-detail--checkout__location` or tighter `gap-*` layout-only). Ensure map wrapper is `w-full` / block-level so MapLibre canvas uses card content width. Do **not** change marker DOM/CSS (step 03).
   - **Rationale:** Spec scenario requires full-width map within card; marker work is explicitly deferred.
   - **Alternatives:** Side-by-side address + map on lg (rejected; step plan keeps address above map).

5. **Stories**
   - **Choice:** Optionally update `EventDetailPage.stories.tsx` to use an event fixture with enough metadata fields to exercise the grid; no new story matrix required.
   - **Rationale:** Visual check is the bar; step 05 owns broader Ladle/e2e alignment.

## Risks / Trade-offs

- **[Risk] Few metadata fields look sparse even in a 3-col grid** → Mitigation: grid still packs cells left-to-right; empty optional fields stay omitted; accept uneven last row.
- **[Risk] Theme class proliferation vs EventCard duplication** → Mitigation: detail-specific BEM under `event-detail--checkout__meta*`; do not import EventCard internals into the page.
- **[Risk] Map width still constrained by EventMap island CSS** → Mitigation: inspect island wrapper; add layout `w-full` / theme width only — no marker changes.
- **[Trade-off] Parent guide may still mark 02 done** → Treat iteration markdown + this change as active residual density debt; update parent guide checkbox honestly after merge.
- **[Trade-off] Spec delta vs `docs/product/` until step 05** → Acceptable per step plan.

## Migration Plan

1. Confirm step 01 layout baseline locally.
2. Implement DETAILS grid + optional icons + LOCATION tightening in `EventDetailPage` / `globals.css`.
3. Optional story fixture tweak.
4. `bun run lint` && `bun run typecheck`.
5. Visual check ~1280px (DETAILS ≥2 columns; map spans card width; no new shadows).
6. Mark parent guide step 02 accurately on merge. Rollback = revert PR. No DB/env migration.

## Open Questions

- None blocking. If neighborhood is missing, skip MapPin cell entirely (same as today). Icon omission is allowed only if an unexpected SSR/HeroUI conflict appears — default is ship Calendar + MapPin.
