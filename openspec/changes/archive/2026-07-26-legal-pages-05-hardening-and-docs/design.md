## Context

Parent feature: Legal Static Pages Content (`.dev-plan/current-iteration/legal-pages-parent-guide.md`). Child step 05 — final slice; depends on 01–04 (all done).

Runtime content is already complete: `apps/web/app/lib/content/legal.ts` has bilingual Impressum, Privacy, and Terms with multi-paragraph `body` sections; zero `Platzhalter` / `pending legal review` matches. Routes, footer LEGAL column, `LegalPage` UI, and Ladle stories exist from earlier steps. What remains is the **verification and documentation layer**:

- `e2e/specs/static-pages.spec.ts` legal scenario only asserts footer links + H1 visibility — not distinctive body copy or absence of placeholders.
- `docs/product/features/static-pages.feature` Then steps say “corresponding legal content” without requiring non-placeholder body sections.
- `docs/product/ui/static-pages-content.md` has no dedicated Legal pages subsection (routes / module path / counsel-pending note / no-rollover).
- `docs/product/extras/content-i18n-inventory.md` does not index `legal.ts` page titles.
- Parent guide still lists step 05 open; release criteria need a final walkthrough.

Constraints: `docs/product/` is behavioral SoT (AGENTS.md); OpenSpec under `openspec/specs/` is a planning mirror only; BDD proximity/role selectors only (`docs/product/testing/bdd-and-e2e.md`); no cookie-banner/SEO/footer IA changes; no counsel engagement or PDF packaging; do not rewrite `legal.ts` content unless verification finds a leftover placeholder (unexpected).

## Goals / Non-Goals

**Goals:**

- Lock non-placeholder legal body copy with locale-tolerant e2e assertions on all three routes.
- Align Gherkin Then steps, static-pages-content, and i18n inventory with shipped legal module behavior.
- Keep Ladle `LegalPage` stories honest (verify; fix only if broken).
- Close parent feature: mark steps 01–05 done and confirm release criteria.

**Non-Goals:**

- Formal counsel sign-off or publishing PDF terms.
- Changing footer IA or adding a Cookie Policy fourth legal link.
- Cookie-banner / CMP or SEO meta refactors.
- Phase 6–8 billing/GDPR feature work beyond documenting what Privacy already describes.
- Rewriting operational legal prose unless a banned placeholder substring is found.
- Expanding e2e into counsel-level clause checklists.

## Decisions

1. **E2E assertion strategy: distinctive body + banned substrings**
   - **Choice:** After existing footer-link + H1 checks, for each of `/impressum`, `/privacy`, `/terms` assert:
     - At least one distinctive real body string (locale-tolerant regex), e.g.:
       - Impressum: `/Luisenstra(ß|ss)e|10117 Berlin/i`
       - Privacy: `/Stripe|Rechte|rights/i` (or similar rights/processor cue present in both locales)
       - Terms: `/Credits?/i` plus a no-rollover cue (`/roll(en)? (nicht|over)|nicht .*übertragen|do not roll over/i`)
     - Page text does **not** match `/Platzhalter|pending legal review/i`
   - Use `getByRole` / `getByText` / main content walks — no CSS class chains or `data-testid`.
   - Keep scenario title verbatim: `Legal pages exist and are linked from the footer`.
   - **Rationale:** Step brief; proves content from 02–04 without over-specifying legal clauses; matches suite’s locale-tolerant regex style.
   - **Alternatives:** Snapshot full page HTML (brittle); assert every section id (over-coupled to counsel edits); H1-only (status quo, insufficient).

2. **Banned substrings vs counsel-disclaimer intros**
   - **Choice:** Ban only the exact placeholder markers `Platzhalter` and `pending legal review` in page content and `legal.ts` verification. Leave intentional short counsel-disclaimer intros (e.g. DE “formale Rechtsprüfung”, EN “formal legal review may still follow”) alone — they are operational notes, not Platzhalter stubs.
   - Product docs MAY say “pending formal legal review” as a **meta** status note for operators; that phrase lives in docs, not as a required page watermark.
   - **Rationale:** Step verification `rg` pattern; step 04 Decision 5 already allowed intro disclaimers.
   - **Alternatives:** Strip all counsel language from page intros (out of scope content rewrite); ban “legal review” broadly (false-positive on honest intros).

