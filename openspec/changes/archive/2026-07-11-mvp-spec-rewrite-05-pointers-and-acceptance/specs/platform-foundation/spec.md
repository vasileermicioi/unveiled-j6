## ADDED Requirements

### Requirement: Canonical product specification location

For new Unveiled Berlin MVP work, the canonical product specification SHALL be `docs/product/`, and the active phased delivery plan SHALL be `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`. `docs/migration/` and `.dev-plan/IMPLEMENTATION-PLAN.md` remain in-repo as historical references only.

#### Scenario: Agent entry via AGENTS.md

- **WHEN** an agent reads `AGENTS.md` source-of-truth guidance
- **THEN** it is directed to `docs/product/` and `IMPLEMENTATION-PLAN.mvp.md` for MVP behavior and delivery sequencing

#### Scenario: Migration and old plan are marked superseded

- **WHEN** an agent opens `docs/migration/README.md` or `.dev-plan/IMPLEMENTATION-PLAN.md`
- **THEN** a top-of-file banner states they are superseded for new MVP work and points to `docs/product/` or `IMPLEMENTATION-PLAN.mvp.md` respectively

#### Scenario: Acceptance checklist exists

- **WHEN** an operator lists `docs/product/` after this change
- **THEN** `ACCEPTANCE.md` exists with release criteria, verification commands, and a sign-off section for the MVP product-spec rewrite

## MODIFIED Requirements

### Requirement: MVP product-spec charter

The project SHALL maintain a MVP product-spec charter at `docs/product/CHARTER.md` that locks personas (guest, member, admin; partner post-MVP), public event detail indexing intent, Discover→Events navigation intent, `@unveiled/ui` design-system ownership including a Theme Overview Ladle story, and Gherkin↔Playwright proximity-selector BDD rules. The charter SHALL be treated as binding for MVP product work. `docs/product/README.md` SHALL state that `docs/product/` is the **active** agent source of truth for MVP product behavior, with delivery sequenced by `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`.

#### Scenario: Charter exists before product tree rewrite

- **WHEN** an agent starts rewriting sitemap, features, or the implementation plan for the MVP
- **THEN** they read `docs/product/CHARTER.md` and treat its Locked decisions as binding

#### Scenario: Product folder is active source of truth

- **WHEN** an operator lists `docs/product/` after this change
- **THEN** both `CHARTER.md` and `README.md` exist and the README states the folder is the active source of truth for MVP product behavior

#### Scenario: Partner is explicitly post-MVP in the charter

- **WHEN** an agent reads Locked decisions or the post-MVP parking lot in `docs/product/CHARTER.md`
- **THEN** partner portal / partner login / check-in are marked post-MVP and MVP personas are limited to guest, member (`USER`), and admin (`ADMIN`)
