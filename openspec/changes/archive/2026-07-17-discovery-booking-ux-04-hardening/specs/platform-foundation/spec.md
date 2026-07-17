## ADDED Requirements

### Requirement: Section header documented for agents

Product UI docs SHALL describe the shared on-yellow `PageSectionHeader` (eyebrow + headline + rule) as the default page/section header for Discover, FAQ, auth, and member browse surfaces, distinct from the optional bordered `PageHero` card used on long-form marketing/legal pages. Agent-facing docs (`docs/product/ui/ui-component-map.md`, `docs/product/ui/static-pages-content.md`, and `docs/COMPONENTS.md` where headers are listed) SHALL make this distinction explicit so implementers do not invent one-off heroes or treat `PageHero` as the FAQ/auth default.

#### Scenario: Component map mentions PageSectionHeader

- **WHEN** an implementer reads the UI component / static pages docs
- **THEN** they can distinguish PageSectionHeader (Discover pattern) from PageHero (card hero)

#### Scenario: FAQ and auth header presence in e2e

- **WHEN** Playwright covers FAQ and auth page headers after this change
- **THEN** assertions use proximity role/name (eyebrow and/or level-1 heading), not CSS-class or `data-testid` selectors for the ruled header
