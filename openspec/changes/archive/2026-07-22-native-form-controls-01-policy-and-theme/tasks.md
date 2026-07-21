## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/native-form-controls-01-policy-and-theme.md` (all 5 proposal sections) and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm prerequisites exist: `AGENTS.md` §8/§14, `docs/product/ui/design-system.md` Form controls, MVP plan Select hard rule, gaps HeroUI-only exception row, native CSS precedents (`.event-feed-filters__select`, onboarding native controls)
- [x] 1.3 Skim parent guide (`.dev-plan/current-iteration/native-form-controls-parent-guide.md`) for release criteria, inventory, and Risks (multi-select deferred to 02)

## 2. Policy docs

- [x] 2.1 Update `AGENTS.md` §14 to native-first choice/number/date/file; disallow HeroUI `Select` / `NumberField` / Checkbox/Radio/Switch except documented exceptions
- [x] 2.2 Update `AGENTS.md` §8 exception list to allowlist native `select`, `option`, `optgroup`, `input`, `textarea` as form controls (optionally wrapped in HeroUI Label/Surface/Field)
- [x] 2.3 Rewrite `docs/product/ui/design-system.md` Form controls: native-first; HeroUI for text/buttons/layout; exceptions (image Pica, geo/map, better-auth-ui)
- [x] 2.4 Align `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` hard rules (and any Select-only prompt lines) with native-first + §8 allowlist
- [x] 2.5 Update `docs/product/extras/gaps-and-decisions.md` HeroUI-only markup row so the native form-control allowlist (and keep-non-native exceptions) replace the prefs/booking-only exception
- [x] 2.6 Fix any immediate agent-blocking contradictions (e.g. design-system siblings that still mandate Select-only for all forms); leave broader inventory polish for step 04 if out of scope
- [x] 2.7 Leave parent guide multi-select Risk for step 02 unless a decision is already clear — then note it briefly

## 3. Admin native control theme

- [x] 3.1 Add `@layer components` styles for `.admin-native-select` in `apps/web/app/styles/globals.css` (reuse brand border / field background / chevron pattern from `.event-feed-filters__select`; theme tokens only)
- [x] 3.2 Add `.admin-native-number` styles (same border/background/typography; no chevron) ready for step 03 consumption
- [x] 3.3 Do not change form field `name`s, POST contracts, or `AdminFormSelect` / `AdminFormNumberField` implementations in this step

## 4. Validation and handoff

- [x] 4.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 4.2 Manual: Theme Overview and/or an existing admin page still loads (no runtime form change required)
- [x] 4.3 Confirm product/agent docs no longer contradict the new hard rule for form controls
- [x] 4.4 Mark step done in `.dev-plan/current-iteration/native-form-controls-parent-guide.md`; note handoff to `native-form-controls-02-admin-select`
