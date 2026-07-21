## Context

Manual QA after the guest → subscribe → book path found two preference-form gaps (parent: `.dev-plan/current-iteration/manual-test-ux-parent-guide.md` step 03; brief: `.dev-plan/current-iteration/manual-test-ux-03-native-forms-and-preference-i18n.md`):

1. **Invisible / weak controls** — Onboarding (`AgeStepForm`, `InterestsStepForm`, `LocationStepForm`, `TimingStepForm`) and profile `PreferencesForm` use HeroUI `CheckboxGroup` / `RadioGroup` / `Switch` / `NumberField`. Accessibility is a `Switch`, not a checkbox. Custom chrome is easy to miss (`.dev-plan/manual-test-register-preferences.png`).
2. **Locale gaps** — Option labels live in `apps/web/app/lib/onboarding-content.ts`. Most maps exist, but `getAgeGroupLabel` ignores locale; DE district labels stay abbreviated (`X-Berg`, `P-Berg`, `F-Hain`) while EN expands; i18n inventory still claims options are untranslated.

Booking/waitlist quantity uses `TicketCountSelect` (HeroUI `Select` + hidden input). Discover already uses native `<select className="event-feed-filters__select">` in `EventFeedFilters.tsx` — the precedent for theme-styled native controls.

AGENTS.md §14 (“No radios or checkboxes — prefer HeroUI Select”) and the HeroUI-only markup rule are **explicitly waived** for this step on preference/booking quantity surfaces. Stored allowlist values in `@unveiled/auth/constants` stay English/canonical keys; only display labels change. Mutations remain SSR form POST.

## Goals / Non-Goals

**Goals:**

- Native `checkbox` / `radio` / `input` / `select` for onboarding + profile preference fields, with visible labels and keyboard/screen-reader names.
- Accessibility preference as a **native checkbox** (not Switch).
- Travel radius as native `input type="number"` (min/max from constants), not NumberField steppers.
- Book + waitlist ticket quantity as native `<select name="ticketsCount">` (no hidden-input + HeroUI Select).
- Every user-visible preference option label available in DE and EN via locale maps; DE districts expand like EN.
- Theme styling for native controls under `.onboarding-form` (and a shared native-select class or reuse feed-filter styles) in `globals.css`.
- Document the native-control exception in product UI docs; refresh `content-i18n-inventory.md`.
- Update onboarding e2e fixtures if React Aria Space/label hacks break.

**Non-Goals:**

- Changing stored preference allowlist values or profile JSON shape.
- Membership benefits layout / page headers (step 04).
- Map popup close control (step 05).
- Auth form width (step 02 — done).
- Guest event detail credit/date gating (step 01 — done).
- Event-detail ± ticket stepper (`EventDetailCheckoutCard`) unless a trivial follow-on; not an SSR preference form.
- Replacing HeroUI Select elsewhere (admin, etc.).
- Client-only mutation modals.

## Decisions

1. **Native controls inside HeroUI form chrome**
   - **Choice:** Keep HeroUI `Form`, `Label`, `Surface`, and action buttons. Replace Checkbox/Radio/Switch/NumberField/Select **inputs** with native elements (`<input type="checkbox|radio|number">`, `<select>`). Wrap option rows in HeroUI `Label`/`Surface` for layout. Same `name` attributes (`age_group`, `interests`, `moods`, `districts`, `max_distance`, `timing`, `preferred_days`, `preferred_languages`, `accessibility`, `ticketsCount`).
   - **Rationale:** Matches Discover precedent; preserves SSR POST; maximizes visibility without forking libraries.
   - **Alternatives:** Keep HeroUI Checkbox and only restyle (still failed visibility in QA); HeroUI Select-only for multi values (rejected by brief — multi-select checkboxes required).

2. **Shared markup pattern for option groups**
   - **Choice:** One small pattern (inline or tiny helper in onboarding components) for “labeled native checkbox/radio in a grid/stack” reusing `onboarding-form__options*` classes. Profile reuses the same pattern via `PreferencesForm`.
   - **Rationale:** Four step forms + profile must stay consistent; avoid four divergent DOM shapes.
   - **Alternatives:** Copy-paste raw markup only (drift); extract a heavy shared package component (overkill for this step).

3. **Accessibility = native checkbox**
   - **Choice:** `<input type="checkbox" name="accessibility" value="true">` with visible localized label from `accessibilityLabel`. Unchecked → omit / false as today’s POST parsing expects.
   - **Rationale:** Screenshot callout; Switch chrome was the worst offender.
   - **Alternatives:** Keep Switch with louder CSS (rejected by brief).

