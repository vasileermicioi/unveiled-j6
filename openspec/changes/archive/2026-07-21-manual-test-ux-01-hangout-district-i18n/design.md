## Context

Onboarding step 3 (`/:locale/onboarding/location`) and profile preferences render hangout district chips via `getDistrictLabel(locale, value)` from `apps/web/app/lib/onboarding-content.ts`. Stored values stay the allowlist keys in `@unveiled/auth/constants` (`Mitte`, `X-Berg`, `P-Berg`, `F-Hain`, …). Unit tests already assert DE Berlin shorthand (`X-Berg`, `P-Berg`, `F-Hain`) and EN expanded names (`Kreuzberg`, …), but both locale maps currently use the expanded German forms, so `/en` and `/de` look identical. Manual evidence: `.dev-plan/manual-test-register-hangout-translation.png`. Product note in `content-i18n-inventory.md` currently says DE/EN both “expand districts.” Source brief: `.dev-plan/current-iteration/manual-test-ux-01-hangout-district-i18n.md`.

## Goals / Non-Goals

**Goals:**

- Switching DE ↔ EN visibly changes hangout option labels on onboarding location and profile preferences.
- DE UI shows Berlin shorthand for `X-Berg`, `P-Berg`, and `F-Hain`; other DE districts keep today’s proper names.
- EN UI keeps expanded labels (`Kreuzberg`, `Prenzlauer Berg`, `Friedrichshain`, and existing proper names).
- Unit tests pass with DE shorthand + EN expanded assertions; every allowlist district still has a non-empty label.
- i18n inventory district guidance matches the differentiated contract.

**Non-Goals:**

- Changing stored allowlist keys or inventing English place names for Mitte/Wedding/Charlottenburg/Schöneberg.
- Accessibility section structure (step 02); membership card / profile header / account tabs (steps 03–05).
- New client islands or mutation UX; HeroUI markup changes beyond label text.
- Broader i18n refactor out of `onboarding-content.ts`.

## Decisions

1. **Fix the DE map only (EN already correct)**
   - **Choice:** Set `districtLabels.de["X-Berg"|"P-Berg"|"F-Hain"]` to the shorthand keys themselves; leave `districtLabels.en` as today’s expanded forms; leave other DE entries unchanged.
   - **Rationale:** Matches existing unit tests and parent-guide release criteria; minimal diff; EN map already matches “expanded English-facing names.”
   - **Alternatives:** Expand DE and invent EN-only names for all districts (rejected — contradicts tests and non-goals); display raw keys in both locales (rejected — loses EN expanded UX).

2. **Single shared map via `getDistrictLabel`**
   - **Choice:** Keep both `LocationStepForm` and `PreferencesForm` calling `getDistrictLabel`; do not duplicate maps or hardcode labels in components.
   - **Rationale:** Already wired; one fix updates onboarding + profile.
   - **Alternatives:** Per-form label tables (rejected — drift risk).

3. **Docs: correct inventory wording**
   - **Choice:** Update `content-i18n-inventory.md` so DE shorthand vs EN expanded is explicit for the three abbreviated districts; other districts remain locale-identical proper nouns.
   - **Rationale:** Current “DE/EN UI labels expand districts” text is the misleading SoT that allowed the bug to ship.
   - **Alternatives:** Defer docs to a later step (rejected — step deliverable includes inventory).

4. **No e2e change required for this slice**
   - **Choice:** Rely on `onboarding-content.test.ts` + manual DE/EN spot-check; add Playwright only if an existing test asserts expanded DE labels (spot-check during apply).
   - **Rationale:** Bug is pure map data; unit tests already encode the contract.
   - **Alternatives:** New Playwright locale-switch scenario (nice-to-have; out of minimal scope unless CI already fails).

## Risks / Trade-offs

- **[Risk] E2E or copy elsewhere expects expanded DE labels** → Mitigation: grep/playwright spot-check during apply; fix only if assertions fail.
- **[Risk] Product copy elsewhere still says both locales expand** → Mitigation: update inventory; Gherkin allowlist keys stay shorthand keys (already correct).
- **[Trade-off] Mitte/Wedding/etc. stay identical across locales** → Acceptable per non-goals; differentiation is only where Berlin shorthand exists.
- **[Trade-off] openspec/specs are historical** → Deltas still written here; product SoT update is `docs/product/extras/content-i18n-inventory.md` (+ feature file only if a scenario claims identical expansion).

## Migration Plan

1. Edit `districtLabels.de` shorthand entries in `onboarding-content.ts`.
2. Confirm/adjust `onboarding-content.test.ts` (likely already correct).
3. Spot-check form consumers still use `getDistrictLabel`.
4. Update `content-i18n-inventory.md`.
5. Run lint, typecheck, and the unit test file; manual `/de` vs `/en` onboarding location.
6. Mark step 01 done in parent guide on merge. No DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. Parent risk on DE vs EN labels is resolved by restoring the test contract.
