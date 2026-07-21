## ADDED Requirements

### Requirement: Native controls exception for preference forms
For onboarding, profile preferences, and booking/waitlist quantity fields, the product MAY use native checkboxes, radios, selects, and number inputs instead of HeroUI Select-only / no-checkbox guidance when custom controls fail visibility or hydration. Theme styling for those native controls SHALL still come from shared CSS tokens in `globals.css`. Product UI documentation SHALL state this exception explicitly.

#### Scenario: Documented exception
- **WHEN** an implementer reads product UI docs after this change
- **THEN** the native-control exception for preference and booking quantity forms is stated explicitly
- **AND** the docs still require theme-token styling (not ad-hoc per-route colors) for those controls
