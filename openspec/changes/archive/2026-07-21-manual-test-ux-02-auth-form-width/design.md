## Context

Auth pages render SSR chrome via `AuthPageLayout` (eyebrow + `PageSectionHeader` with full-width bottom border rule + description) and hydrate `@better-auth-ui/heroui` forms inside islands (`AuthSignUp`, `AuthSignIn`, `AuthForgotPassword`, `AuthResetPassword`). While the island is unmounted, `AuthFormFallback` shows a HeroUI `Card` with `.auth-form` / skeleton bars. Manual QA (`.dev-plan/manual-test-register-page.png`) shows the hydrated white form card narrower than the header rule measure, and the brief reports a visible shrink after load — skeleton/header wider than the hydrated card. Parent feature: `.dev-plan/current-iteration/manual-test-ux-parent-guide.md` step 02. Product brief: `.dev-plan/current-iteration/manual-test-ux-02-auth-form-width.md`.

Current layout already wraps header + children in `max-w-lg`, and `.auth-form` sets `width: 100%; max-width: none`. The mismatch therefore likely comes from (a) better-auth-ui / Card internal width constraints not covered by `.auth-form`, (b) skeleton vs hydrated root elements differing, or (c) header column stretching wider than the card subtree. This step owns finding and unifying that measure without forking the auth library.

## Goals / Non-Goals

**Goals:**

- One shared content width for auth header rule, SSR skeleton, and hydrated form card on all `AuthPageLayout` pages.
- No visible width jump between `AuthFormFallback` and hydrated `SignUp` / `SignIn` / forgot / reset forms.
- Fix via layout classes + theme CSS targeting `.auth-form` (and related card hooks) — keep `@better-auth-ui/heroui` as the auth UI surface.
- Consistent across signup, login, and other routes using `AuthPageLayout`.

**Non-Goals:**

- Forking or vendoring `@better-auth-ui/*`.
- Native form control swap or preference i18n (step 03).
- Membership benefits list or page-header alignment on marketing pages (step 04).
- Guest event detail gating (step 01 — done).
- Auth backend, Neon Auth proxy, session/role logic, or onboarding domain changes.
- Pixel-perfect recreation of mockup shadows (flat bordered surfaces remain).

## Decisions

1. **Single auth content measure owned by layout + theme**
   - **Choice:** Introduce one explicit shared width for the auth column (keep or rename the existing `max-w-lg` wrapper in `AuthPageLayout`, optionally as a dedicated class e.g. `auth-page__column` in `globals.css`). Header, description, skeleton, and form all live inside that column; form/card CSS forces `width: 100%` and clears conflicting `max-width` on the hydrated root and any nested card that currently shrinks.
   - **Rationale:** One measure prevents header rule vs card drift; theme owns visual width overrides (AGENTS.md §9).
   - **Alternatives:** Widen only the card (leaves header/skeleton inconsistent); shrink the header to match a narrow library default (rejects the screenshot intent of matching the header rule); per-route Tailwind max-width (duplicates, fights theme).

2. **Investigate hydrated DOM before guessing the override target**
   - **Choice:** On `/en/signup`, compare computed widths of (1) `PageSectionHeader` border box, (2) `AuthFormFallback` card, (3) hydrated better-auth-ui root / `.card` after mount. Apply CSS to the element that actually constrains width (may be a child of `.auth-form`, not the classed root).
   - **Rationale:** `.auth-form { max-width: none }` already exists — residual shrink means another node wins.
   - **Alternatives:** Blindly bump parent to `max-w-xl` without measuring (may not fix hydrate jump); wrap form in an extra max-width div that fights the library.

3. **Skeleton and hydrated form share the same outer box model**
   - **Choice:** Keep `AuthFormFallback` as a `Card` with `auth-form auth-form--loading` and ensure hydrated components also root on a full-width card/surface under `.auth-form`. Match horizontal padding/border so the outer border box does not change on mount.
   - **Rationale:** Jump is as much border-box as max-width; same class hooks keep SSR and CSR aligned.
   - **Alternatives:** CSS-only skeleton without Card (larger visual delta); client-only auth with no skeleton (worse CLS, rejected).

4. **Do not fork better-auth-ui**
   - **Choice:** Pass `className="auth-form"` (already done) and override width via theme selectors on known BEM/card hooks. If the library needs a layout prop that already exists (e.g. `variant` / className forwarding), use it — never copy component source into the app.
   - **Rationale:** Parent risk callout; upgrade path stays intact.
   - **Alternatives:** Vendor a patched SignUp (rejected); replace with custom HeroUI forms (out of scope; step 03 touches native controls separately).

5. **Scope = all AuthPageLayout siblings**
   - **Choice:** Smoke signup, login, forgot-password, and reset-password if they share the layout/islands. No special-case width only on signup.
   - **Rationale:** Step brief requires shared-layout consistency.
   - **Alternatives:** Signup-only fix (leaves login jump).

6. **Docs / e2e**
   - **Choice:** No Playwright assertion required for pixel width in this step (manual verify). Product Gherkin update only if `docs/product/features/auth.feature` already claims layout width; prefer openspec delta + optional one-line note in auth UI docs if a contract exists. Step 05 can harden e2e if needed.
   - **Rationale:** Brief verification is lint, typecheck, and manual hard-refresh.
   - **Alternatives:** Add Playwright bounding-box equality (brittle across viewports; defer unless already present).

## Risks / Trade-offs

- **[Risk] better-auth-ui sets inline styles or deeply nested max-width that theme CSS cannot override** → Mitigation: confirm with computed styles; if needed, target the nested selector with equal or higher specificity in `@layer components`; last resort use a documented layout prop — still no fork.
- **[Risk] Widening the card makes fields feel sparse on desktop** → Mitigation: keep `max-w-lg` (or the measured header width) as the cap; do not jump to `max-w-2xl` without evidence.
- **[Risk] Skeleton min-height (`auth-form--loading`) still causes vertical CLS while width is fixed** → Mitigation: out of scope unless trivial; width is the acceptance criterion.
- **[Trade-off] openspec/specs are historical** → Still write authentication delta here; product SoT update only if auth.feature needs a layout scenario (optional this step).
- **[Trade-off] Header rule is `border-bottom` on full column width** → Matching the card to the column (not shrinking the rule to the title text) is the intended read of the screenshot.

## Migration Plan

1. Measure header vs skeleton vs hydrated card widths on `/en/signup`.
2. Unify column + `.auth-form` / card width CSS (and `AuthPageLayout` class if useful).
3. Smoke login + forgot/reset sharing the layout.
4. Optional Ladle story glance.
5. `bun run lint` && `bun run typecheck`; hard-refresh visual check vs screenshot intent.
6. Mark step 02 done in parent guide on merge. No DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. If implementer finds the hydrated root is already `width: 100%` and the perceived mismatch is only the header rule vs title text length, still expand the **card** to the column width (header rule already is) — do not shrink the rule to the headline string.
