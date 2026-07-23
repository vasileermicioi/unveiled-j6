## RENAMED Requirements

- FROM: `### Requirement: Account page section header`
- TO: `### Requirement: Account page chrome order and width`

## MODIFIED Requirements

### Requirement: Account page chrome order and width

Member account pages under `/:locale/profile*` SHALL render the profile tablist **above** the shared `PageSectionHeader` (eyebrow + headline + rule), matching admin tab-above-title order. The tablist, page header (including the header rule), and primary content card SHALL share the same content column width so the header is not wider than the card. Member account pages SHALL use the shared `PageSectionHeader` pattern used by other member surfaces such as Saved and My Tickets, instead of a standalone heading plus muted subtitle-only intro. Page-level muted subtitles under the title SHALL NOT be shown; essential instructional copy for destructive or GDPR flows MAY remain in card body content below the header.

#### Scenario: Tabs above account title

- **WHEN** a signed-in member opens `/en/profile` or another `/en/profile/*` tab route
- **THEN** the account tablist appears above the account `PageSectionHeader` title

#### Scenario: Header matches content column width

- **WHEN** a signed-in member opens `/en/profile`
- **THEN** the page header rule aligns to the same column width as the tab track and content card

#### Scenario: Profile header matches member app chrome

- **WHEN** a signed-in member opens `/en/profile`
- **THEN** the page intro uses the same eyebrow + headline header component pattern as `/en/saved`
- **AND** a muted subtitle line is not shown directly under the page title

#### Scenario: Account subpages share PageSectionHeader

- **WHEN** a signed-in member opens `/en/profile/details`, `/en/profile/preferences`, `/en/profile/billing`, `/en/profile/security`, `/en/profile/data-export`, or `/en/profile/delete-account`
- **THEN** each page intro uses `PageSectionHeader` with a localized eyebrow and headline
