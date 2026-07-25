## Context

Parent feature: Onboarding preference options (`.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`). This is child step 01 — first increment; no prior child dependency.

Today location preferences use a 7-item informal `DISTRICTS` allowlist (`Mitte`, `X-Berg`, `P-Berg`, `Charlottenburg`, `Wedding`, `F-Hain`, `Schöneberg`) and require `max_distance` (1–25 km) for onboarding location completion and cultural-preferences validation. UI: native checkboxes + number input in `LocationStepForm` and `PreferencesForm`. Labels: DE shorthand vs EN expanded via `getDistrictLabel` in `onboarding-content.ts`. Admin user detail shows `profile.max_distance` as `N km`.

Constraints: SSR form POST only; HeroUI chrome + native checkboxes; business logic in `@unveiled/auth`; theme tokens; no feed ranking; no JSONB schema migration; Gherkin/e2e deferred to step 04.

## Goals / Non-Goals

**Goals:**

- Canonical `DISTRICTS` = 12 official Berlin Bezirke (order fixed in step brief).
- DE/EN labels = those proper names (identity map).
- Remove travel-radius capture from onboarding location + profile Vibes.
- Location step done when `profile.districts != null` only; saves clear `max_distance` to `null`.
- Unit tests and fixtures updated for new keys / no required radius.

**Non-Goals:**

- Accessibility / languages UX (step 02); interests Other (step 03).
- Product Gherkin, Playwright, i18n inventory, schema-overview polish (step 04).
- Batch migration of legacy district shorthand in existing profiles.
- Dropping `max_distance` from the TypeScript `UserProfile` type or DB column shape.
- Feed ranking or distance-based filtering.

## Decisions

1. **Stored keys = official Bezirk display names**
   - **Choice:** `DISTRICTS` values are exactly:
     `Mitte`, `Friedrichshain-Kreuzberg`, `Pankow`, `Charlottenburg-Wilmersdorf`, `Spandau`, `Steglitz-Zehlendorf`, `Tempelhof-Schöneberg`, `Neukölln`, `Treptow-Köpenick`, `Marzahn-Hellersdorf`, `Lichtenberg`, `Reinickendorf`.
   - **Rationale:** Parent guide + step brief; avoids separate id↔label maps for this field.
   - **Alternatives:** Slug keys (`friedrichshain-kreuzberg`) with localized labels — more indirection, no product need.

2. **Label maps become identity (DE = EN)**
   - **Choice:** `districtLabels.de` and `districtLabels.en` both map each Bezirk key to itself; keep `getDistrictLabel(locale, value)` API for consistency with other preference labels.
   - **Rationale:** Spec delta requires proper names in both locales; no informal shorthand.
   - **Alternatives:** Drop `getDistrictLabel` and render raw keys — breaks the shared onboarding/profile pattern.

3. **`LocationStepPayload` / cultural prefs omit required `max_distance`**
   - **Choice:** `LocationStepPayload` is `{ districts: string[] }` only. Location validation returns `{ districts, max_distance: null }`. Cultural preferences validation stops calling `assertMaxDistance`; always merge `max_distance: null` on preferences save (same as location). Parsers ignore or omit posted `max_distance`.
   - **Rationale:** Clears stale values; step completion no longer depends on radius; JSONB key may remain historically until overwrite.
   - **Alternatives:** Leave existing `max_distance` untouched when absent — leaves stale data visible in admin; rejected by brief (“prefer clearing”).

4. **`isLocationStepDone` = districts-only**
   - **Choice:** `profile.districts != null` (existing null-vs-array semantics unchanged). Keep `profile.max_distance != null` in `isAgeStepDone` “has any later preference” heuristic so legacy rows still skip age if they only stored distance historically; do not reintroduce radius into location completion.
   - **Rationale:** Matches brief; avoids regressing age-skip inference for odd legacy profiles.
   - **Alternatives:** Also remove `max_distance` from `isAgeStepDone` — slightly cleaner, slightly more churn; optional if tests force it.

