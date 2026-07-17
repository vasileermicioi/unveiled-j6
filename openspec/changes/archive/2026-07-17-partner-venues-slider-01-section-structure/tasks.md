## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/partner-venues-slider-01-section-structure.md` and parent-guide non-goals (no motion, no address cards, no offset shadows)
- [x] 1.2 Inspect current partners block in `DiscoverPage.tsx`, `.discover-partner-tile*` in `globals.css`, and `DiscoverPartnerTile` / `listPartners({ limit: 8 })` data path

## 2. Section structure

- [x] 2.1 Restructure Discover partners section: eyebrow + `.discover-partners__viewport` + `.discover-partners__track` with duplicated partner sequence (unique keys per copy)
- [x] 2.2 Logo-forward cells with initial fallback; drop address (and visible name chrome) as primary UI; keep name for a11y context
- [x] 2.3 Add `.discover-partners*` structure styles in `globals.css` (flat bordered surfaces, theme tokens only; optional `animation: none`); remove unused `.discover-partner-tile*` rules
- [x] 2.4 Update `docs/product/ui/static-pages-content.md` Partner venues section to describe prefix + horizontal logo strip (not address grid of up to 8)

## 3. Validation

- [x] 3.1 Manual Discover check: eyebrow visible; logos/initials in a horizontal strip; addresses no longer primary tile content
- [x] 3.2 Spot-check empty / single / many partners if seed data allows (no broken layout)
- [x] 3.3 Run `bun run lint` and `bun run typecheck` (both exit 0)

## 4. Cleanup

- [x] 4.1 Mark step 01 done in `.dev-plan/current-iteration/partner-venues-slider-parent-guide.md`
