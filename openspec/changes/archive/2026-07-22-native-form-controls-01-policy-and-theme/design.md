## Context

Parent feature: Native Form Controls (`.dev-plan/current-iteration/native-form-controls-parent-guide.md`). Member surfaces already use native controls (Discover `.event-feed-filters__select`, onboarding/profile preference checkbox/radio cards, booking `TicketCountSelect`). Admin still wraps HeroUI `Select` / `NumberField` via `AdminFormSelect` / `AdminFormNumberField`.

Agent hard rules still contradict shipped reality: `AGENTS.md` §14 and MVP plan hard rule 4 say “no radios/checkboxes — prefer Select”; §8 forbids raw HTML without an allowlist for form controls. `design-system.md` Form controls + `gaps-and-decisions.md` only document a narrow preference/booking exception. `openspec/specs/platform-foundation` still has “Native controls exception for preference forms.”

This step is docs + theme scaffolding only — no admin component rewrites yet (steps 02–03).

Constraints: theme-only visual styling; no per-route color classes; do not change form field `name`s or POST contracts; HeroUI remains for text fields, buttons, and layout chrome.

## Goals / Non-Goals

**Goals:**

- Flip policy docs (`AGENTS.md` §8/§14, design-system Form controls, MVP plan, gaps log) to native-first for choice/number/date/file.
- Supersede the preference-only exception with a global native-first requirement in platform-foundation.
- Ship reusable `.admin-native-select` / `.admin-native-number` component styles in `globals.css` for steps 02–03.

**Non-Goals:**

- Rewriting `AdminFormSelect` / `AdminFormNumberField` (steps 02–03).
- E2E fixture migration (step 04).
- Auth UI, image Pica upload, or map/geo picker changes.
- Changing SSR field names or POST payloads.
- Broad `ui-component-map.md` / feature-file rewrites beyond what contradicts the new hard rule (prefer minimal alignment; full product polish in step 04 if needed).

## Decisions

1. **Policy wording (native-first, not “exception”)**
   - **Choice:** Replace §14 with: prefer native HTML controls when HTML provides them (`select`, `input` types `checkbox|radio|number|date|time|file`, `textarea`); do **not** use HeroUI `Select` / `NumberField` / Checkbox/Radio/Switch for those fields except listed exceptions. Keep HeroUI for `TextField` / `TextArea` / `Button` / `Label` / layout.
   - **Rationale:** Matches already-shipped member UX and unblocks admin rewrites; “exception” framing kept agents inventing Select-first admin forms.
   - **Alternatives:** Keep Select-first with more exceptions (continues contradiction); ban all HeroUI form primitives (overkill — text/buttons stay HeroUI).

2. **AGENTS §8 allowlist**
   - **Choice:** Explicitly allowlist native `select`, `option`, `optgroup`, `input`, `textarea` when used as form controls, optionally wrapped in HeroUI `Label` / `Surface` / `Field` chrome. Keep existing exceptions for JSON-LD `<script>` and `<img>`.
   - **Rationale:** Parent guide risk — without this, §8 blocks implementers even after §14 flips.
   - **Alternatives:** Wrap every native control in a HeroUI primitive that still renders the same tag (unnecessary indirection).

3. **Documented exceptions (keep non-native)**
   - **Choice:** Image upload / Pica processing UI; `EventGeoPicker` / map islands; `@better-auth-ui/*` auth chrome. Everything else with a native equivalent goes native.
   - **Rationale:** Parent inventory; no native equivalent for Pica/map; auth is third-party.
   - **Alternatives:** Force native file input without Pica (loses resize pipeline).

4. **CSS class names and reuse**
   - **Choice:** Add `.admin-native-select` and `.admin-native-number` under `@layer components` in `globals.css`, mirroring `.event-feed-filters__select` (border via `--border` / `--border-width`, `--field-background`, custom chevron via `appearance: none` + background gradients, flat/no shadow, focus without ad-hoc colors). Number field shares border/background/typography; omit chevron. Do **not** rename Discover/onboarding classes in this step — admin classes are the consumption API for 02–03; shared tokens already unify look.
   - **Rationale:** Step brief names these classes; Discover classes stay stable for existing markup.
   - **Alternatives:** One shared `.native-select` used everywhere (nice later; larger touch surface); style `select` globally (risks breaking auth/third-party).

5. **Spec delta shape vs existing openspec requirement**
   - **Choice:** **ADDED** `Form control preference` (global native-first) and **REMOVED** `Native controls exception for preference forms` (superseded). AGENTS/MVP “prefer Select” lives in docs, not as an openspec requirement header — remove it in those files during implementation.
   - **Rationale:** OpenSpec MODIFIED requires an exact existing header; the preference exception is what actually exists under `platform-foundation`.
   - **Alternatives:** MODIFIED a non-existent “Form control preference” header (breaks archive merge).

6. **Multi-select note**
   - **Choice:** Leave parent guide Risks as-is unless a clear decision already exists; step 02 decides `<select multiple>` vs checkbox group.
   - **Rationale:** Step brief — “note if already clear, else leave for 02.”
   - **Alternatives:** Lock checkbox groups now (premature without UX review).

7. **Gaps / MVP plan alignment**
   - **Choice:** Update MVP hard rules 1/4 (and any prompt lines that say “no Radio/Checkbox — use Select”) to native-first + §8 allowlist. Update gaps row for HeroUI-only markup so the exception is the allowlisted native form controls + the three keep-non-native cases, not only prefs/booking.
   - **Rationale:** Step deliverables; prevents agents from reading stale Select-only guidance.

## Risks / Trade-offs

- **[Stale secondary docs]** `ui-component-map.md` / onboarding copy may still say Prefer Select → Mitigation: fix contradictions that would block agents; defer full inventory polish to step 04 if out of scope.
- **[Theme unused until 02]** New CSS classes have no consumers yet → Mitigation: acceptable; verify admin page still loads; 02 wires classes into `AdminFormSelect`.
- **[§8 vs HeroUI purity]** Broader native allowlist could invite raw `<button>`/`<a>` misuse → Mitigation: allowlist is form-control tags only; keep §8 ban on structural/chrome HTML.
- **[Multi-select UX]** Deferred to 02 → Mitigation: documented in parent Risks.

## Migration Plan

1. Land docs + CSS together (single PR).
2. No DB/auth/deploy env changes; no runtime form behavior change.
3. Rollback: revert the PR; admin HeroUI selects keep working until 02.

## Open Questions

- None blocking step 01. Multi-select UX remains for step 02.
