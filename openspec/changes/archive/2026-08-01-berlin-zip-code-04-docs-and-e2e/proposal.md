## Why

Steps 01–03 already ship the extensible `country` / `city` / `zip_code` location model (Germany/Berlin defaults, Berlin PLZ validation) on events, onboarding, profile Vibes, and Membership HQ — but canonical product docs, i18n inventory, schema overview, gaps/decisions, and Playwright still describe Bezirk neighborhoods / hangout districts. Until SoT and e2e match the shipped UX, agents and CI will keep verifying the wrong location contract.

## What Changes

- Update product Gherkin (`onboarding.feature`, `profile.feature`, `admin-users.feature`, and admin-events / event-discovery as needed) so location is zip under Germany/Berlin — no Bezirk multi-select, no event `neighborhood`.
- Sync `schema-overview.md`, `ui-component-map.md`, `content-i18n-inventory.md`, and `user-journeys.md` to the location trio + Berlin-first defaults.
- Record step-01 decisions in `gaps-and-decisions.md`: city key `berlin`, country `DE`, Berlin PLZ membership (inclusive ranges **10115–14199** under registry `(DE, berlin)`), Bezirk→representative-PLZ migration backfill (unknown → `10115`), and the extensibility contract for more cities later.
- Align Playwright scenario titles/assertions (onboarding location, profile Vibes, admin event create smoke, admin-users intel, public zip display where covered) with verbatim Gherkin; update coverage-matrix rows (pass or named skip).
- Remove or narrow obsolete `DISTRICTS` / neighborhood product claims; delete unused district constants/helpers when safe.
- Out of scope: travel distance / `max_distance` UI; feed geo-filtering; shipping additional cities or a city/country picker; new product behavior beyond docs/e2e/cleanup.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `member-onboarding`: Product docs, i18n inventory, coverage matrix, and Playwright MUST describe step 3 as zip under prefilled Germany/Berlin (not 12-Bezirk hangout multi-select); travel radius still not collected.
- `member-profile`: Product docs and Playwright MUST describe Vibes location as zip under Germany/Berlin; remove Bezirk hangout-label / districts-array requirements that contradict the shipped model.
- `admin-users`: Product Gherkin (and e2e titles/assertions) MUST describe Membership HQ preference intel as zip/location (+ country/city), not districts; `max_distance` null remains OK (no active radius row).
- `admin-events`: Product Gherkin + Playwright (or named coverage-matrix deferral) MUST cover Berlin zip authoring under fixed Germany/Berlin (no neighborhood/Kiez).
- `event-discovery`: Product Gherkin/UI docs + Playwright (or named deferral) MUST cover zip on cards/detail instead of neighborhood/Kiez.
- `event-catalog`: Schema overview (and any remaining catalog docs) MUST document `events.country` / `city` / `zip_code` and MUST NOT list `events.neighborhood` as a current field.

## Impact

- **Product SoT:** `docs/product/features/{onboarding,profile,admin-users,admin-events,event-discovery}.feature`, `docs/product/database/schema-overview.md`, `docs/product/ui/ui-component-map.md`, `docs/product/extras/{content-i18n-inventory,gaps-and-decisions}.md`, `docs/product/product/user-journeys.md`, `docs/product/testing/coverage-matrix.md`.
- **E2E:** `e2e/specs/{onboarding,profile,admin-users,admin-events,event-discovery}.spec.ts` (+ fixtures/labels as needed); proximity/layout selectors only.
- **Code cleanup:** unused `DISTRICTS` / `getDistrictLabel` / district-only test helpers when no longer referenced.
- **Parent close-out:** mark `berlin-zip-code-04` + parent guide done; point `onboarding-travel-distance-*` at zip location under Germany/Berlin defaults.
- **Planning mirrors:** `openspec/specs/{member-onboarding,member-profile,admin-users,admin-events,event-discovery,event-catalog}` via this change’s deltas (not product SoT).
- **Unchanged:** domain validation/registry from 01; UI surfaces from 02–03 except dead-code cleanup; travel-distance feature; additional city allowlists.
- **Source brief:** `.dev-plan/current-iteration/berlin-zip-code-04-docs-and-e2e.md`
- **Parent:** `.dev-plan/current-iteration/berlin-zip-code-parent-guide.md`
- **Depends on:** `berlin-zip-code-02-admin-and-public-ui`, `berlin-zip-code-03-onboarding-and-profile-ui` (both done)
- **Consumed by:** closes the Berlin zip-code parent feature; unblocks `onboarding-travel-distance-parent-guide`
- **Verification:** `bun run lint`; `bun run typecheck`; relevant e2e (onboarding location, profile preferences, admin event create smoke) pass or documented skips
