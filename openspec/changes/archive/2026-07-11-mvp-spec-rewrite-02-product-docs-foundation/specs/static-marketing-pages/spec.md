## ADDED Requirements

### Requirement: Discover to events navigation

The public Discover experience (locale home `/:locale`) SHALL present marketing content and a curated event preview and SHALL provide a clear path into fuller event browsing: preview cards link to public `/events/:id`, and primary CTAs lead guests to signup/login that lands on member `/events` after auth (and onboarding if incomplete). Guests SHALL NOT receive a public full upcoming-events list equivalent to `/events` in MVP. Product docs (`docs/product/sitemap/sitemap.md`, `ui/app-shell.md`, `ui/static-pages-content.md`) SHALL document these CTAs without dead ends.

#### Scenario: Guest continues from Discover toward events

- **WHEN** a guest views Discover with preview events
- **THEN** they can follow documented CTAs to event detail and/or to authenticate into the member events feed without dead ends

#### Scenario: Guest has no public full feed

- **WHEN** a guest is not signed in
- **THEN** product docs do not offer an ungated `/events` browse list; the full feed remains member-gated

#### Scenario: Member path after auth

- **WHEN** a guest completes signup or login from a Discover CTA (and finishes onboarding if required)
- **THEN** they land on member `/events` as the fuller browse experience
