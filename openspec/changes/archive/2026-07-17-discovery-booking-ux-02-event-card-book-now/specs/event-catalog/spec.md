## MODIFIED Requirements

### Requirement: EventCard public component

The `@unveiled/ui` package SHALL export an `EventCard` component matching `docs/product/ui/ui-component-map.md` (product SoT updates for CTA copy may lag until hardening), using image variants `medium-640` and `small-320` via srcset. The primary CTA SHALL use the label **Book Now** / **Bin dabei** when remaining capacity is greater than zero, for both guests and signed-in members regardless of subscription status. When remaining capacity is zero, the CTA SHALL use **Waitlist** / **Warteliste**. The primary CTA SHALL navigate to the public event detail route `/:locale/events/:id` and SHALL NOT navigate directly to `/events/:id/book` or `/membership`.

#### Scenario: Guest Book Now opens detail

- **WHEN** a guest views an EventCard with remaining capacity
- **THEN** the primary CTA label is Book Now (or Bin dabei)
- **AND** following the CTA opens `/:locale/events/:id` without authentication

#### Scenario: Member Book Now regardless of subscription

- **WHEN** a signed-in member with inactive subscription views an EventCard with remaining capacity
- **THEN** the primary CTA label is Book Now (or Bin dabei)

#### Scenario: Sold-out Waitlist label

- **WHEN** any viewer sees an EventCard with zero remaining capacity
- **THEN** the primary CTA label is Waitlist (or Warteliste)

#### Scenario: Bookmark control accessibility

- **WHEN** EventCard renders a save toggle
- **THEN** the control exposes an `aria-label` describing save/unsaved state
