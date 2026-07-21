## Why

Hard rules still say “prefer HeroUI Select / no radios or checkboxes,” but Discover filters, onboarding/profile prefs, and booking quantity already use native controls for progressive enhancement. Step 01 flips policy and ships shared admin native theme classes so steps 02–03 can rewrite `AdminFormSelect` / `AdminFormNumberField` without fighting AGENTS §8/§14.

## What Changes

- Update `AGENTS.md` §14 to **native-first** for choice/number/date/file fields; disallow HeroUI `Select` / `NumberField` / Checkbox/Radio/Switch for new work except documented exceptions.
- Clarify `AGENTS.md` §8 allowlist: native `select`, `option`, `optgroup`, `input`, `textarea` as form controls (optionally wrapped in HeroUI `Label` / `Surface` / `Field` chrome).
- Rewrite `docs/product/ui/design-system.md` Form controls: native-first; keep HeroUI for text fields/buttons/layout; list exceptions (image Pica, geo/map, better-auth-ui).
- Align `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` hard rules and `docs/product/extras/gaps-and-decisions.md` if they still mandate Select-only.
- Add shared `@layer components` styles in `globals.css` for admin native select/number (e.g. `.admin-native-select`, `.admin-native-number`) reusing brand border tokens — layout-ready for steps 02–03.
- **No** form field `name` / POST contract changes; **no** `AdminFormSelect` / `AdminFormNumberField` rewrites; **no** e2e fixture changes (later steps).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `platform-foundation`: Replace Select-only / preference-only native exception with a global native-first form-control preference; remove the old “prefer HeroUI Select over radios and checkboxes” requirement.

## Impact

- **Policy docs:** `AGENTS.md` (§8, §14); `docs/product/ui/design-system.md` Form controls; `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` hard rules; `docs/product/extras/gaps-and-decisions.md` HeroUI-only exception row; optionally note multi-select approach in parent guide Risks if already clear.
- **Theme:** `apps/web/app/styles/globals.css` — new `.admin-native-select` / `.admin-native-number` (and focus states) patterned on `.event-feed-filters__select` / onboarding native controls; theme tokens only.
- **Unchanged this step:** Admin form component implementations, SSR field names, Playwright fixtures, auth UI, image upload/Pica, map/geo islands.
- **Source brief:** `.dev-plan/current-iteration/native-form-controls-01-policy-and-theme.md`
- **Parent:** `.dev-plan/current-iteration/native-form-controls-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `native-form-controls-02-admin-select`
- **Verification:** `bun run lint`, `bun run typecheck`; Theme Overview / existing admin page still loads (no runtime form change required)
