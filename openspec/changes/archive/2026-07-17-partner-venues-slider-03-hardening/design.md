## Context

Partner Venues Slider steps 01–02 are done: Discover shows eyebrow + duplicated logo track with continuous CSS marquee, hover/focus-within pause, and `prefers-reduced-motion` static fallback (clone cells hidden via `.discover-partners__item--clone` in reduced motion). Parent release criteria still require stories, a11y polish, empty-state policy, and product-doc sync.

Current state after step 02:

- `DiscoverPage.tsx`: clone cells already set `aria-hidden` + `--clone`; logos `alt=""`; primary cells use `aria-label={partner.name}`. Section wrapper has no `aria-labelledby` / region role — eyebrow is visible but not wired as the region name.
- Empty `partners` still renders the section shell + empty track (broken/empty marquee risk).
- `DiscoverPage.stories.tsx`: only `Default` with one mock partner — does not demonstrate marquee density or empty hide.
- `static-pages-content.md` § Partner venues still says “motion owned by a follow-up step.”
- `ui-component-map.md` Discover home row omits the logo marquee.
- E2e `event-discovery.spec.ts` asserts partners eyebrow via proximity text — fine if section remains when seeded partners exist.

Constraints: HeroUI-only markup; theme tokens in `globals.css`; proximity e2e selectors; do not reintroduce address-card grid; product SoT is `docs/product/` (openspec archive optional).

## Goals / Non-Goals

**Goals:**

- Discover stories show prefix + multi-partner marquee; empty partners story confirms section absence.
- Single accessible section name; duplicate sequence not double-announced; logos decorative.
- Empty list: hide section; documented in product copy SoT.
- Docs match shipped slider (not address grid / “follow-up motion”).
- Parent guide: step 03 done + feature complete after verification.

**Non-Goals:**

- New partner detail routes or admin changes.
- Reworking marquee keyframes/duration unless a minimal markup tweak is required for labeling/empty hide.
- Separate Ladle story that simulates `prefers-reduced-motion` via JS (document CSS media instead).
- New empty-state marketing string for partners.
- Chromatic/visual regression suite.

## Decisions

1. **Empty partners → hide the whole Partner venues section**  
   When `partners.length === 0`, do not render `.discover-partners` (eyebrow + viewport). Rationale: a logo marquee with no items is noise; inventing empty copy is out of scope and unlike the events empty box (events are the primary Discover content). Alternatives considered: (a) dashed empty box like events — rejected (no product copy; dilutes logo-forward intent); (b) keep eyebrow with empty track — rejected (broken marquee). Document the hide rule in `static-pages-content.md`.

2. **Accessible name via visible eyebrow (`aria-labelledby`)**  
   Give the eyebrow an `id` (stable, e.g. `discover-partners-heading`) and set `aria-labelledby` on the partners `Surface` (optionally `role="region"` if HeroUI/`Surface` does not already expose a landmark — prefer the smallest change that yields a named region). Do **not** add a redundant visible headline. Alternatives: (a) `aria-label` duplicating eyebrow text — acceptable fallback if `aria-labelledby` is awkward with HeroUI props; (b) visually hidden `Heading` — unnecessary if eyebrow text is sufficient.

3. **Duplicate-track a11y: keep per-cell `aria-hidden` on clones; verify primary names once**  
   Step 02 already marks clones `aria-hidden` and primary cells `aria-label={name}` with decorative `alt=""`. This step verifies that pattern; if AT still double-reads, wrap the second `partners.map` in a single `aria-hidden` container `Surface` instead of relying only on per-cell flags. Do not put names on clone cells.

4. **Stories: Marquee + Empty (+ keep Default)**  
   - **Default / Marquee:** several mock partners (mix of logo + initial) so the strip reads as a marquee in Ladle.  
   - **Empty:** `partners={[]}` — assert section/eyebrow not present for reviewers.  
   Story description (meta/comment): reduced-motion is CSS `@media (prefers-reduced-motion: reduce)` — toggle OS/browser setting; no story prop. Alternatives: forced reduced-motion class in a story — optional only if already used elsewhere; do not invent a new theme hook.

5. **Doc sync targets**  
   - `static-pages-content.md`: continuous marquee (default preference), reduced-motion static, empty → hidden, drop “follow-up step.”  
   - `ui-component-map.md` Discover home: mention Partner venues logo marquee (eyebrow + strip), not address grid.  
   - `content-i18n-inventory.md`: touch only if it still describes an address-card grid of up to 8 tiles.  
   Product docs remain authoritative; no openspec archive required for implementers.

6. **E2e: spot-check only**  
   Keep eyebrow proximity assert when seed has partners. Do not add brittle animation timing tests. If empty-hide is covered, prefer Ladle story over new e2e unless an existing scenario requires it.

## Risks / Trade-offs

- **[Risk] Hiding empty section breaks an e2e that always expects the eyebrow** → Mitigation: seed/demo Discover includes partners; `event-discovery` already depends on seeded catalog; Empty story covers the zero case in Ladle.
- **[Risk] `aria-labelledby` + clone `aria-hidden` still noisy for some AT** → Mitigation: wrap duplicate sequence in one `aria-hidden` group; keep logos `alt=""`.
- **[Risk] Story with one partner under-demonstrates marquee** → Mitigation: Marquee story uses ≥4 mocks.
- **[Trade-off] No reduced-motion Ladle story** → Document CSS media in story description; manual OS toggle for AT/visual check.

## Migration Plan

1. Grep docs for “partner tiles” / address-grid wording; confirm step 02 motion on local Discover.
2. Apply empty-hide + region labeling; verify clone a11y.
3. Update stories + product docs; spot-check e2e eyebrow assert.
4. Run lint, typecheck, stories smoke; walk parent release criteria.
5. Mark step 03 + feature complete in `partner-venues-slider-parent-guide.md`.
6. Rollback: revert story/doc/markup commits — marquee CSS from step 02 stays.

## Open Questions

- None blocking. If HeroUI `Surface` rejects `role`/`aria-labelledby`, use the smallest supported labeling API that still names the region once.
