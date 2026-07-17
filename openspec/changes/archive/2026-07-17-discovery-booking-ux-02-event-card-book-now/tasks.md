## 1. Setup

- [x] 1.1 Confirm current `resolveEventCardCta` precedence (guest → waitlist → unlock → book) in `packages/ui/src/EventCard.tsx`
- [x] 1.2 Confirm `resolveEventFeedCtaHref` sends inactive non-sold-out members to `/membership` in `EventFeedPage.tsx` (also used by `SavedEventsPage.tsx`)
- [x] 1.3 Skim Discover call site to confirm it already passes detail `ctaHref`

## 2. EventCard CTA labels

- [x] 2.1 Change `resolveEventCardCta` so sold-out → Waitlist / Warteliste; otherwise → Book Now / Bin dabei for all viewers
- [x] 2.2 Remove unused `guestCtaLabel` / `unlockCtaLabel` helpers (or stop calling them)
- [x] 2.3 Keep CTA as HeroUI `Link` with existing theme button classes; do not add booking form POST on the card

## 3. CTA href call sites

- [x] 3.1 Simplify `resolveEventFeedCtaHref` to always return `localizedPath(locale, \`events/${event.id}\`)`
- [x] 3.2 Verify SavedEvents and EventFeed pages pick up the new helper behavior
- [x] 3.3 Verify Discover guest cards still target detail and now show Book Now via shared label resolution

## 4. Stories

- [x] 4.1 Update `packages/ui/src/EventCard.stories.tsx`: guest/member bookable → Book Now; sold-out → Waitlist; remove or replace Unlock / See-details story names
- [x] 4.2 Fix any apps/web stories or unit assertions that hardcode “See details” / “Unlock event” for the primary CTA

## 5. Validation

- [x] 5.1 Run `bun run lint` (exit 0)
- [x] 5.2 Run `bun run typecheck` (exit 0)
- [x] 5.3 Confirm Ladle EventCard stories compile / show the new CTA matrix
- [x] 5.4 Manual smoke: guest `/de` Book Now → `/de/events/:id`; inactive member `/de/events` Book Now → detail (not `/membership`)
- [x] 5.5 Grep call sites to confirm no EventCard primary CTA href targets `/book` or `/membership`

## 6. Handoff

- [x] 6.1 Mark step 02 done in `.dev-plan/current-iteration/discovery-booking-ux-parent-guide.md`
- [x] 6.2 Note for step 04 docs to update: `docs/product/ui/ui-component-map.md`, `docs/product/features/static-pages.feature`, `docs/product/extras/content-i18n-inventory.md`, `docs/product/CHARTER.md` Discover CTA note, plus related UX_RULES / sitemap / static-pages-content if still stale
