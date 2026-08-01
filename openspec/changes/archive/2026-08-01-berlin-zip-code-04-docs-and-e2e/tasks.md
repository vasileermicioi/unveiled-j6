## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/berlin-zip-code-04-docs-and-e2e.md`, parent guide Release Criteria / Location Model, and this change’s proposal/design/specs
- [x] 1.2 Confirm steps 02–03 are merged/archived and runtime zip UX exists (admin/public, onboarding step 3, Vibes, Membership HQ intel)
- [x] 1.3 Skim current stale surfaces: Gherkin hangout/districts rows, `schema-overview.md` neighborhood/districts, `ui-component-map.md` EventCard neighborhood, onboarding e2e fixture selecting `Mitte`

## 2. Gherkin and product docs

- [x] 2.1 Update `docs/product/features/onboarding.feature`: rename step 3 to zip under Germany/Berlin; remove Bezirk multi-select / travel-radius requirements
- [x] 2.2 Update `docs/product/features/profile.feature` Vibes scenario for zip location (no districts / no travel radius)
- [x] 2.3 Update `docs/product/features/admin-users.feature` intel preferences to zip/location (+ country/city); null `max_distance` still OK (no active radius row)
- [x] 2.4 Add/extend `docs/product/features/admin-events.feature` scenarios for Berlin zip authoring under fixed Germany/Berlin (no neighborhood/Kiez)
- [x] 2.5 Add/extend `docs/product/features/event-discovery.feature` scenarios for zip on cards/detail (not neighborhood/Kiez)
- [x] 2.6 Update `docs/product/database/schema-overview.md`: `events.country` / `city` / `zip_code`; profile location trio; remove active `neighborhood` / `districts`
- [x] 2.7 Sync EventCard (and detail if needed) in `docs/product/ui/ui-component-map.md` to zip + MapPin
- [x] 2.8 Replace districtSubtitle / DISTRICTS narrative in `docs/product/extras/content-i18n-inventory.md` with Country/Land, City/Stadt, PLZ/Zip (+ Berlin hint if shipped)
- [x] 2.9 Record Location Model decisions in `docs/product/extras/gaps-and-decisions.md` (city key `berlin`, `DE`, PLZ ranges 10115–14199, Bezirk→PLZ backfill unknown→10115, registry extensibility)
- [x] 2.10 Update `docs/product/product/user-journeys.md` onboarding step wording from districts/radius to zip under Germany/Berlin

## 3. Playwright and coverage matrix

- [x] 3.1 Update `e2e/fixtures/onboarding.ts` `completeLocationStep` to fill a valid Berlin PLZ (e.g. `10115`) instead of Bezirk checkboxes
- [x] 3.2 Align `e2e/specs/onboarding.spec.ts` step 3 title/assertions with zip under Germany/Berlin (no Bezirk checkboxes; no travel radius)
- [x] 3.3 Align `e2e/specs/profile.spec.ts` Vibes assertions with zip location (no Bezirk checkboxes; no travel radius)
- [x] 3.4 Align `e2e/specs/admin-users.spec.ts` detail/intel assertions with zip preference row (not districts)
- [x] 3.5 Confirm admin-events create smoke fills Berlin PLZ; add/adjust scenario titles to match new Gherkin where needed
- [x] 3.6 Add or adjust event-discovery Playwright for zip-on-card and/or zip-on-detail (proximity selectors), or record named coverage-matrix deferral
- [x] 3.7 Update `docs/product/testing/coverage-matrix.md` rows for all touched scenarios (pass or explicit deferral with owner/phase)

## 4. Cleanup and parent close-out

- [x] 4.1 Grep for stale `neighborhood` / hangout districts / `DISTRICTS` / `getDistrictLabel` product claims; clear docs and delete unused constants/helpers when safe
- [x] 4.2 Mark step 04 done in `.dev-plan/current-iteration/berlin-zip-code-parent-guide.md` and walk parent **Release Criteria**
- [x] 4.3 Point `onboarding-travel-distance` parent/step plans at zip location under Germany/Berlin defaults (not districts)

## 5. Verification

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run relevant e2e (onboarding location, profile preferences, admin event create smoke) — pass, or document environment blockers / named skips with assertions committed
- [x] 5.3 Confirm no remaining Bezirk-neighborhood product requirements for events/onboarding/profile; prepare PR/handoff linking this change ID and the parent guide
