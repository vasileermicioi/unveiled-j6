## Why

Public `/events/:id` currently stacks identity (eyebrow, title, description, location) beside checkout with a full-width hero below. Large viewports need a clearer two-row composition (title/location | checkout, then image | description) and a professional partner name + logo attribution so venue hosting reads as premium without floating badges on the hero.

## What Changes

- Restructure `EventDetailPage` lg+ layout into two primary rows:
  1. Title + location (+ partner attribution) | existing checkout card
  2. Primary event image | Markdown description
- Keep DETAILS metadata, LOCATION map, and gallery below those rows (order preserved).
- Load partner logo for the event’s `partnerId` (`partners.logo_image_id` → public variant URL) and pass attribution data into the page.
- Render premium partner attribution (logo mark + denormalized `partnerName`) near the title — flat/theme-driven, not a floating hero badge.
- Clarify category vs partner signals (category-only eyebrow + separate partner strip, or equivalent) without overcrowding.
- Stack sanely on mobile: title → partner → location → checkout → image → description → below-fold blocks.
- Adjust `.event-detail--checkout*` theme rules for the new grid; update Ladle stories (including at least one with logo).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-discovery`: Public event detail lg+ uses the two-row layout; partner name + logo attribution appears in the identity area (not overlaid on the hero).

## Impact

- **Page UI:** `apps/web/app/components/catalog/EventDetailPage.tsx` + `EventDetailPage.stories.tsx`
- **Route / data:** `apps/web/app/routes/[locale]/events/[id].tsx`; partner lookup via `getPartnerById` (or catalog join) + `buildVariantUrl` for logo
- **Theme:** `apps/web/app/styles/globals.css` — `.event-detail--checkout*` (+ small partner-attribution BEM block if needed)
- **Unchanged this step:** `EventDetailCheckoutCard` booking/unlock behavior; gallery/map below-fold; admin form controls (01); Gherkin/Playwright/product doc sync (03); JSON-LD organizer image (optional only if trivial — currently name-only); partner public profile pages
- **Source brief:** `.dev-plan/current-iteration/event-form-and-detail-02-event-detail-layout.md`
- **Parent:** `.dev-plan/current-iteration/event-form-and-detail-parent-guide.md`
- **Depends on:** `event-form-and-detail-01-admin-form-controls` (ordering; no hard code dependency — archived/done)
- **Consumed by:** `event-form-and-detail-03-hardening-and-docs`
- **Verification:** `bun run lint`; `bun run typecheck`; Ladle wide-frame row alignment + logo story; manual smoke on `/de/events/:id`
