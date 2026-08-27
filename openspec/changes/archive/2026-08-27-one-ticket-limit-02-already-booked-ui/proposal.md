## Why

Step 01 already rejects a second ticket for the same occurrence (`ALREADY_BOOKED` + unique index), but event detail and `/events/:id/book` still look like a fresh checkout. A member who reopens a booked hour only discovers the limit after POST (or a generic error). This increment of **one ticket per occurrence** is the user-visible already-booked state.

## What Changes

- Event detail GET (booking-eligible member only): load that member’s active booked occurrence instants for the event (`listActiveBookedOccurrenceInstants`) and pass them into the checkout island. When the **selected** hour is in that set, hide the book CTA and waitlist CTA, show the locked already-booked copy, and show a link to `/:locale/bookings` labeled `Meine Tickets` / `My Tickets`. Keep the datetime `<select>` when ≥2 future slots so switching to an unbooked hour restores the book (or waitlist) CTA client-side.
- Book page GET: if the resolved slot is already held, render the same message + My Tickets link **instead of** the confirm form (no POST affordance). When ≥2 future occurrences exist, keep the datetime `<select>` as a GET to `?dateTime=` so an unbooked hour restores the form.
- Book page POST: map `ALREADY_BOOKED` to that same already-booked view (not `errorGeneric`).
- Shared DE/EN copy in `booking-content.ts` (one helper imported by detail and book — no duplicated strings). Verbatim from the parent guide.
- Sold-out + already-booked: already-booked wins for the selected hour. Guests / past-due / membership-required: do not query and do not show already-booked chrome.
- Ladle stories: already-booked vs bookable hour on `EventDetailPage` / checkout card and `BookEventPage`.
- Out of scope: unique index / domain (step 01, shipped); Gherkin, Playwright, `docs/product/` canonical rewrites (step 03); changing My Tickets list itself; waitlist confirmation pages; new theme tokens.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `booking`: When a booking-eligible member views `/events/:id` or `/events/:id/book` and the selected (or only) future occurrence is one they already hold as `CONFIRMED` or `USED`, the system SHALL NOT show a confirm-booking form or book CTA for that occurrence. It SHALL show the locked already-booked copy and a My Tickets link. Other unbooked future hours on the same event remain selectable and bookable. A POST that loses the race SHALL render the same message rather than a generic booking error.
- `event-discovery`: Booking-eligible event detail SHALL show datetime selection when two or more future occurrences exist, the one-ticket credit total for the selected slot, and either a book CTA or the already-booked message for that slot. It SHALL NOT show a ticket-quantity stepper. Guests SHALL continue to omit datetime dropdown, quantity, and credit totals.

## Impact

- **SSR (`apps/web`):** `app/routes/[locale]/events/[id].tsx` (eligible GET queries booked instants); `app/routes/[locale]/events/[id]/book.tsx` (GET already-booked view; POST maps `ALREADY_BOOKED`).
- **UI:** `EventDetailPage`, `resolveCheckoutActions` / `EventDetailCheckoutCard` island (selected-slot overlay + keep hour picker); `BookEventPage` (`view: "already_booked"`); shared copy in `app/lib/booking-content.ts`; `localizedPath(locale, "bookings")`.
- **Domain:** reuse `listActiveBookedOccurrenceInstants` from `@unveiled/db` — no schema or `bookEvent` changes.
- **Stories:** `EventDetailPage.stories.tsx`, `BookEventPage.stories.tsx` (and checkout-card stories if split).
- **Source brief:** `.dev-plan/current-iteration/one-ticket-limit-02-already-booked-ui.md`
- **Parent:** `.dev-plan/current-iteration/one-ticket-limit-parent-guide.md`
- **Depends on:** `one-ticket-limit-01-schema-and-domain` (archived, shipped)
- **Consumed by:** `one-ticket-limit-03-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; `cd apps/web && bun test` if checkout/book copy tests exist; stories show the DE/EN sentence and a link whose accessible name is `Meine Tickets` / `My Tickets`
