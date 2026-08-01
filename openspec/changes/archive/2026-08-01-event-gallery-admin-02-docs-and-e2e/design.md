## Context

Parent feature: Event Gallery Admin Entry (`.dev-plan/current-iteration/event-gallery-admin-parent-guide.md`). Child step 02 — final slice; depends on 01 (done/archived).

Runtime UI already matches parent release criteria for admin entry:

- Events list (`AdminEventsTable`) exposes gallery manage via `AdminTableActions` → `adminEventGalleryPath` for every catalog event (no `featured_events` gate).
- Event edit shell actions include gallery manage beside Clone.
- Featured list retains a convenience gallery shortcut.
- Create-event has no gallery manage entry.
- Gallery routes (`/:locale/admin/events/:id/gallery*`), catalog APIs, schema, and public detail gallery are unchanged.

What remains is the **verification and documentation layer**:

- `admin-events.feature` still has `Scenario: Gallery manage is available from the featured list` asserting manage is **not** on Events list or create/edit.
- `ui-component-map.md` Events row still says gallery entry from **Featured list only**.
- `image-uploads.md` §8a still says entry from Featured list.
- DEPLOYMENT “Featured Event Gallery demo script” step 3 still says manage is not on Events/edit.
- Coverage matrix + Playwright still title/assert Featured-exclusive entry (`toHaveCount(0)` on Events row gallery link).
- OpenSpec `admin-events` gallery requirement still hedges “product Gherkin entry-point wording is updated in a follow-on docs/e2e change.”
- OpenSpec `bdd-and-e2e` still names coverage **Featured Event Gallery**.
- Parent guide still lists step 02 open.

Constraints: `docs/product/` is behavioral SoT (AGENTS.md); OpenSpec under `openspec/specs/` is a planning mirror only; BDD proximity/role selectors only (`docs/product/testing/bdd-and-e2e.md`); no new gallery upload features; no schema/pipeline changes; public discovery gallery scenarios stay as-is unless seed host changes.

## Goals / Non-Goals

**Goals:**

- Align Gherkin + UI map + image-uploads §8a + gaps/DEPLOYMENT + Playwright (+ coverage-matrix) with shipped per-event gallery admin entry.
- Drop Featured-exclusivity claims; document Events list/edit as primary entry; Featured as optional convenience.
- Close parent feature: mark step 02 done and walk Release Criteria.

**Non-Goals:**

- Changing gallery routes, catalog APIs, schema, max capacity (12), or five-WebP pipeline.
- Changing public event detail gallery display rules.
- Requiring gallery photos on create.
- Partner-portal gallery management.
- Forcing a non-featured gallery seed for public demos (seed host may remain featured).
- Removing the Featured convenience gallery shortcut (default: keep).

## Decisions

1. **Docs-and-BDD first, then e2e, then close-out**
   - **Choice:** Update product feature file + UI map / image-uploads / gaps / DEPLOYMENT → Playwright + coverage-matrix → stale Featured-only grep → parent close-out.
   - **Rationale:** Step brief; e2e titles must match Gherkin verbatim; avoid matrix title drift.
   - **Alternatives:** Flip e2e before Gherkin (title drift); close parent before matrix (release criteria incomplete).

2. **Replace Featured-exclusive Gherkin scenario (do not keep as sole entry claim)**
   - **Choice:** Replace `Gallery manage is available from the featured list` with a scenario whose title matches Events entry intent, e.g. `Gallery manage is available from the Events catalog` (or equivalent), asserting path from Events list and/or edit; Featured MAY remain as optional convenience wording, not exclusivity.
   - **Rationale:** Step Spec Delta; product SoT must not claim Featured-only; Playwright titles track Gherkin verbatim.
   - **Alternatives:** Keep old title and only change steps — leaves greppable “featured list” exclusivity; add a second scenario without removing the old one — duplicates conflicting SoT.

