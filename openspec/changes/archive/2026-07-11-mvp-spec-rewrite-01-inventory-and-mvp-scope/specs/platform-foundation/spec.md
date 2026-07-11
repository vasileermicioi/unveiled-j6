## ADDED Requirements

### Requirement: MVP product-spec charter
The project SHALL maintain a MVP product-spec charter at `docs/product/CHARTER.md` that locks personas (guest, member, admin; partner post-MVP), public event detail indexing intent, Discover→Events navigation intent, `@unveiled/ui` design-system ownership including a Theme Overview Ladle story, and Gherkin↔Playwright proximity-selector BDD rules before rewriting the full product doc tree. The charter SHALL be treated as binding for subsequent MVP product-spec rewrite steps. A stub `docs/product/README.md` SHALL state that `docs/product/` is work in progress and not yet the agent source of truth until the rewrite’s pointer step completes.

#### Scenario: Charter exists before product tree rewrite
- **WHEN** an agent starts rewriting sitemap, features, or the implementation plan for the MVP
- **THEN** they read `docs/product/CHARTER.md` and treat its Locked decisions as binding

#### Scenario: Product folder stub is present
- **WHEN** an operator lists `docs/product/` after this change
- **THEN** both `CHARTER.md` and `README.md` exist and the README states the folder is not yet source of truth

#### Scenario: Partner is explicitly post-MVP in the charter
- **WHEN** an agent reads Locked decisions or the post-MVP parking lot in `docs/product/CHARTER.md`
- **THEN** partner portal / partner login / check-in are marked post-MVP and MVP personas are limited to guest, member (`USER`), and admin (`ADMIN`)
