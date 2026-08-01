## Why

Step 01 shipped per-event gallery manage links on the admin Events list and event edit page, but product Gherkin, UI map, image-uploads §8a, DEPLOYMENT demo script, coverage matrix, and Playwright still claim gallery manage is Featured-only (and assert Events has zero gallery links). Until SoT and e2e match the shipped entry points, agents and CI keep verifying the wrong admin contract and the parent feature cannot close.

## What Changes

- Rewrite the Featured-only gallery manage Gherkin scenario to Events list/edit (Featured remains optional convenience).
- Update `ui-component-map.md`, `image-uploads.md` §8a, `gaps-and-decisions.md`, and the DEPLOYMENT Featured Event Gallery demo script so they no longer say manage is Featured-exclusive.
- Update Playwright: assert gallery manage from Events (non-featured acceptable); rename/refocus the Featured-only test title and assertions; keep proximity/layout selectors and verbatim Gherkin titles.
- Refresh coverage-matrix rows to the updated scenario titles.
- Optionally leave public “Featured demo event includes gallery” as-is when the demo seed host remains featured.
- Out of scope: new gallery upload features; schema/pipeline changes; changing public discovery gallery behavior beyond wording if seed stays featured.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Product Gherkin, UI component map, image-uploads §8a, DEPLOYMENT demo script, and related docs SHALL state that gallery manage is available for any existing catalog event from the admin Events list and/or event edit page; Featured-list gallery entry, if present, is optional convenience — not exclusive.
- `bdd-and-e2e`: Rename/refocus **Featured Event Gallery** Playwright coverage to **Event Gallery** admin + public paths. Admin coverage SHALL include manage entry from Events (not Featured-only). Public guest gallery + slider coverage MAY continue to use a seeded event that happens to be featured. Coverage matrix rows SHALL use the updated scenario titles.

## Impact

- **Product SoT:** `docs/product/features/admin-events.feature`, `docs/product/ui/ui-component-map.md`, `docs/product/extras/image-uploads.md` §8a, `docs/product/extras/gaps-and-decisions.md`, `docs/product/testing/coverage-matrix.md`, `apps/web/DEPLOYMENT.md`.
- **E2E:** `e2e/specs/admin-events.spec.ts` — replace Featured-exclusive gallery-entry scenario with Events list/edit path; Gherkin titles stay in sync with Playwright `Scenario:` strings; proximity/layout selectors only.
- **Public discovery:** `event-discovery.feature` / public gallery e2e — leave seed-as-featured wording unless seed host changes (default: leave).
- **Parent close-out:** mark `event-gallery-admin-02` + parent guide done; walk Release Criteria.
- **Planning mirrors:** `openspec/specs/{admin-events,bdd-and-e2e}` via this change’s deltas (not product SoT).
- **Unchanged:** gallery routes, catalog APIs, schema, five-WebP pipeline, public detail gallery display rules, Featured convenience shortcut from step 01.
- **Source brief:** `.dev-plan/current-iteration/event-gallery-admin-02-docs-and-e2e.md`
- **Parent:** `.dev-plan/current-iteration/event-gallery-admin-parent-guide.md`
- **Depends on:** `event-gallery-admin-01-entry-points` (done)
- **Consumed by:** closes the event-gallery-admin parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; `bun run test:e2e -- e2e/specs/admin-events.spec.ts` (gallery manage scenario(s) pass or env-skip with documented reason)