3. **Gherkin tighten without counsel over-spec**
   - **Choice:** Update the legal scenario Then steps to require non-placeholder body sections in the selected language; keep scenario title stable so coverage-matrix mapping stays 1:1. Do not enumerate TMG/GDPR clause lists in Gherkin.
   - **Rationale:** Step Spec Delta; BDD SoT for Playwright titles.
   - **Alternatives:** Rename scenario (forces matrix + test rename churn); leave feature text vague (agents won’t know e2e must assert body).

4. **Docs: short Legal pages subsection + inventory pointer**
   - **Choice:** Add a concise **Legal pages** subsection to `static-pages-content.md`: routes (`/:locale/impressum|privacy|terms`), content module path (`apps/web/app/lib/content/legal.ts`), note `body: string[]` section model, operational copy pending formal legal review, Terms reflects credits no-rollover. In `content-i18n-inventory.md`, add a short legal module section listing page titles DE/EN (Impressum/Imprint, Datenschutz/Privacy Policy, AGB/Terms of Service) and pointing at `legal.ts` rather than dumping full prose.
   - **Rationale:** Parent release criteria; avoid duplicating multi-page legal bodies into the inventory.
   - **Alternatives:** Paste full legal.ts into inventory (noise); skip docs (leaves SoT stale).

5. **Coverage-matrix and Ladle: touch only when needed**
   - **Choice:** Update coverage-matrix notes only if the legal row’s note/status should mention body assertions; keep pass status if already pass. Run/verify `LegalPage.stories.tsx` via existing stories workflow or smoke render — edit stories only if they still show placeholder fixtures.
   - **Rationale:** Step brief “only if”; avoid drive-by churn.
   - **Alternatives:** Always rewrite matrix row (noise); rewrite stories preemptively (unnecessary if already green).

6. **OpenSpec delta: ADDED regression requirement on `static-marketing-pages`**
   - **Choice:** Add requirement `Legal pages are complete and regression-tested` (step-plan name) rather than rewriting the existing broad `Legal pages` accessibility/SEO requirement. Per-page content requirements from 02–04 stay; this requirement binds footer linkage + non-placeholder body + e2e-oriented scenarios.
   - **Rationale:** OpenSpec guidance — new concerns → ADDED; preserves existing Legal pages scenarios at archive time.
   - **Alternatives:** MODIFY `Legal pages` in place (risk of losing SEO/access scenarios if partial); skip OpenSpec (leaves planning mirror weak on regression).

7. **Parent close-out in the same change**
   - **Choice:** After verification, mark step 05 (and confirm 01–04) done in `legal-pages-parent-guide.md`; walk Release Criteria checklist. Leave Risks/Open Questions that are operator/counsel follow-ups (Handelsregister, phone currency) as recorded risks — do not invent IDs.
   - **Rationale:** Step closes the feature; parent Non-Goals already accept counsel-pending copy.
   - **Alternatives:** Leave parent open until counsel reviews (blocks release forever under Non-Goals).

## Risks / Trade-offs

- **[Risk] Distinctive regex too strict after minor copy edits** → Mitigation: Decision 1 uses stable facts (address fragment, Stripe, Credits + no-rollover) that product SoT requires to remain.
- **[Risk] E2E cannot run in agent environment** → Mitigation: Commit assertions anyway; document skip reason; rely on lint/typecheck + `rg` + manual spot-check.
- **[Risk] False fail on counsel-disclaimer intros** → Mitigation: Decision 2 — only ban exact Platzhalter / `pending legal review`.
- **[Risk] Doc “pending formal legal review” confused with banned page string** → Mitigation: Keep that phrase in product docs only; e2e checks rendered page content.
- **[Trade-off] Inventory points at module instead of full bilingual dump** → Prefer pointer; full prose lives in `legal.ts` and is reviewed there.
- **[Trade-off] No runtime feature work** → If e2e reveals a real leftover placeholder, fix `legal.ts` narrowly; do not expand into counsel rewrite.

## Migration Plan

1. Strengthen e2e + Gherkin → update static-pages-content + i18n inventory → optional coverage-matrix note → verify Ladle.
2. Run lint/typecheck/`rg`/targeted e2e (or document skip).
3. Mark parent guide steps done; sync OpenSpec main spec on archive.
4. No DB, env, or deploy migration.
5. Rollback: revert docs/e2e/feature commits; runtime legal content unchanged by this step’s happy path.

## Open Questions

- None blocking for planning. If targeted e2e cannot run at apply time, record skip reason in the PR/handoff and keep assertions committed.