5. **Remove radius UI; fix location step meta description**
   - **Choice:** Delete number input + `radiusLabel` usage from `LocationStepForm` and `PreferencesForm`. For `getOnboardingStepMeta("location")`, stop using `radiusLabel` as description — use a districts-only subtitle from existing copy if one fits, or a short new DE/EN string that does not mention travel distance (minimal copy addition OK; full i18n inventory sync in step 04).
   - **Rationale:** Avoids showing “how far would you travel” as the step description after the control is gone.
   - **Alternatives:** Empty description — weaker UX; leave `radiusLabel` as description — incorrect product copy.

6. **`MAX_DISTANCE_*` constants**
   - **Choice:** Remove exports/usages from location/preferences paths. If nothing else imports them after the change, delete `MAX_DISTANCE_MIN` / `MAX_DISTANCE_MAX` (and `assertMaxDistance`) from `@unveiled/auth`; otherwise leave unused until step 04 cleanup.
   - **Rationale:** Prefer delete-if-unused; avoid dead API surface.
   - **Alternatives:** Keep constants “for later” — noise; no product plan to restore radius in MVP.

7. **Admin max-distance display**
   - **Choice:** In `AdminUserDetailPage`, hide the max-distance row when `profile.max_distance == null`, or show an em-dash / “—”; one-liner only. No new admin edit field.
   - **Rationale:** Brief allows hide/null-friendly in 01; full intel polish in 04.
   - **Alternatives:** Always show “N km” / blank — confusing after clears.

8. **Legacy informal district keys**
   - **Choice:** No batch job. On next location/preferences save, `assertAllowlist` rejects unknown districts. Forms only offer Bezirke, so users re-select. Until save, old JSON may still contain shorthand (read paths that only display selected checkboxes simply show none selected).
   - **Rationale:** Parent non-goal; documented in proposal as **BREAKING** allowlist.
   - **Alternatives:** Soft-map `X-Berg` → `Friedrichshain-Kreuzberg` on read — ambiguous (X-Berg ≠ full Bezirk); out of scope.

## Risks / Trade-offs

- **[Risk] Existing members with only informal districts appear “empty” on location/Vibes until they re-select** → Mitigation: expected; checkboxes unchecked for unknown keys; they must pick Bezirke to save.
- **[Risk] Members stuck mid-onboarding with `districts` set but relying on old completion that also needed `max_distance`** → Mitigation: `isLocationStepDone` becomes districts-only, so they advance; if they had radius but null districts, they still need districts.
- **[Risk] Stale `max_distance` remains until next save** → Mitigation: clear on location + preferences save; admin null-friendly; ignore on read for gating.
- **[Risk] Admin event district filters / other `DISTRICTS` consumers break types** → Mitigation: grep `DISTRICTS` / old keys; update any admin select options and tests in the same PR.
- **[Trade-off] OpenSpec deltas vs product SoT** → Planning contract ships here; `docs/product/features/*.feature` updates intentionally deferred to step 04 (note in PR/handoff).
- **[Trade-off] Identity DE/EN labels** → Proper nouns need no translation; keeps i18n machinery uniform.

## Migration Plan

1. Update `DISTRICTS` (+ remove unused `MAX_DISTANCE_*` if applicable) in `@unveiled/auth`.
2. Adjust validation, payloads, `isLocationStepDone`, save merge to null `max_distance`.
3. Update label maps, forms, parsers, admin null-friendly display.
4. Fix unit tests/fixtures; run lint, typecheck, `bun test packages/auth`.
5. No DB migration. Rollback = revert PR (old keys become valid again; new Bezirk values already saved would then fail old allowlist — accept as forward-only allowlist change).

## Open Questions

- None blocking. Location step subtitle copy: invent minimal DE/EN districts-focused description if no existing key fits; step 04 syncs i18n inventory.
