## ADDED Requirements

### Requirement: BDD and Playwright proximity contract

The product spec SHALL include `docs/product/testing/bdd-and-e2e.md` requiring Playwright tests to use Gherkin `Scenario:` titles verbatim and proximity/layout selectors only, forbidding `data-testid` and CSS-class-based / `#id` test selectors except narrowly documented native-input exceptions. The doc SHALL state: Gherkin under `docs/product/features/` is the behavioral source of truth; one `e2e/specs/<feature-basename>.spec.ts` per MVP feature basename; `test("Scenario: …")` matches the `Scenario:` line verbatim; allowed locators are `getByRole`, `getByLabel`, `getByText`, `filter`, parent walks, and `nth`; production markup SHALL NOT gain test-only attributes; file-input exceptions MUST be commented `// BDD exception: file-input` and prefer role/label first; phase “done when” SHALL NOT pass with `@skip-no-ui` left on MVP-required scenarios without an explicit plan deferral; Ladle design-system stories and Theme Overview policy SHALL point at `packages/ui` / `ui/design-system.md`.

#### Scenario: Implementer checks selector rules before writing e2e

- **WHEN** an agent adds or changes an E2E test for an MVP feature
- **THEN** they follow `docs/product/testing/bdd-and-e2e.md` and can justify any `page.locator` usage against the documented exception list

#### Scenario: BDD contract file exists

- **WHEN** an agent lists `docs/product/testing/` after this change
- **THEN** `bdd-and-e2e.md` exists and states verbatim Scenario title matching and proximity-only selector rules

#### Scenario: Coverage gate is documented

- **WHEN** an agent reads the coverage-gate section of `bdd-and-e2e.md`
- **THEN** MVP-required scenarios left on `@skip-no-ui` without an explicit plan deferral are forbidden for phase “done when”
