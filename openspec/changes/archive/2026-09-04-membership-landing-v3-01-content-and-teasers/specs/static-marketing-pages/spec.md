## ADDED Requirements

### Requirement: Guest marketing home renders v3 content with live teasers

The system SHALL render the membership conversion landing on `/:locale` from a v3 content model, with the events rail sourced from the first 3 upcoming published events via a guest-safe teaser (title, description, date/time labels, place, image only — no credit prices, capacity, redemption, or event-detail URLs) and a static fallback when no upcoming events exist.

#### Scenario: Landing rail uses live upcoming teasers without guest-hidden details

- **WHEN** a guest opens `/:locale` with 3+ upcoming published events
- **THEN** the rail shows the 3 soonest teasers with no credit labels and no links to `/events/:id`

#### Scenario: Teaser list is limited and soonest-first

- **WHEN** more than 3 upcoming published events exist
- **THEN** only the first 3 ordered by ascending `date_time` are exposed to the landing rail

#### Scenario: Guest-safe teaser exposes no restricted fields

- **WHEN** a landing teaser is built from a catalog event row
- **THEN** it contains only id, title, description, dateLabel, time, place, and image — without credit price, capacity, redemption, or event-detail URL data

#### Scenario: Static fallback when no upcoming events exist

- **WHEN** a guest opens `/:locale` with zero upcoming published events or an unreachable catalog query
- **THEN** the rail renders the static fallback items (existing rail copy minus credits) instead of failing the build or rendering an empty rail

#### Scenario: V3 content is available in both locales

- **WHEN** the `landing-v3` content model is loaded for `de` or `en`
- **THEN** all v3 sections (hero + 29 € offer, events rail copy, credits, flexibility/partners, community, final CTA) are present with locale-matched copy ported from the mock
