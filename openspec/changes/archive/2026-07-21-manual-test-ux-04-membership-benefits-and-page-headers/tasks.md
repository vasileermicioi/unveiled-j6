## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-ux-04-membership-benefits-and-page-headers.md`, parent guide, and this change’s `design.md` / specs
- [x] 1.2 Diff `MembershipInfoPage` perk strip vs refs (`.dev-plan/manual-test-sub-page.png`, `.dev-plan/manual-test-post-sub-page.png`) and note guest-home vertical perk precedent
- [x] 1.3 List pages that still skip `PageSectionHeader` (start with `BookEventPage`, `BookConfirmPage`, waitlist join/cancel)

## 2. Membership benefits list

- [x] 2.1 Replace `MembershipInfoPage` three-up `SectionCard` grid with a vertical `.membership-benefits` list (icon + perk text per row)
- [x] 2.2 Map a distinct lucide (or existing) icon per perk index; reuse DE/EN strings from `membership.ts` unless a string is wrong
- [x] 2.3 Add `.membership-benefits__*` theme styles in `globals.css` (tokens only; Tailwind for layout/gap); ensure contrast on yellow page
- [x] 2.4 Update `MembershipInfoPage.stories.tsx` so guest/checkout/active (and other views that show perks) render the vertical list

## 3. Shared page headers

- [x] 3.1 Add DE/EN `eyebrow` fields to `booking-content.ts` (book, confirm, past-due as needed)
- [x] 3.2 Migrate `BookEventPage` and `BookConfirmPage` titles to `PageSectionHeader`; keep transactional subtitles below the header
- [x] 3.3 Add waitlist eyebrows and migrate `WaitlistJoinPage` / `WaitlistCancelPage` bare H1s to `PageSectionHeader` in the same pass
- [x] 3.4 Update `docs/product/ui/static-pages-content.md` and/or `ui-component-map.md` for vertical membership benefits + booking/waitlist header consumers

## 4. Validation and handoff

- [x] 4.1 Run `bun run lint` (exit 0)
- [x] 4.2 Run `bun run typecheck` (exit 0)
- [x] 4.3 Manual `/en/membership` (and `/de` smoke): vertical icon-bullet benefits pre- and post-subscribe views
- [x] 4.4 Manual book page: header matches Discover/FAQ `PageSectionHeader` pattern; spot-check confirm + waitlist
- [x] 4.5 Mark `manual-test-ux-04-membership-benefits-and-page-headers` done in `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
