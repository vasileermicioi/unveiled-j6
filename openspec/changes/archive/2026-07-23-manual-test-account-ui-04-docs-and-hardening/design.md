## Context

Parent feature: Manual-test account UI (`.dev-plan/current-iteration/manual-test-account-ui-parent-guide.md`). Steps `01`–`03` are done:

- `/profile` is membership manage home (Stripe portal CTA; inactive → `/membership`); tab label Membership / Mitgliedschaft; portal `return_url` → `/:locale/profile`
- Profile tabs render above `PageSectionHeader` with shared inner `max-w-2xl` column
- `AdminPageShell` uses shared `PageSectionHeader` (eyebrow Admin/Verwaltung) with subtitle below the rule

Gaps vs releasable:

- `docs/product/features/profile.feature` still has “View credit wallet” / “Refill credits” and wallet-tab IA comments
- Sitemap `/profile` row still says “credit wallet tab”
- Coverage matrix still maps those wallet scenarios (status `pass`) while e2e already uses membership-home titles
- `ui-component-map.md` Profile row omits tabs-above-header / shared column / membership home card; admin `PageSectionHeader` usage not explicit on Admin shell row
- `static-pages-content.md` account header notes lag tab order / admin shell
- Parent guide step `04` still pending

Constraints: product SoT is `docs/product/` (not merge into `openspec/specs/` as canonical truth); proximity selectors only; no new product UI beyond aligning docs/tests; reuse billing fixtures for portal.

## Goals / Non-Goals

**Goals:**

- Align `docs/product/` profile/sitemap/UI/coverage (and i18n inventory if needed) with shipped membership home + chrome.
- Align Playwright scenario titles and assertions with new Gherkin; assert tablist-before-heading and membership CTAs.
- Mark parent feature releasable (all steps done; note deferrals).

**Non-Goals:**

- New Stripe products, credit ledger, billing-tab redesign, partner portal.
- Deep Stripe Customer Portal browser automation (redirect / fixture coverage is enough).
- Changing runtime UI from steps `01`–`03`.

## Decisions

1. **Gherkin scenario rename (verbatim for Playwright)**
   - **Choice:** Replace wallet scenarios with titles that already match e2e where possible:
     - `Scenario: View membership home` — membership panel + manage-subscription CTA when portal-eligible
     - `Scenario: Inactive member starts membership from profile home` — checkout CTA → `/membership`
     - Optional third: `Scenario: Manage subscription from profile home` only if we add a dedicated e2e that asserts portal redirect (reuse billing portal fixture pattern); otherwise fold manage CTA presence into View membership home and keep deep portal under billing scenarios
   - Update feature-file header comments: tabs include Membership (not wallet); tabs above `PageSectionHeader`; identity on `/profile/details`
   - **Rationale:** e2e already uses the first two titles; matrix must match; BDD contract requires verbatim Scenario titles.
   - **Alternatives:** Keep old titles and only change Then steps (rejected — agents reintroduce “credit wallet” language).

2. **Coverage matrix sync**
   - **Choice:** Delete or replace “View credit wallet” / “Refill credits” rows with membership-home scenario rows pointing at `e2e/specs/profile.spec.ts` with matching `Scenario:` titles; status `pass` when `DATABASE_URL` available, else document skip reason consistent with other profile rows.
   - **Rationale:** Matrix is the agent/QA index; stale `pass` on removed scenarios is worse than a short rename.
   - **Alternatives:** Leave wallet rows as `deferred` (confusing — behavior intentionally removed).

3. **E2E hardening bar**
   - **Choice:**
     - Keep / tighten membership home assertions (heading + portal button or inactive link).
     - Add one assertion that account `tablist` appears before the account level-1 heading (DOM order / bounding-box Y, proximity — not CSS-class fishing).
     - Do **not** require full hosted Portal automation; portal redirect may remain covered by billing “Update billing information” or a light POST redirect check if already patterned.
     - Optional admin: assert partners (or overview) shows Admin/Verwaltung eyebrow text near page title — only if non-flaky with existing admin fixtures; otherwise rely on Ladle story + docs.
   - **Rationale:** Step brief; closes IA without Stripe flakiness.
   - **Alternatives:** Full Portal e2e (out of scope / already staging-only elsewhere).

4. **Docs sync surface**
   - **Choice:**
     - Sitemap: `/profile` → Account home (membership manage; Stripe portal CTA)
     - UI component map: Profile row — Membership home card, tabs above `PageSectionHeader`, shared column width; Admin / PageSectionHeader rows — `AdminPageShell` uses shared header
     - `static-pages-content.md`: account + admin header conventions (tabs above title; Admin/Verwaltung eyebrow)
     - `content-i18n-inventory.md`: only if Membership / Manage subscription / Admin eyebrow strings are missing
   - **Rationale:** Deferred sync from steps `01`–`03` notes in parent guide.
   - **Alternatives:** Docs-only without e2e/matrix (fails release criteria).

5. **Parent guide closeout**
   - **Choice:** Mark step `04` done; confirm `01`–`03` remain done; list intentional deferrals (e.g. deep Portal e2e, optional admin Playwright if skipped). No further child steps.
   - **Rationale:** Hard cap of 4 steps; feature ends here.

## Risks / Trade-offs

- **[Risk] Scenario title mismatch leaves orphaned e2e tests** → Mitigation: rename feature + matrix + `test("Scenario: …")` in one PR; grep for “credit wallet” / “Refill credits” in docs/product + e2e.
- **[Risk] Tab-order assertion is flaky across locales** → Mitigation: use named tablist + heading roles already used in profile.spec; compare positions only after both visible.
- **[Risk] Agents treat openspec delta as product SoT** → Mitigation: update `docs/product/` in this change; proposal states product SoT remains `docs/product/`.

## Migration Plan

1. Update product docs + feature file + matrix.
2. Align e2e titles/assertions.
3. Lint / typecheck / profile Playwright (or document skip).
4. Mark parent guide done.
5. Rollback: revert docs/e2e only — no schema or billing migration.

## Open Questions

- None blocking — portal return URL and column width already decided in steps `01`/`02`. Optional admin Playwright vs story-only: prefer story/docs if admin e2e env is heavy.
