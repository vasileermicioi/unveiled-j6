## 1. Pre-flight

- [x] 1.1 Read `proposal.md`, `design.md`, and `specs/static-marketing-pages/spec.md` end-to-end
- [x] 1.2 Confirm step 03 artifacts are merged: FAQ, membership, content modules, SEO helpers
- [x] 1.3 Read Discover sections in `static-pages-content.md` and EventCard guest-state rules in `ui-component-map.md`
- [x] 1.4 Confirm `discoverContent` and `legalContent` keys match spec copy; confirm `GuestFooter.tsx` links target `impressum`, `privacy`, `terms`, `discover`

## 2. SEO metadata helpers

- [x] 2.1 Add `discoverPageMeta(content, pageTitle)` to `apps/web/app/lib/seo.ts` — nav title, description from hero subheadline
- [x] 2.2 Add `legalPageMeta(content)` helper — `pageTitle` and `intro` for impressum, privacy, terms routes

## 3. Mock discover data

- [x] 3.1 Create `apps/web/app/lib/mock/discover-data.ts` with typed exports for mock events (4–6), partners (up to 8), and static hero stats
- [x] 3.2 Include at least one mock event with `remainingCapacity: 0` for guest CTA QA
- [x] 3.3 Add file header comment marking data as Phase 1 placeholder (replaced in Phase 4)

## 4. EventCardPreview component

- [x] 4.1 Create `apps/web/app/components/marketing/EventCardPreview.tsx` — HeroUI Card with image placeholder, title, partner, date, credit price
- [x] 4.2 Render guest CTA only: "Mehr sehen" (DE) / "See details" (EN) — never "Waitlist" or "Book Now" regardless of capacity
- [x] 4.3 Default CTA href to `#` or configurable stub; no bookmark toggle

## 5. Discover page component and route

- [x] 5.1 Create `apps/web/app/components/marketing/DiscoverPage.tsx` with all five sections from spec
- [x] 5.2 Hero: two-column layout with stat tiles (yellow/white/grey), CTAs to membership and `#events` anchor
- [x] 5.3 Value props: 3-column `SectionCard` grid
- [x] 5.4 Live preview: section header + grid of up to 6 `EventCardPreview`; dashed empty state when mock array is empty
- [x] 5.5 Categories: numbered tiles 01–06 + missing-venue callout with mailto to `support@unveiled.berlin`
- [x] 5.6 Partners: eyebrow header + grid of partner tiles with initial-letter fallback
- [x] 5.7 Create `apps/web/app/routes/[locale]/discover.tsx` (flat HonoX route file) wiring content, mock data, and `c.render()` SEO props

## 6. Legal pages

- [x] 6.1 Create `apps/web/app/components/marketing/LegalPage.tsx` — `PageHero` + `SectionCard` stack per legal section
- [x] 6.2 Create `apps/web/app/routes/[locale]/impressum.tsx` using `getPageContent(locale, "impressum")`
- [x] 6.3 Create `apps/web/app/routes/[locale]/privacy.tsx` using `getPageContent(locale, "privacy")`
- [x] 6.4 Create `apps/web/app/routes/[locale]/terms.tsx` using `getPageContent(locale, "terms")`
- [x] 6.5 Pass `c.render()` SEO props on all three legal routes

## 7. Navbar and navigation

- [x] 7.1 Verify `GuestNavbar` highlights Discover nav item when pathname is `/{locale}/discover`; fix `isActiveNavPath` if needed
- [x] 7.2 Confirm footer legal links on `/de` navigate to working routes (no 404)

## 8. Validation

- [x] 8.1 Run `bun run typecheck` — exits 0
- [x] 8.2 Run `bun run lint` — exits 0 (pre-existing SVG a11y warning in logo asset only)
- [x] 8.3 Visit `/de/discover` — hero stats, 3 value cards, event grid with mock cards, category grid, partner grid, callout mailto
- [x] 8.4 Visit `/en/impressum`, `/de/privacy`, `/en/terms` — localized headings and structured placeholder sections render
- [x] 8.5 Verify sold-out mock event card shows "See details" / "Mehr sehen", not "Waitlist"
- [x] 8.6 View Source on `/de/discover` — unique meta tags and hreflang alternates in initial HTML
- [x] 8.7 Manual: DE/EN language toggle on `/de/discover` navigates to `/en/discover` preserving path

## 9. Wrap-up

- [x] 9.1 Mark step 04 done in `marketing-site-README.md` when change is archived
