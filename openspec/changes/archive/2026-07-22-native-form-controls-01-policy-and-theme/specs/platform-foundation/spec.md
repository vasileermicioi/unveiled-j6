## ADDED Requirements

### Requirement: Form control preference
App forms SHALL use native HTML controls (`select`, `input` of type `checkbox|radio|number|date|time|file`, `textarea`) for choice, numeric, date, and file fields when a native control exists. HeroUI `Select`, `NumberField`, `Checkbox`, `Radio`, and `Switch` SHALL NOT be used for those fields except where listed as exceptions (admin image processing UI, map/geo pickers, third-party auth UI). HeroUI MAY still wrap labels, layout, text fields, and buttons. Theme styling for native controls SHALL come from shared CSS tokens in `globals.css`. Agent-facing docs (`AGENTS.md` hard rules and `docs/product/ui/design-system.md` Form controls) SHALL state this native-first preference and SHALL NOT mandate HeroUI Select-only guidance for those fields.

#### Scenario: Policy documents native-first forms
- **WHEN** an agent or implementer reads AGENTS hard rules and the design-system Form controls section
- **THEN** native controls are preferred for choice/number/date/file fields and HeroUI Select-only guidance no longer applies

#### Scenario: Documented exceptions remain
- **WHEN** an implementer reads the Form controls policy after this change
- **THEN** admin image processing UI, map/geo pickers, and third-party auth UI are listed as allowed non-native exceptions
- **AND** theme-token styling (not ad-hoc per-route colors) is still required for native controls

## REMOVED Requirements

### Requirement: Native controls exception for preference forms
**Reason:** Replaced by the global native-first Form control preference; member prefs/booking already use native controls and admin selects/numbers will follow in later steps of this feature.
**Migration:** Use native `<select>` / checkbox / radio / `input type="number|date|time|file"` for choice/number/date/file fields; keep documented exceptions for image Pica, geo/map, and better-auth-ui; theme via shared `globals.css` classes (including admin `.admin-native-select` / `.admin-native-number` for upcoming admin rewrites).
