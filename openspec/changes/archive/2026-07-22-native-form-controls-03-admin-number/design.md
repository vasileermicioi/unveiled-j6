## Context

Parent feature: Native Form Controls (`.dev-plan/current-iteration/native-form-controls-parent-guide.md`). Steps 01–02 are done: AGENTS §8/§14 are native-first; `.admin-native-select` / `.admin-native-number` live in `globals.css`; `AdminFormSelect` is native `<select>`.

`AdminFormNumberField` is still a client HeroUI `NumberField` with decrement/increment buttons. Only call site today:

| Surface | Fields | Defaults / bounds |
|---|---|---|
| `EventAdminBaseFields` | `credit_price`, `total_capacity` | credit default `1`, min `1`; capacity default `10`, min `1` |

Parsers in `admin-event-form.ts`: `parseInteger(body.credit_price, 1)`, `parseInteger(body.total_capacity, 10)`. No `step` prop today; integers only in practice.

Related but out of primary scope: `AdminCompTicketForm` / `AdminAdjustCreditsForm` / `AdminRefundForm` use `TextField` + `Input inputMode="numeric" type="text"` — not NumberField. Profile `max_distance` is already native number. E2E still drives HeroUI NumberField steppers (`e2e/fixtures/admin.ts`, `admin-events.spec.ts`) — step 04.

Constraints: SSR-only mutations; no booking-domain credit/capacity semantics changes; theme via existing `.admin-native-number`; HeroUI remains for Label/Surface chrome; no Playwright rewrite unless hard-blocked.

## Goals / Non-Goals

**Goals:**

- Native `AdminFormNumberField` with `.admin-native-number`, accessible label association, and unchanged field `name`s / min/max/defaultValue behavior for credit price and capacity.
- Match parser defaults (capacity 10, credit ≥ 1) at the control level.
- Add Ladle stories for the primitive; mark step 03 done in the parent guide.
- Add `event-catalog` requirement for admin numeric fields (native `input type="number"`).

**Non-Goals:**

- Playwright NumberField / select fixture rewrite (step 04).
- Changing `parseInteger`, capacity recalculation, or credit ledger rules.
- Profile `max_distance` (already native).
- Forced rewrite of every admin `inputMode="numeric"` TextField (optional only if low-risk).
- New theme tokens beyond wiring the existing class.

## Decisions

1. **Native uncontrolled `<input type="number">`**
   - **Choice:** Replace HeroUI `NumberField` / Group / ± buttons with `<input type="number" className="admin-native-number" name={…} id={…} min={…} max={…} step={1} defaultValue={…} required={…} />`. Map props: `minValue` → `min`, `maxValue` → `max`, `isRequired` → `required`, `defaultValue` → string/number accepted by the input.
   - **Rationale:** Progressive enhancement without hydration; browser min/max/step validation; matches Discover/onboarding native number pattern and step 01 theme class.
   - **Alternatives:** Keep NumberField with themed chrome (rejected by policy); `type="text" inputMode="numeric"` (weaker native validation).

2. **Prop API compatibility (no call-site renames)**
   - **Choice:** Keep `minValue` / `maxValue` / `isRequired` / `defaultValue` / `name` / `label`. Do not require `EventAdminBaseFields` prop renames. Optionally accept an explicit `step` prop defaulting to `1` for future reuse.
   - **Rationale:** Step brief — same SSR names and bounds; thin internal mapping only.
   - **Alternatives:** Rename to HTML `min`/`max` at the public API (cosmetic churn).

3. **Drop `"use client"` unless a callback is added**
   - **Choice:** Make `AdminFormNumberField` a server-friendly component (no `"use client"`) — no `onChange` / steppers today. Keep HeroUI `Label` + `Surface` wrappers like `AdminFormSelect` chrome.
   - **Rationale:** Native uncontrolled input needs no client JS; reduces island surface vs current NumberField.
   - **Alternatives:** Keep `"use client"` for API symmetry with Select (unnecessary without callbacks).

4. **Label / id wiring**
   - **Choice:** Stable `id` derived from `name` (e.g. `admin-number-${name}`); `Label htmlFor={id}`; wrap in `Surface variant="transparent"` flex column.
   - **Rationale:** Matches `AdminFormSelect` pattern; AGENTS §8 allowlist + design-system Label around native controls.
   - **Alternatives:** Rely on Label wrapping the input without `htmlFor` (weaker association).

5. **Optional numeric-ish cleanup: defer by default**
   - **Choice:** Do **not** migrate `AdminCompTicketForm` / adjust-credits / refund `TextField`+`inputMode` in this PR unless a one-line swap to `AdminFormNumberField` is clearly equivalent (same `name`, integer ≥ 1, no free-text semantics). Prefer leave them for a later cleanup or step 04 polish.
   - **Rationale:** Step brief marks this optional/low-risk only; those fields use `type="text"` today and may accept different empty/invalid handling.
   - **Alternatives:** Force all admin quantities onto `AdminFormNumberField` now (broader blast radius).

6. **Stories**
   - **Choice:** Add `AdminFormNumberField.stories.tsx` (none exists today) with at least default + min/max + required variants mirroring Select stories style.
   - **Rationale:** Step deliverable; Ladle covers the primitive before e2e rewrite.
   - **Alternatives:** Skip stories until step 04 (leaves a gap vs Select).

7. **Spec delta shape**
   - **Choice:** **ADDED** `Admin event numeric fields` under `event-catalog` (no existing requirement with that header). Do not MODIFY select-control text.
   - **Rationale:** OpenSpec MODIFIED needs an exact existing header; the step brief’s requirement is new. Platform-foundation already forbids NumberField generally; this delta makes the event admin surfaces explicit.
   - **Alternatives:** Stretch MODIFIED onto “Admin event form select controls” (wrong concern).

8. **E2E debt stays in step 04**
   - **Choice:** Note that capacity/credit e2e helpers that click NumberField increment buttons will break when run; do not rewrite fixtures here unless a required local run hard-fails — then add a minimal `getByLabel` + `fill` helper and leave full cleanup to 04.
   - **Rationale:** Parent guide + step 02 precedent; keeps this PR focused on the primitive.
   - **Alternatives:** Bundle fixture rewrite now (duplicates step 04 scope).

## Risks / Trade-offs

- **[Browser spinner UI varies]** Native number inputs show OS/browser steppers → Mitigation: theme via `.admin-native-number`; admin MVP accepts native chrome; no custom ± buttons.
- **[E2E still targets HeroUI NumberField]** Specs that click increment until 15 will fail → Mitigation: step 04 owns rewrite; if a local run hard-fails, minimal fill-by-label only.
- **[Empty / non-integer submit]** Native `required` + `min` help, but parsers still apply fallbacks → Mitigation: keep existing `parseInteger` behavior; do not change server validation in this step.
- **[Removing `"use client"`]** If a future parent needs controlled value, reintroduce client wrapper → Mitigation: current call sites are uncontrolled defaults only.

## Migration Plan

1. Rewrite `AdminFormNumberField` + add stories; apply spec delta; mark parent guide step 03 done when verified.
2. Smoke `/en/admin/events/new` (and edit) credit price + capacity submit.
3. Run `bun run lint` and `bun run typecheck`.
4. Rollback: revert PR; HeroUI NumberField returns (no DB/env migration).

## Open Questions

- None blocking. Optional comp-ticket alignment only if implementer confirms identical POST/`name`/integer semantics in under ~15 minutes; otherwise leave for later.
