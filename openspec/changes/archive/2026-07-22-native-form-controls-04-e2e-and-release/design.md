## Context

Parent feature: Native Form Controls (`.dev-plan/current-iteration/native-form-controls-parent-guide.md`). Steps 01–03 are done:

- AGENTS §8/§14 + design-system Form controls are native-first; `.admin-native-select` / `.admin-native-number` live in `globals.css`.
- `AdminFormSelect` is native `<select>` / `<select multiple>` with `Label htmlFor` → `id` (`admin-select-${name}`).
- `AdminFormNumberField` is native `<input type="number">` with `Label htmlFor` → `id` (`admin-number-${name}`).

E2E debt still assumes HeroUI:

| Helper / call site | Current assumption | Native reality |
|---|---|---|
| `e2e/fixtures/admin.ts` `selectOptionByLabel` | `getByRole("combobox")` → click → ListBox option | Labeled `<select>`; no listbox |
| `createEventViaUI` credit fill | `getByRole("textbox")` + fill | `input[type="number"]` → prefer `getByLabel` / spinbutton-or-textbox role |
| `createEventViaUI` capacity + `admin-events` capacity scenario | click ± increment buttons | fill labeled number input |
| `e2e/fixtures/waitlist.ts` `bumpEventCapacityViaAdmin` | same ± buttons | same fill path |
| Specs importing `selectOptionByLabel` | Partner / category / event / ticket / slot / comp-ticket Event* | keep helper name; rewrite body |

Call sites that import the helper: `admin-events.spec.ts`, `admin-users.spec.ts`, `credits-subscription.spec.ts`, plus internal `createEventViaUI`. Multi-select fields (`languages`, `ageGroups`, `weekdays`) also go through `selectOptionByLabel`.

Constraints: proximity/layout selectors only (`docs/product/testing/bdd-and-e2e.md`); no auth-ui / image Pica / partner portal scope; no visual redesign beyond existing theme classes; keep public helper names stable where possible so specs need minimal churn.

## Goals / Non-Goals

**Goals:**

- Native-first Playwright helpers for admin selects and number fields.
- Admin / waitlist / credits specs green (or documented env skip) against native controls.
- Grep-clean: no HeroUI `Select` / `NumberField` left in admin form primitives.
- Docs + parent guide mark the feature releasable; exceptions stay documented.
- Spec delta: admin form automation targets native controls.

**Non-Goals:**

- New admin product features or gallery work.
- Rewriting `@better-auth-ui/*`, image Pica islands, or EventGeoPicker.
- Changing SSR field names, parsers, or booking-domain capacity semantics.
- Full suite green in environments missing R2/admin credentials — document skips instead of inventing mocks.
- Forced rename of every `EventAdminDatePicker` / `EventAdminTimeField` if the rename is not cheap (touch-light only).

## Decisions

1. **Rewrite `selectOptionByLabel` in place (keep export name)**
   - **Choice:** Keep `selectOptionByLabel(page, label, optionName)` signature. Implementation: resolve the control with `page.getByLabel(label)` (fall back to `getByRole("combobox")` only if needed during transition — prefer drop combobox path entirely once native-only). For single `<select>`, call `selectOption` by option label (string) or resolve matching `<option>` text for `RegExp` then `selectOption({ value })`. For `<select multiple>`, select the matching option without clearing unrelated selections when the helper is used to add one value (match current single-option call pattern: languages/ageGroups pick one value).
   - **Rationale:** Specs already call this helper everywhere; renaming would churn every import for no product gain. Native `getByLabel` matches Label/`htmlFor` wiring from step 02 and BDD proximity rules.
   - **Alternatives:** New `selectNativeOptionByLabel` + mass rename (noise); keep combobox path with fallback (hides failures).

2. **Number fields: labeled fill helper, kill ± steppers**
   - **Choice:** Add or inline `fillNumberByLabel(page, label, value)` using `page.getByLabel(label)` → `fill(String(value))` (clear first if needed). Use it in `createEventViaUI` for credits/capacity and in `bumpEventCapacityViaAdmin` / capacity update scenario. Remove reliance on `/erhöhen|increment/` buttons.
   - **Rationale:** Native `type="number"` has no HeroUI steppers; Discover/booking already use fill patterns. Chromium may expose number inputs as `spinbutton` or textbox — `getByLabel` is role-agnostic and matches `admin-number-*` ids.
   - **Alternatives:** Keep clicking phantom increment buttons (fails); role-only `getByRole("spinbutton")` (fragile across browsers).

