## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-form-and-detail-02-event-detail-layout.md` and parent guide release criteria / non-goals (partner presentation guidance)
- [x] 1.2 Confirm prerequisites exist: `EventDetailPage.tsx` + stories, `[locale]/events/[id].tsx` + `getPublicEventById`, `getPartnerById`, `partners.logo_image_id`, `buildVariantUrl` / detail hero helpers, `.event-detail--checkout*` theme block

## 2. Partner logo data for public detail

- [x] 2.1 In the public event detail route (or a small catalog helper), load the partner via `getPartnerById(db, event.partnerId)` after the event loads
- [x] 2.2 Build logo URL with `buildVariantUrl(partner.logoImageId, "medium-640.webp")` and pass `{ name: event.partnerName, logoUrl }` (or equivalent `partnerAttribution`) into `EventDetailPage`
- [x] 2.3 Extend `EventDetailPageProps` for optional partner attribution; render name-only when `logoUrl` is absent (no broken `<img>`)

## 3. Two-row layout + partner attribution UI

- [x] 3.1 Restructure `EventDetailPage` into lg two-row grid: row 1 identity (title/location/partner) | checkout; row 2 hero image | Markdown description
- [x] 3.2 Implement partner attribution strip under the title (logo mark + name) — flat/theme-driven, not overlaid on the hero
- [x] 3.3 Switch eyebrow to category-only (drop `category // partner`); keep location under attribution
- [x] 3.4 Mobile/stacked order: title → partner → location → checkout → image → description → DETAILS → LOCATION → gallery
- [x] 3.5 Adjust `.event-detail--checkout*` (and `__partner` BEM if needed) in `globals.css` for the new structure; Tailwind layout-only on HeroUI nodes

## 4. Stories and verification

- [x] 4.1 Update `EventDetailPage` Ladle stories for the new grid; keep checkout viewer action matrix (Guest / Eligible / SoldOut / Membership* / PastDue / Gallery)
- [x] 4.2 Add or extend at least one story with partner logo URL present
- [x] 4.3 Run `bun run lint` and `bun run typecheck` (exit 0 for touched packages)
- [x] 4.4 Manual smoke: `/de/events/:id` — guest unlock CTA unchanged; eligible qty/credits/date still work; Markdown description in row 2; hero still primary `imageId`; partner logo+name in identity area

## 5. Handoff

- [x] 5.1 Note the exact partner attribution composition chosen (category-only eyebrow + under-title logo+name strip) in the parent guide for step 03 wording
- [x] 5.2 Defer Gherkin / Playwright / `ui-component-map` / design-system narrative sync to `event-form-and-detail-03-hardening-and-docs`
- [x] 5.3 Prepare PR or handoff linking `event-form-and-detail-02-event-detail-layout` and the parent guide (do not mark step 02 done in the parent until implementation lands)
