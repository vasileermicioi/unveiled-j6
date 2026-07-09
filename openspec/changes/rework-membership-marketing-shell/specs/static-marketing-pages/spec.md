## ADDED Requirements

### Requirement: Membership marketing page uses wide shell and prominent perks

The route `/:locale/membership` SHALL render inside the same wide marketing content shell as other public marketing pages (`max-w-7xl` with matching horizontal padding and vertical section gaps). The three membership perk strings from `membershipContent` SHALL each appear as a distinct bordered card (or equivalent HeroUI card tile) in a responsive multi-column grid so they are visually primary—not a plain text list. Headline, subtitle, guarantee, primary CTA label, and secure-payment line SHALL keep existing DE/EN copy. The primary CTA MAY remain disabled until Stripe checkout ships.

#### Scenario: Membership page matches marketing width

- **WHEN** a guest visits `/en/membership` or `/de/membership`
- **THEN** the main content uses the wide marketing shell (not a narrow `max-w-lg`-only card as the sole layout)

#### Scenario: Perks render as distinct cards

- **WHEN** a guest views the membership page
- **THEN** each of the three perk strings is visible as its own card/tile in a multi-column layout on desktop breakpoints

#### Scenario: Membership copy unchanged

- **WHEN** the membership page renders in EN
- **THEN** the headline, subtitle, three perks, guarantee, CTA label, and secure line match the existing `membershipContent.en` strings

### Requirement: Guest header has no separate Become-a-member CTA

Guest chrome SHALL NOT render a dedicated "Mitglied werden" / "Become a member" header or mobile-drawer CTA. Guests SHALL still reach membership via the primary nav Membership item and Sign up via the Sign up control.

#### Scenario: No Become-a-member button in guest header

- **WHEN** a guest views any public page with the site header
- **THEN** no header or drawer control labeled "Become a member" / "Mitglied werden" is shown as a CTA button
- **AND** Login and Sign up remain available for guests (where guest auth actions are shown)
- **AND** the Membership nav item remains available

### Requirement: FAQ page has no Back button

The FAQ page SHALL NOT render a Back / Zurück button. Guests navigate away via the site header, footer, or other in-page links.

#### Scenario: FAQ has no Back control

- **WHEN** a guest visits `/de/faq` or `/en/faq`
- **THEN** no Back / Zurück button is shown on the page