3. **Playwright: assert Events entry; drop Featured-gate setup**
   - **Choice:** Rewrite the gallery-entry test to: create event (need not feature it) → Events list (or edit) → gallery manage link visible → navigate to `/admin/events/:id/gallery`. Remove asserts that Events has `toHaveCount(0)` gallery links. Optional: keep a light Featured convenience assert only if Gherkin still mentions it; default focus is Events path. Selectors: proximity/layout only (`getByRole` link for gallery manage / “Galerie-Fotos verwalten”).
   - **Rationale:** Step Spec Delta bdd-and-e2e; non-featured must be acceptable.
   - **Alternatives:** Keep Featured-first path as primary test — fails parent release criteria; dual tests for Events + Featured — fine if cheap, not required.

4. **Coverage matrix: rename row to new Scenario title**
   - **Choice:** Update the matrix row that currently maps `Gallery manage is available from the featured list` to the new Gherkin/Playwright title (`pass` or R2 named env `skip`).
   - **Rationale:** Matrix is CI/agent index; titles must stay in sync.
   - **Alternatives:** Leave old title — CI/docs lie.

5. **DEPLOYMENT demo script: Events-first admin path**
   - **Choice:** Rename/refocus “Featured Event Gallery demo script” toward Event Gallery; admin step opens gallery from **Events** list/edit (Featured shortcut optional). Public guest step may still use the seeded featured theater demo.
   - **Rationale:** Step deliverables; staging demos must match SoT.
   - **Alternatives:** Only fix product docs — staging operators still follow Featured-only script.

6. **UI map + image-uploads §8a + gaps: Events/edit entry**
   - **Choice:** Events row documents gallery manage from Events list and/or edit; Featured shortcut optional. §8a entry wording matches. Gaps-and-decisions records admin entry alignment (per-event, not Featured-gated).
   - **Rationale:** Step deliverables; greppable Featured-only claims must go.
   - **Alternatives:** Partial updates — agents keep implementing against Featured gate.

7. **Public discovery scenarios: leave seed wording**
   - **Choice:** Keep `Featured demo event includes gallery` and seed host as-is unless e2e needs a non-featured gallery seed (it does not for this step).
   - **Rationale:** Parent Risks / step Out of scope; public display is already per-event.
   - **Alternatives:** Rename public scenario now — unnecessary churn.

8. **OpenSpec hedges: clear follow-on wording**
   - **Choice:** When syncing/modifying `admin-events`, require product Gherkin/docs to match Events/edit entry now (remove “follow-on docs/e2e change”). Rename/refocus `bdd-and-e2e` **Featured Event Gallery** → **Event Gallery** coverage including Events manage entry.
   - **Rationale:** This step is that follow-on.
   - **Alternatives:** Leave hedges — archive sync keeps stale permission.

## Risks / Trade-offs

- **[Risk] Gherkin/Playwright title rename breaks local mental model / PR review grep** → Mitigation: update feature file, Playwright `test("Scenario: …")`, and coverage-matrix in the same change; grep for old title before handoff.
- **[Risk] R2 env-skip masks a real regression on Events entry** → Mitigation: keep assertions committed; skip reason stays env-only (never “UI not built”); DEPLOYMENT demo script covers manual smoke.
- **[Risk] Stale Featured-only wording remains in a doc missed by the file list** → Mitigation: repo grep for “Featured list only”, “not on the Events list”, “gallery manage is not shown on the Events” after edits.
- **[Trade-off] Dual Events + Featured e2e vs Events-only** → Prefer Events-primary; Featured convenience is optional coverage, not the sole assertion.

## Migration Plan

1. Land docs + e2e updates together (no runtime schema/API migration).
2. No rollback beyond reverting the docs/e2e commit; UI from step 01 remains correct either way.
3. After merge: mark step 02 + parent guide done; archive this OpenSpec change when applying `/opsx:archive`.

## Open Questions

_(none blocking — parent default: keep Featured convenience shortcut; leave public seed featured.)_
