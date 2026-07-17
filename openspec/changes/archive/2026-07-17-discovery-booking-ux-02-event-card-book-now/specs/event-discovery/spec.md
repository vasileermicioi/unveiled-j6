## MODIFIED Requirements

### Requirement: EventCard CTA precedence on the feed

The system SHALL render EventCard primary CTAs on the authenticated feed with sold-out → Waitlist label, otherwise Book Now — for both ACTIVE and inactive subscriptions — without implementing booking or waitlist POST handlers on the card. The primary CTA href SHALL always be the public event detail route `/:locale/events/:id` and SHALL NOT target `/membership` or `/events/:id/book`. Bookmark controls on the feed SHALL persist save and unsave via SSR form POST and SHALL reflect whether each event is already saved for the current member.

#### Scenario: Inactive member Book Now opens detail

- **WHEN** a signed-in member with inactive subscription views a bookable event on the feed
- **THEN** the EventCard primary CTA uses the Book Now label
- **AND** following the CTA opens `/:locale/events/:id` (not `/membership`)

#### Scenario: Active member book CTA without booking POST

- **WHEN** a signed-in member with an ACTIVE subscription views a bookable event on the feed
- **THEN** the EventCard primary CTA uses the Book Now label
- **AND** activating it does not submit a booking POST (links to event detail only)

#### Scenario: Sold-out waitlist label without waitlist POST

- **WHEN** a signed-in member views a sold-out event on the feed
- **THEN** the EventCard primary CTA uses the Waitlist label
- **AND** activating it does not submit a waitlist join POST
- **AND** following the CTA opens `/:locale/events/:id`

#### Scenario: Bookmark persists from feed

- **WHEN** a signed-in member toggles the bookmark control on a feed EventCard
- **THEN** the save or unsave is persisted for that member
