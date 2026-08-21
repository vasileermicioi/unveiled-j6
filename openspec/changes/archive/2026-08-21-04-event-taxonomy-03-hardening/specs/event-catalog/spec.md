## ADDED Requirements

### Requirement: Schema documents allowlisted category and type

`docs/product/database/schema-overview.md` SHALL describe `events.category` and `events.event_type` as allowlisted locale-invariant keys from `EVENT_CATEGORIES` and `EVENT_TYPES` in `@unveiled/db` (module `event-taxonomy.ts`), not free-form strings. The overview SHALL note that DE/EN labels live next to those constants in code and that member onboarding `INTERESTS` is a separate list. `docs/product/extras/gaps-and-decisions.md` SHALL record that event category is not member interests. `docs/product/extras/content-i18n-inventory.md` SHALL document category/type labels with the admin-content maps (`getEventCategoryLabel` / `getEventTypeLabel`), not `INTERESTS`. `docs/product/ui/ui-component-map.md` SHALL state that the EventCard category badge, public-detail category eyebrow, DETAILS type, and feed/admin category selects show taxonomy locale labels.

#### Scenario: Schema overview is not free-form

- **WHEN** an implementer reads the events table in `schema-overview.md`
- **THEN** category and event_type are documented as taxonomy keys with DE/EN labels in code
- **AND** the free-form / “consider enum later” wording is gone
- **AND** member `INTERESTS` is documented as a separate onboarding list

#### Scenario: Gaps log separates category from interests

- **WHEN** a reader opens `gaps-and-decisions.md`
- **THEN** a current-state row states that event category is not member onboarding interests

### Requirement: Demo seed stores allowlisted taxonomy keys

Demo catalog seed fixtures (`packages/db/src/catalog/fixtures/abundo-berlin-demo.json` and Abundo fetch `GENRE_TO_CATEGORY` / `CATEGORY_EVENT_TYPE`) SHALL emit parent-guide keys (`theater`, `cinema`, `theater_play`, …). Product seed JSON SHALL NOT store leftover `eventType: "Performance"` or INTERESTS category ids (`Theater`, `Ausstellung`, `Kino`, …). `seed.ts` and `seed-pagination-data.ts` SHALL keep using allowlisted keys. Member `INTERESTS` SHALL remain unchanged.

#### Scenario: Abundo fixture has no Performance type

- **WHEN** an implementer greps `eventType: "Performance"` under `packages/db/src/catalog`
- **THEN** there are no matches in product seed JSON or seed TypeScript that insert events

#### Scenario: Re-fetching Abundo writes keys

- **WHEN** `scripts/fetch-abundo-seed.ts` maps a genre to category and a default event type
- **THEN** the written `category` and `eventType` are allowlisted taxonomy keys
- **AND** `createEvent` would accept them without `INVALID_EVENT_CATEGORY` / `INVALID_EVENT_TYPE`
