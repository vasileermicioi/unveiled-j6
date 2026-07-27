## Context

Public event detail (`EventDetailPage` + `/:locale/events/:id`) today uses one lg two-column block: identity (eyebrow `category // partnerName`, title, Markdown description, location) beside `EventDetailCheckoutCard`, then a full-width hero below, then DETAILS / LOCATION / gallery. Partners always have `logo_image_id` (NOT NULL after image-pipeline-02), but the public detail route only loads the `events` row via `getPublicEventById` — denormalized `partnerName` is present; logo is not. Parent feature `event-form-and-detail` step 02 reshapes composition and adds premium partner attribution before step 03 hardens docs/BDD.

Constraints: HeroUI-only markup (AGENTS.md §8–9; `<img>` OK inside wrappers); theme colors/borders only via `globals.css` `.event-detail--checkout*`; public page stays ungated; checkout CTA matrix unchanged; no floating badges on the hero; yellow page background unchanged.

## Goals / Non-Goals

**Goals:**

- lg+ two-row composition: (1) title + location + partner attribution | checkout; (2) primary event image | Markdown description.
- Mobile stack: title → partner → location → checkout → image → description → existing below-fold blocks.
- Partner logo URL loaded for `event.partnerId` and rendered with partner name in a quiet under-title / identity strip.
- Category signal kept without crowding (category-only eyebrow; partner moved to attribution).
- Theme + Ladle stories updated for the new grid and at least one logo variant.

**Non-Goals:**

- Admin form controls (step 01 — already done).
- Gherkin / Playwright / product doc narrative sync (step 03).
- Changing booking/qty/unlock POST semantics or `EventDetailCheckoutCard` action matrix.
- Partner public profile pages.
- Inventing new JSON-LD fields (organizer image optional only if trivial; today `organizer` is name-only — leave as-is this step).

## Decisions

1. **Parallel `getPartnerById` in the route (not a catalog join rewrite)**  
   - **Why:** `getPublicEventById` is a thin `getEventById`; adding a join touches shared catalog paths. Route already has `db` + `event.partnerId`; `getPartnerById` is exported from `@unveiled/db` catalog. Pass `{ name: event.partnerName, logoUrl }` (or `partnerAttribution`) into `EventDetailPage`.  
   - **Alternatives:** Extend `getPublicEventById` with a partners join (cleaner long-term, more surface); denormalize logo on events (schema churn, out of scope).

2. **Logo URL via `buildVariantUrl(logoImageId, "medium-640.webp")`**  
   - **Why:** Aligns with Discover partner tiles (`toDiscoverPartnerTile` / `medium-640.webp`). Admin list uses `small-320`; detail attribution can use medium for crisp marks. Build URL in the route (or a tiny mapper next to `catalog-mappers`) — no new `@unveiled/ui` helper required.  
   - **Alternatives:** `small-320` only (softer on retina); dedicated `buildPartnerLogoSrc` in `@unveiled/ui` (nice-to-have, skip unless reuse grows).

3. **Composition: category-only eyebrow + under-title partner attribution strip**  
   - **Why:** Parent guide leaves the exact treatment to step 02; separating category from partner removes the old `category // partner` crowding and gives the logo a dedicated quiet strip under the title (before location). Flat bordered surface / theme tokens — not a card stack, not a floating sticker on the hero.  
   - **Structure sketch (lg):**
     - Row 1: identity column (eyebrow category → title → partner strip → location) | checkout
     - Row 2: hero image | Markdown description
     - Below: DETAILS → LOCATION → gallery  
   - **Alternatives:** Category chip above title (also fine; prefer eyebrow to minimize new chrome); partner in eyebrow with logo (crowded).

4. **CSS grid via existing `.event-detail--checkout__layout` + new row/region BEM**  
   - **Why:** Hard rule — visual styling in `globals.css`. Extend checkout theme block with regions such as `__row-identity`, `__row-media`, `__partner` rather than per-route Tailwind colors. Tailwind on HeroUI nodes stays layout-only (`grid`, `gap`, breakpoints).  
   - **Alternatives:** Nested Card chrome for each cell (heavier; parent asks for no card-heavy chrome).

5. **Description moves out of identity into row-2 media column**  
   - **Why:** Spec delta requires image | description on large viewports; today description lives in identity and pushes location down. On small screens description follows image after checkout.  
   - **Alternatives:** Keep description under title on all breakpoints (violates product two-row intent).

6. **Hero stays primary `event.imageId` via existing `buildDetailHeroSrc` / `SrcSet`**  
   - **Why:** No change to image pipeline; only placement changes (left cell of row 2 instead of full-bleed under identity).  
   - **Alternatives:** Full-bleed hero above everything (rejected by product).

7. **Stories: keep checkout viewer matrix; add logo-present story**  
   - **Why:** Guest / Eligible / SoldOut / Membership* / PastDue / Gallery variants must still exercise CTAs. Add (or extend Guest) with `partnerAttribution.logoUrl` so Ladle proves the strip. Fixtures already have `mockPartner.logoImageId` — wire a sample public URL or placeholder path.  
   - **Alternatives:** Only document logo in manual smoke (weaker).

8. **Skip JSON-LD organizer logo this step**  
   - **Why:** Step plan: do not invent SEO fields unless trivial; `buildEventJsonLd` organizer is name-only and product SEO does not require organizer image. Defer to a later SEO pass if needed.  
   - **Alternatives:** One-line `logo` on Organization when URL present (acceptable follow-up; not required for apply).

## Risks / Trade-offs

- **[Risk] Partner row missing / logo_image_id unexpectedly null on legacy data** → Treat logo as optional in the UI (show name-only strip if URL absent); schema says NOT NULL for new partners, but defensive render avoids blank broken `<img>`.  
- **[Risk] Extra DB round-trip per detail view** → Single `getPartnerById` by PK; acceptable for MVP; join can wait for a later catalog optimization.  
- **[Risk] Theme regression on checkout column alignment** → Reuse checkout card styles; only restructure surrounding grid; verify Eligible qty chrome and Guest unlock CTAs in Ladle wide frame.  
- **[Trade-off] Category-only eyebrow loses inline partner in one line** → Partner attribution with logo is richer; document chosen composition for step 03 wording.  
- **[Trade-off] Product Gherkin still describes old “identity + summary card” until step 03** → Intentional; note composition choice in parent guide for 03.

## Migration Plan

1. Add partner logo lookup + props → restructure `EventDetailPage` markup/grid → theme BEM → stories → lint/typecheck → manual smoke.  
2. No DB, env, or deploy migration.  
3. Rollback: revert `apps/web` component/route/theme/story files; no data migration.

## Open Questions

- None blocking. Logo variant size defaults to `medium-640.webp` (Discover-aligned); switch to `small-320` only if attribution looks oversized in smoke.
