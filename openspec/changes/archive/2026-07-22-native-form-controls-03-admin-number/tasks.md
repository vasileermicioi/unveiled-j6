## 1. Setup

- [x] 1.1 Confirm steps 01–02 are done (`.admin-native-number` in `globals.css`, `AdminFormSelect` native) and inventory `AdminFormNumberField` props + call sites (`EventAdminBaseFields` credit_price / total_capacity) against `admin-event-form.ts` parse defaults
- [x] 1.2 Skim parent guide non-goals (no image/auth/geo; e2e NumberField helpers are step 04 debt)

## 2. Native AdminFormNumberField

- [x] 2.1 Rewrite `AdminFormNumberField.tsx` to native `<input type="number" className="admin-native-number">` with `name`, `min`/`max` (from `minValue`/`maxValue`), `step` (default 1), `defaultValue`, `required`, HeroUI `Label` `htmlFor`/`id`, and `Surface` chrome; drop HeroUI `NumberField` / ± steppers / `"use client"` if unused
- [x] 2.2 Verify `EventAdminBaseFields` credit price (default 1, min 1) and total capacity (default 10, min 1) still match parsers; no field-name or booking-domain changes
- [x] 2.3 Optionally align a single low-risk numeric-ish admin field (e.g. comp-ticket count) with `AdminFormNumberField` only if POST/`name`/integer semantics are clearly equivalent; otherwise skip

## 3. Stories & docs

- [x] 3.1 Add `AdminFormNumberField.stories.tsx` (default + min/max + required) reflecting the native control
- [x] 3.2 Mark step 03 done in `.dev-plan/current-iteration/native-form-controls-parent-guide.md` Child Changes / inventory when implementation verifies; note e2e NumberField helper debt for step 04

## 4. Validation

- [x] 4.1 Manual smoke: create/edit event — credit price and capacity are native number inputs with labels; submit still posts `credit_price` / `total_capacity`
- [x] 4.2 Run `bun run lint` — exits 0
- [x] 4.3 Run `bun run typecheck` — exits 0