4. **Travel radius = native number input**
   - **Choice:** `<input type="number" name="max_distance" min={MAX_DISTANCE_MIN} max={MAX_DISTANCE_MAX} …>` styled under `.onboarding-form__number-field` (repurpose/remove ± button chrome).
   - **Rationale:** Brief requires native number or select; number matches existing validation range.
   - **Alternatives:** Native select of km steps (more clicks); keep NumberField (rejected).

5. **Ticket count = native select SSR field**
   - **Choice:** Replace `TicketCountSelect` island guts with a native `<select>` (may become a server-friendly component or keep island only if maxQty is client-driven — prefer SSR-renderable select when `maxQty` is known at render). Drop hidden `Input` + HeroUI Select.
   - **Rationale:** Aligns with Discover; removes hydration-sensitive Select.
   - **Alternatives:** Native number input (worse UX for small bounded 1..N); leave HeroUI Select (rejected).

6. **i18n: fix gaps in `onboarding-content.ts` only**
   - **Choice:** Keep display maps in `onboarding-content.ts`. Fix `getAgeGroupLabel` to take locale (numeric ranges may stay identical DE/EN but must go through a map). Expand DE district labels to full names matching EN expansions (`Kreuzberg`, `Prenzlauer Berg`, `Friedrichshain`). Do not change `@unveiled/auth` stored keys.
   - **Rationale:** Stored values already power validation; only UI strings were wrong/weak.
   - **Alternatives:** Move all strings into `copy.ts` (wrong module — shell only); translate stored values (breaks allowlists).

7. **Document AGENTS §14 exception**
   - **Choice:** Add a short explicit exception in `docs/product/ui/design-system.md` (and/or gaps log) for onboarding, profile preferences, and booking/waitlist quantity: native checkbox/radio/select/number allowed; theme via `globals.css`.
   - **Rationale:** Parent risk; prevent the next agent from “fixing” back to HeroUI Select-only.
   - **Alternatives:** Only openspec delta (insufficient — product SoT is `docs/product/`).

8. **E2E**
   - **Choice:** Prefer `getByLabel` / `getByRole('checkbox'|'radio')` against localized visible names. Simplify `e2e/fixtures/onboarding.ts` away from React Aria Space hacks where native controls make label association straightforward. Update inventory doc stale “hardcoded same both locales” note.
   - **Rationale:** Native controls improve a11y names; fixtures currently encode custom chrome quirks.
   - **Alternatives:** Leave fixtures unchanged until they fail (likely mid-apply).

## Risks / Trade-offs

- **[Risk] AGENTS HeroUI-only markup conflict** → Mitigation: document exception in product UI docs + this design; limit raw tags to form controls (same as Discover filters).
- **[Risk] POST parsing expects CheckboxGroup array shape / Switch `"true"`** → Mitigation: keep identical `name`/`value` conventions; verify route handlers and profile merge still accept unchecked multi groups and accessibility.
- **[Risk] E2E fixture label strings (Theater, Light/Leicht, …)** → Mitigation: update fixture in the same change; run onboarding specs if credentials available.
- **[Risk] Native checkbox default UA styling fights yellow theme** → Mitigation: theme under `.onboarding-form` (accent, size, focus ring) mirroring existing selected invert intent without invisible custom Control.
- **[Trade-off] openspec/specs are not product SoT** → Still write deltas here; update `docs/product/` (design-system + i18n inventory + onboarding.feature if it mandates Select).
- **[Trade-off] Event-detail ± stepper left alone** → Book/waitlist SSR path is the contract; detail qty can stay until step 05 if needed.

## Migration Plan

1. Inventory + confirm POST field contracts for onboarding routes and preferences.
2. Swap controls in step forms + PreferencesForm; restyle `.onboarding-form` native hooks.
3. Replace TicketCountSelect with native select; smoke book + waitlist.
4. Fix onboarding-content locale gaps; update i18n inventory + design-system exception note.
5. Fix e2e fixture/selectors; `bun run lint` && `bun run typecheck`; manual DE/EN onboarding pass.
6. Mark step 03 done in parent guide on merge. Rollback = revert PR. No DB/env migration.

## Open Questions

- None blocking. If DE product copy prefers keeping district abbreviations, expand only when the screenshot/translations ref shows full names as the expected DE UI — default here is expand DE to match EN clarity.
