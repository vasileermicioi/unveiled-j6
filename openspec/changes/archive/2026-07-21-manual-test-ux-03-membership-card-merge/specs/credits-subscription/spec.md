## ADDED Requirements

### Requirement: Membership marketing card composition
The membership page SHALL present the upgrade headline, primary subscription CTA (or state-specific action), secure-payment note when relevant, and perk list inside a single card surface. The gray muted marketing lines previously shown as subtitle/guarantee under the checkout title (e.g. EN “Full Access. 17 Credits/mo. Cancel anytime.” and “No hidden fees. Cancel monthly.”) SHALL NOT be shown on the checkout/guest views. Active and frozen status messaging that is not that marketing filler SHALL remain available. Meta description MAY continue to reuse the subtitle string for SEO without rendering it on the page.

#### Scenario: Single card with aligned perks
- **WHEN** a member views `/:locale/membership` in checkout view
- **THEN** they see one card containing the title/CTA and the three perk rows
- **AND** each perk icon is vertically centered with its text
- **AND** the gray subtitle and guarantee marketing lines are not visible

#### Scenario: Guest membership page has one card without gray filler
- **WHEN** a guest views `/:locale/membership`
- **THEN** they see one card with title, guest CTAs, and perks
- **AND** they do not see the muted Full Access / No hidden fees style marketing lines

#### Scenario: Active member keeps status messaging
- **WHEN** an `ACTIVE` member views `/:locale/membership`
- **THEN** status messaging for the active state remains visible
- **AND** the page still uses a single card surface for title/CTA and perks

## MODIFIED Requirements

### Requirement: Membership marketing benefits presentation
The membership page SHALL present plan benefits as a vertical list inside the same membership card as the headline/CTA. Each benefit SHALL include a distinct icon bullet and localized text, with the icon vertically centered relative to its label. Horizontal three-up perk cards SHALL NOT be the default presentation. A second separate benefits-only card SHALL NOT be required.

#### Scenario: Vertical icon benefits on membership
- **WHEN** a user views `/:locale/membership`
- **THEN** benefits appear stacked vertically with icons inside the membership card
- **AND** each benefit remains readable in DE and EN
- **AND** each icon is vertically centered with its text

#### Scenario: Same presentation after subscribe
- **WHEN** an `ACTIVE` member views `/:locale/membership`
- **THEN** the benefits list remains a vertical icon-bullet stack inside the single membership card (not a three-column perk card strip and not a second benefits-only card)
