## ADDED Requirements

### Requirement: Credits marketing copy accuracy
Marketing and membership perk copy SHALL state that members receive fresh monthly credits and MUST NOT claim that credits roll over. App content modules and the `content-i18n-inventory.md` membership `perks[2]` entry SHALL agree on the corrected wording (for example DE: "17 Credits jeden Monat" / EN: "17 fresh credits every month").

#### Scenario: No rollover claim
- **WHEN** a guest views membership perks
- **THEN** copy does not say credits roll over

#### Scenario: Inventory documents corrected perk
- **WHEN** an agent reads `docs/product/extras/content-i18n-inventory.md` membership `perks[2]`
- **THEN** the entry reflects the corrected no-rollover wording and is not marked as needing copy correction
