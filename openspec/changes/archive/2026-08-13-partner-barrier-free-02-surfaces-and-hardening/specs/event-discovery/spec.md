## ADDED Requirements

### Requirement: Public event detail shows partner barrier-free

Public event detail DETAILS SHALL show an Accessibility / Barrierefreiheit row whose value comes from the hosting partner's `barrier_free` (`true` → Barrier-free / Barrierefrei; `NULL` → Not specified / Keine Angabe). Guests and members see the same ungated row (like partner hours). The page SHALL NOT read `events.barrier_free`. The unused display branch for stored `false` MAY remain for defensive reads. `docs/product/features/event-discovery.feature` SHALL include scenarios titled `Event detail shows partner barrier-free` and `Event detail when partner barrier-free is unset`. Playwright SHALL use those titles verbatim. The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL note that Accessibility is partner-sourced.

#### Scenario: Event detail shows partner barrier-free

- **WHEN** I open a public event whose partner has barrier_free true
- **THEN** DETAILS shows Barrier-free / Barrierefrei

#### Scenario: Event detail when partner barrier-free is unset

- **WHEN** I open a public event whose partner has barrier_free null
- **THEN** DETAILS shows Not specified / Keine Angabe

#### Scenario: Accessibility row is ungated

- **WHEN** a guest or a booking-eligible member opens the same event
- **THEN** both see the Accessibility / Barrierefreiheit row with the partner value
