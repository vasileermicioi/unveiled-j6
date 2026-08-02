## ADDED Requirements

### Requirement: Event detail hero uses theme-owned non-stretch framing

Hero framing rules for the public event-detail primary image SHALL live in theme CSS (`apps/web/app/styles/globals.css` or the shared brand theme entry consumed by production). Routes and page components MUST NOT reintroduce ad-hoc stretch-to-fill utilities (for example Tailwind `object-cover` / forced `w-full` fill meant to stretch the bitmap into the frame). Markup MAY use HeroUI `Surface` plus the documented native `<img>` exception; visual sizing MUST come from theme classes such as `.event-detail--checkout__hero` / `.event-detail--checkout__hero-image`. EventDetail Ladle stories SHALL remain consistent with the theme-owned non-stretch contract.

#### Scenario: Theme CSS owns checkout hero sizing

- **WHEN** an implementer inspects the public event-detail primary hero styling
- **THEN** full-width frame, horizontal centering, and non-stretch sizing are defined on theme classes
- **AND** the route/component does not add ad-hoc stretch-to-fill visual utilities on the hero image

#### Scenario: EventDetail stories match non-stretch framing

- **WHEN** an implementer opens EventDetail Ladle stories after this change
- **THEN** the primary hero renders under the same theme classes used in production
- **AND** the stories do not document or force a stretch-to-fill hero treatment
