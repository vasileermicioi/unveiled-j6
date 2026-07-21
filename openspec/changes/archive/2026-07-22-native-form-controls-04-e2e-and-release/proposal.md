## Why

Steps 01–03 shipped native `AdminFormSelect` / `AdminFormNumberField`, but Playwright admin fixtures still open HeroUI Select combobox/listbox popovers and click NumberField ± steppers. Those helpers break against the native controls and block the parent feature’s release criteria. This final slice aligns e2e + docs and marks Native Form Controls releasable.

## What Changes

- Rewrite `e2e/fixtures/admin.ts` `selectOptionByLabel` (and any dead Select-popover helpers) to use native `<select>` via Playwright `selectOption` / label association.
- Rewrite capacity/credit number helpers that click HeroUI increment/decrement buttons to `getByLabel` + `fill` (or equivalent) on native `input[type="number"]`.
- Fix admin Playwright specs and waitlist helpers that break (`admin-events.spec.ts`, `admin-users.spec.ts`, `credits-subscription.spec.ts`, `e2e/fixtures/waitlist.ts`, etc.).
- Grep-clean leftover HeroUI `Select` / `NumberField` usage in admin form primitives (`apps/web/app/components/admin`).
- Final docs pass: `docs/product/ui/design-system.md`, `AGENTS.md`, `gaps-and-decisions.md`, and `DEPLOYMENT.md` only if form guidance changed; confirm exception list (image Pica, geo/map, `@better-auth-ui/*`).
- Optionally rename misleading `EventAdminDatePicker` / `EventAdminTimeField` identifiers to DateInput/TimeInput if cheap — no behavior change.
- Mark steps 01–04 done and the feature releasable in `.dev-plan/current-iteration/native-form-controls-parent-guide.md`.
- **Out of scope:** new admin features, gallery, partner portal, auth-ui / image Pica rewrites, visual redesign beyond theme classes from step 01.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `platform-foundation`: Add admin form automation requirement — e2e for admin choice/numeric fields SHALL target native HTML controls (Playwright `selectOption` / labeled number inputs), not HeroUI Select listbox popovers or NumberField steppers, once native form controls have shipped.

## Impact

- **Code:** `e2e/fixtures/admin.ts`, `e2e/fixtures/waitlist.ts`, admin-related specs (`admin-events`, `admin-users`, `credits-subscription`, waitlist capacity bump path); optional rename in `EventAdminDateFields.tsx` + call sites.
- **Docs:** parent guide release marking; design-system / AGENTS / gaps consistency; `DEPLOYMENT.md` only if needed.
- **No product UI behavior change** beyond optional identifier rename — primitives already native from 02–03.
- **Source brief:** `.dev-plan/current-iteration/native-form-controls-04-e2e-and-release.md`
- **Parent:** `.dev-plan/current-iteration/native-form-controls-parent-guide.md`
- **Depends on:** `native-form-controls-03-admin-number` (done)
- **Consumed by:** closes the Native Form Controls feature
- **Verification:** `bun run lint`, `bun run typecheck`; targeted admin Playwright specs when env allows (or document skip); `rg` confirms no HeroUI Select left in admin form primitives
