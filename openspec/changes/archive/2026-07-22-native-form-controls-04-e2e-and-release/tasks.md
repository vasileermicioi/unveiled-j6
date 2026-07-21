## 1. Setup

- [x] 1.1 Confirm steps 01–03 are done (`AdminFormSelect` / `AdminFormNumberField` native; parent guide marks 01–03 done) and skim release criteria + exception list
- [x] 1.2 Inventory HeroUI Select/NumberField e2e helpers: `selectOptionByLabel`, capacity ± clicks in `e2e/fixtures/admin.ts` and `e2e/fixtures/waitlist.ts`, plus capacity scenario in `admin-events.spec.ts`

## 2. Native e2e helpers

- [x] 2.1 Rewrite `selectOptionByLabel` in `e2e/fixtures/admin.ts` for native `<select>` / `<select multiple>` via `getByLabel` + `selectOption` (RegExp → option text → value); drop combobox/listbox popover path
- [x] 2.2 Add/use labeled number fill for credits/capacity (`getByLabel` + `fill`); remove HeroUI increment/decrement button loops from `createEventViaUI` and related helpers
- [x] 2.3 Update `bumpEventCapacityViaAdmin` in `e2e/fixtures/waitlist.ts` and the “Update an event's capacity” scenario to use the native number fill path

## 3. Specs, cleanup, docs

- [x] 3.1 Fix any admin Playwright specs that still assume ListBox/NumberField steppers (`admin-events`, `admin-users`, `credits-subscription`, waitlist as needed) while keeping proximity selectors
- [x] 3.2 Grep-clean leftover HeroUI `Select` / `NumberField` / ListBox usage in `apps/web/app/components/admin` form primitives; optionally rename `EventAdminDatePicker` / `EventAdminTimeField` → DateInput/TimeInput if mechanical
- [x] 3.3 Final docs pass (`design-system.md`, `AGENTS.md`, `gaps-and-decisions.md`; `DEPLOYMENT.md` only if form/e2e guidance changed); confirm exceptions (image Pica, geo/map, better-auth-ui) remain documented
- [x] 3.4 Mark steps 01–04 done and feature releasable in `.dev-plan/current-iteration/native-form-controls-parent-guide.md` (clear e2e debt notes)

## 4. Validation

- [x] 4.1 Run `bun run lint` — exits 0
- [x] 4.2 Run `bun run typecheck` — exits 0
- [x] 4.3 Run targeted admin Playwright specs that touch Partner/select/capacity (when env allows) — exit 0; otherwise document skip reason
- [x] 4.4 Confirm `rg "AdminFormSelect|@heroui/react.*Select" apps/web/app/components/admin` shows no HeroUI Select usage left in admin form primitives
