## Why

EventCard primary CTAs currently vary by viewer state (guest “See details”, inactive “Unlock event”, active “Book Now”) and inactive members are sometimes sent to `/membership` from the feed. Product direction for this iteration is a single booking invitation on every bookable card that always opens the public event detail page, where membership and booking decisions happen.

## What Changes

- Bookable EventCards always label the primary CTA **Book Now** / **Bin dabei** for guests and members, regardless of subscription status.
- Sold-out cards (`remainingCapacity <= 0`) keep **Waitlist** / **Warteliste** as the label.
- Primary CTA href from Discover, member feed, and saved events always targets `/:locale/events/:id` — never `/membership` or `/events/:id/book` from the card.
- EventCard Ladle stories (and any app stories asserting old labels) updated to the new contract.
- Product SoT rewrites (Gherkin, component map, charter, i18n inventory) deferred to step `discovery-booking-ux-04-hardening`; this change updates openspec delta specs and implementation only.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: EventCard primary CTA precedence — Book Now for capacity remaining (all viewers); Waitlist when sold out; always navigate to public detail.
- `event-discovery`: Authenticated feed / saved-list EventCard CTA no longer uses Unlock event → `/membership`; always detail.
- `static-marketing-pages`: Discover preview EventCard guest CTA changes from “See details” / “Mehr sehen” to Book Now / Bin dabei (still links to public detail).
- `platform-foundation`: Guest EventCard story expectations align with Book Now (not “See details”).

## Impact

- Code: `packages/ui/src/EventCard.tsx` (`resolveEventCardCta`), `packages/ui/src/EventCard.stories.tsx`, `apps/web/app/components/discovery/EventFeedPage.tsx` (`resolveEventFeedCtaHref`), call sites in Discover / feed / saved pages.
- Behavior: inactive members and guests land on public detail from the card; booking/membership/waitlist remain on detail and subsequent SSR pages.
- Out of scope: event detail checkout redesign (step 03), `docs/product/` SoT rewrites (step 04), bookmark SSR forms, credit price / availability strip.
