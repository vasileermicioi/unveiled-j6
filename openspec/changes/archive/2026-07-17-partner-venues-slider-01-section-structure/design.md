## Context

Partner Venues Slider step 01 is **structure-only**: reshape Discover’s partners block so step 02 can attach continuous CSS motion without rewriting markup.

Current state (`DiscoverPage.tsx` ~51–78):

- Eyebrow via `content.partners.eyebrow` (“Partnerorte” / “Partner venues”).
- Responsive grid (`sm:grid-cols-2 lg:grid-cols-4`) of `.discover-partner-tile` cards showing logo/initial, **name**, and **address**.
- Data: `listPartners(db, { limit: 8 })` on `/:locale` index → `toDiscoverPartnerTile` (`id`, `name`, `address`, `initial`, optional `logoUrl` via `medium-640`).
- Theme: `.discover-partner-tile*` in `globals.css` — flat 2px bordered surfaces (keep that language).

Inspiration (structure only): `.dev-plan/3-partners-slider.png` (prefix), `.dev-plan/3-partners-slider-2.png` (logo strip). Styling follows [`DESIGN.md`](../../../DESIGN.md) / yellow page field — not mock offset shadows or an off-white band if it fights brand yellow.

Constraints: HeroUI-only markup (`Surface`, `Paragraph`, …); `<img>` allowed inside HeroUI wrappers; theme tokens for visuals; Tailwind layout only; no business logic in routes; no animation beyond optional `animation: none` baseline.

## Goals / Non-Goals

**Goals:**

- Eyebrow + horizontal logo strip as the Partner venues primary layout.
- DOM duplication of the partner sequence (track + duplicate) ready for seamless loop in step 02.
- Logo-forward cells with initial fallback; addresses not primary UI.
- BEM hooks (`.discover-partners*`) in `globals.css` for viewport/track/item.
- Product copy in `static-pages-content.md` updated to match.

**Non-Goals:**

- Keyframes, infinite scroll, pause-on-hover, reduced-motion animated fallback (step 02).
- Stories / a11y polish / e2e (step 03).
- Admin partner CRUD, partner detail routes, partner portal.
- Pixel-matching inspiration backgrounds or shadows.

## Decisions

1. **Viewport + single track with duplicated children (preferred)**  
   Structure: section → eyebrow → `.discover-partners__viewport` (overflow hidden) → `.discover-partners__track` containing partners mapped **twice** (or `[...partners, ...partners]`). Use stable keys that remain unique across the duplicate (`${partner.id}-a` / `${partner.id}-b` or index suffix).  
   Alternatives: two sibling tracks — also fine if clearer in JSX; either satisfies step 02. Rejected: CSS-only duplication without second DOM sequence — harder to animate translate by 50% later.

2. **Keep limit 8 unless strip looks empty**  
   Retain `listPartners({ limit: 8 })`. Duplication handles short lists for future looping; do not raise N in this step unless visual QA with seed data shows a broken-looking strip — if raised, document in parent guide / DEPLOYMENT note. Address field may remain on the mapper type (unused in UI) to avoid drive-by type churn; step 03 can trim if desired.

3. **Name for a11y, not chrome**  
   Keep partner `name` available to assistive tech (e.g. visually hidden `Paragraph`, `aria-label` on the item `Surface`, or section `aria-labelledby` + decorative logos with `alt=""`). Do **not** render address lines in the marquee cells. Logos stay decorative (`alt=""`) when name is exposed elsewhere on the item.

4. **BEM rename to `.discover-partners*`**  
   Introduce `.discover-partners`, `__viewport`, `__track`, `__item`, and reuse logo/initial visual rules under `__logo` / `__initial` (or nest under `__item`). Remove or stop using `.discover-partner-tile*` once the new block ships so dead CSS does not linger. Flat bordered cells on `var(--surface)` / `var(--border)` — no shadows.

5. **No motion in this step**  
   Optionally set `animation: none` on the track as an explicit baseline. Do not add `@keyframes` or JS islands here.

6. **Empty list**  
   If `partners.length === 0`, keep current sensible behavior: still show eyebrow **or** hide the whole partners `Surface` — prefer matching existing empty behavior (empty grid today still shows eyebrow). Document choice in implementation: show eyebrow + empty viewport (no broken track) is acceptable; do not invent a new empty-state marketing message in this step.

7. **HeroUI composition**  
   Compose with `Surface` / `Paragraph` only (plus `<img>`). Avoid raw `<ul>`/`<li>` if treated as forbidden elsewhere on Discover; flex/row layout via Tailwind on HeroUI nodes.

## Risks / Trade-offs

- **[Risk] Few partners / missing logos look sparse** → Mitigation: initial-letter fallback; DOM duplication already present for step 02; optional later min-duplication multiplier stays in step 02.
- **[Risk] Duplicate keys / React warnings** → Mitigation: suffix keys for the second sequence.
- **[Risk] Overflow hidden clips focus rings** → Mitigation: step 03 a11y; this step uses non-interactive cells (no links in MVP).
- **[Trade-off] Address removed from Discover UI** → Addresses remain in DB/admin; product copy must stop promising address tiles.
- **[Trade-off] OpenSpec vs product docs** → Product SoT remains `docs/product/`; update `static-pages-content.md` in this step; OpenSpec delta archives the requirement for apply/sync.

## Migration Plan

1. Restructure partners block in `DiscoverPage.tsx` (prefix + viewport + track + duplicate).
2. Add `.discover-partners*` structure styles; remove unused `.discover-partner-tile*` rules.
3. Update `static-pages-content.md` Partner venues section.
4. Manual Discover check: 0 / 1 / many partners if seed allows.
5. `bun run lint` + `bun run typecheck`.
6. Mark step 01 done in `partner-venues-slider-parent-guide.md`.
7. Rollback: revert the three file areas (component, CSS, static copy).

## Open Questions

- None blocking. Whether to raise partner `limit` above 8 can be decided during visual QA; default is keep 8.