3. **Multi-select: one option via native API**
   - **Choice:** When the labeled control has `multiple`, use Playwright `selectOption` with the target label/value. Do not open a listbox. If tests need “only this option,” pass a single-element selection (current call sites pick one language/age group).
   - **Rationale:** Step 02 shipped `<select multiple>`; helpers must not assume ListBox. Keeps fixture surface small.
   - **Alternatives:** Checkbox-group e2e (rejected — UI is multi select); full clear-then-select always (may over-clear defaults unexpectedly — only if a failing test requires it).

4. **Option matching: label text first, then value**
   - **Choice:** Prefer selecting by visible option label (what specs pass: `"Theater"`, partner name, `/geteilt|shared/i`). For RegExp, find `option` whose text matches, then select by that option’s `value` attribute (ids like partner UUID / enum keys).
   - **Rationale:** Admin options use human labels in UI but `value={option.id}`; Partner selection in the step brief scenario must work by Partner label association + option text.
   - **Alternatives:** Force all tests to pass option ids (breaks readable BDD-style helpers).

5. **Grep-clean + optional DateInput rename**
   - **Choice:** After fixtures work, `rg` admin components for `@heroui/react` `Select` / `NumberField` / ListBox leftovers and remove dead imports. Optionally rename `EventAdminDatePicker` → `EventAdminDateInput` and `EventAdminTimeField` → `EventAdminTimeInput` only if the rename is mechanical (file + imports) with no behavior change; skip if it expands the PR.
   - **Rationale:** Step brief marks rename optional/cheap; release criteria care about native select/number + docs, not identifier cosmetics.
   - **Alternatives:** Always rename (risk of merge noise); never grep-clean (leaves false debt).

6. **Docs / release marking**
   - **Choice:** Update parent guide Child Changes step 04 → done, clear e2e debt notes, tick Release Criteria. Confirm `design-system.md` Form controls + AGENTS §8/§14 + `gaps-and-decisions.md` still match shipped behavior; touch `DEPLOYMENT.md` only if e2e/form guidance actually changed. Reaffirm exceptions: image Pica, geo/map, `@better-auth-ui/*`, HeroUI text/button chrome.
   - **Rationale:** Closes the feature per parent guide; avoids drive-by DEPLOYMENT edits.
   - **Alternatives:** Large docs rewrite (out of scope).

7. **Spec delta shape: ADDED under `platform-foundation`**
   - **Choice:** **ADDED** requirement `Admin form automation uses native controls` (step brief labeled MODIFIED, but no existing requirement has that header — OpenSpec MODIFIED needs an exact match). Keep under `platform-foundation` next to Form control preference / E2E selector policy. Scenario: Admin event Partner selection uses native select associated with Partner label, not ListBox.
   - **Rationale:** Matches step 03 pattern (ADDED when header is new); capability still “modified” at proposal level.
   - **Alternatives:** Stretch-MODIFY “E2E selector policy” or “Form control preference” (blurs concerns); put under `bdd-and-e2e` (step brief says platform-foundation).

8. **Verification when env missing**
   - **Choice:** Always run lint + typecheck. Run targeted admin Playwright specs when `E2E_ADMIN_*` / R2 / `DATABASE_URL` allow; otherwise document skip reason in PR/handoff (do not weaken production code to green CI).
   - **Rationale:** Step brief verification §3; parent guide already allows env-gated e2e.
   - **Alternatives:** Require full e2e green in every sandbox (blocks merge unfairly).

## Risks / Trade-offs

- **[RegExp option labels vs option values]** Partner/event titles may need fuzzy option text match → Mitigation: resolve `<option>` by text regex then `selectOption({ value })`.
- **[Multi-select clears other values]** Naive `selectOption` may replace selection → Mitigation: mirror current single-pick call sites; only force exclusive selection if a test fails.
- **[Number input role variance]** `getByRole("textbox")` may miss `type="number"` → Mitigation: standardize on `getByLabel`.
- **[Env-gated e2e]** Local/CI without admin/R2 cannot prove Partner select → Mitigation: document skip; keep lint/typecheck + `rg` as always-on gates.
- **[Optional rename churn]** Date/Time rename touches series + base fields → Mitigation: skip if not mechanical in one commit.

## Migration Plan

1. Rewrite admin select + number helpers; fix waitlist capacity bump and capacity scenario.
2. Run/fix affected admin specs; grep-clean admin primitives; optional rename.
3. Docs + parent guide releasable; add `platform-foundation` ADDED requirement.
4. `bun run lint` / `typecheck`; targeted e2e or documented skip.
5. Rollback: revert PR — app UI already native from 02–03; only tests/docs regress.

## Open Questions

- None blocking. Optional DateInput/TimeInput rename left to implementer judgment (cheap = do it; otherwise skip).
