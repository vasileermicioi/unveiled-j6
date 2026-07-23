## ADDED Requirements

### Requirement: UI docs list admin PageSectionHeader usage

Agent-facing UI docs (`docs/product/ui/ui-component-map.md`, `docs/product/ui/static-pages-content.md` as applicable) SHALL state that admin `AdminPageShell` titles use the shared `PageSectionHeader` pattern and that profile tabs render above the account header with shared column width.

#### Scenario: Component map mentions admin PageSectionHeader

- **WHEN** an implementer reads the PageSectionHeader / Profile / Admin entries in the UI component map
- **THEN** they can see that admin titles and profile tab order follow the shared header conventions from this feature

#### Scenario: Static pages content notes account and admin header chrome

- **WHEN** an implementer reads account/admin header guidance in `static-pages-content.md`
- **THEN** they learn that profile tabs sit above `PageSectionHeader` and admin shells use the shared eyebrow + headline + rule pattern

## MODIFIED Requirements

### Requirement: Section header documented for agents

Product UI docs SHALL describe the shared on-yellow `PageSectionHeader` (eyebrow + headline + rule) as the default page/section header for Discover, FAQ, auth, member browse surfaces, member account/profile pages, and admin `AdminPageShell` titles, distinct from the optional bordered `PageHero` card used on long-form marketing/legal pages. Agent-facing docs (`docs/product/ui/ui-component-map.md`, `docs/product/ui/static-pages-content.md`, and `docs/COMPONENTS.md` where headers are listed) SHALL make this distinction explicit and SHALL note profile tablist-above-header + shared column width so implementers do not invent one-off heroes, bare admin heading stacks, or treat `PageHero` as the FAQ/auth/admin default.

#### Scenario: Component map mentions PageSectionHeader

- **WHEN** an implementer reads the UI component / static pages docs
- **THEN** they can distinguish PageSectionHeader (Discover / account / admin pattern) from PageHero (card hero)

#### Scenario: FAQ and auth header presence in e2e

- **WHEN** Playwright covers FAQ and auth page headers after this change
- **THEN** assertions use proximity role/name (eyebrow and/or level-1 heading), not CSS-class or `data-testid` selectors for the ruled header
