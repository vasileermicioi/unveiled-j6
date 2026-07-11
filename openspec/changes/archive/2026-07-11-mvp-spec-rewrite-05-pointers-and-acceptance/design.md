## Context

Steps 01–04 produced a complete `docs/product/` tree and `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`. Agent entry points still treat the migration extract as SoT:

| Entry point | Current state | Step 05 target |
|---|---|---|
| `AGENTS.md` SoT table | `docs/migration/` + `IMPLEMENTATION-PLAN.md` | `docs/product/` + `IMPLEMENTATION-PLAN.mvp.md` |
| `docs/product/README.md` | “Future SoT” / WIP until step 05 | **Active SoT** |
| `docs/migration/README.md` | Reads as live product spec | Banner: superseded for MVP |
| `.dev-plan/IMPLEMENTATION-PLAN.md` | Reads as active plan | Banner: superseded by `.mvp.md` |
| `docs/README.md` | Mentions `docs/migration/` as product detail | Point to `docs/product/` |
| Parent guide step 05 | Pending | Mark 01–05 done; release criteria checked |
| Acceptance artifact | Missing | `docs/product/ACCEPTANCE.md` |

Constraints: documentation and pointer updates only; do not delete historical files; do not implement Phase 6+; keep edits minimal outside `ACCEPTANCE.md`.

## Goals / Non-Goals

**Goals:**

- Flip agent SoT so a cold read of `AGENTS.md` alone finds `docs/product/` + `IMPLEMENTATION-PLAN.mvp.md` without treating migration as SoT.
- Banner-supersede migration README and the old implementation plan without deleting them.
- Finalize `docs/product/README.md` as active SoT (remove WIP language).
- Write `docs/product/ACCEPTANCE.md` mirroring parent release criteria + steps 01–04 verification commands, with a sign-off section.
- Close the parent feature (all five steps done; release criteria checked).
- Optional: one-line `e2e/README.md` pointer to `docs/product/testing/bdd-and-e2e.md`.

**Non-Goals:**

- Deleting `docs/migration/` or `.dev-plan/IMPLEMENTATION-PLAN.md`.
- Starting Phase 5.5 / Phase 6 implementation (code, Ladle moves, Playwright locator fixes).
- Rewriting all e2e tests or moving stories.
- Duplicating the full MVP plan into `AGENTS.md` (brief pointers only).
- Reopening charter Locked decisions.

## Decisions

### 1. AGENTS.md SoT flip — surgical, not a full rewrite

Update the **Source of truth** table and every agent-facing “read this for product behavior / phase plan” pointer:

| Role | Path |
|---|---|
| Product spec | `docs/product/` |
| Phased delivery plan | `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` |
| Planning guide | `.dev-plan/openspec_5step_proposals_guide.v2.md` |
| Historical extract | `docs/migration/` (retained; not SoT for new work) |
| Historical plan | `.dev-plan/IMPLEMENTATION-PLAN.md` (retained; not for new work) |

Also update: “How to read the spec” order → `docs/product/README.md`; phase workflow → MVP plan; quick-reference links; monorepo tree comment that listed `docs/migration/`. Keep hard rules (HeroUI, yellow bg, SSR mutations, locale, etc.) — retarget any `docs/migration/...` citations in those sections to `docs/product/...` equivalents. Cite BDD via `docs/product/testing/bdd-and-e2e.md` and UI via `docs/product/ui/` where AGENTS currently points at migration UI paths.

**Alternative considered:** Leave deep `docs/migration/` links in AGENTS “for history” without banners — rejected; cold agents would still follow them as SoT.

**Alternative considered:** Full AGENTS rewrite to mirror the entire MVP plan — rejected; step brief says brief pointers, don’t duplicate the plan.

### 2. Superseded banners — additive, top-of-file

Add a short callout at the **top** of:

1. `docs/migration/README.md` — superseded by `docs/product/` for MVP; retained as historical extraction.
2. `.dev-plan/IMPLEMENTATION-PLAN.md` — superseded by `IMPLEMENTATION-PLAN.mvp.md` for remaining work.

Do not rewrite the bodies. Banners must include the words **superseded** and a link/path to `docs/product/` (migration) or `IMPLEMENTATION-PLAN.mvp.md` (old plan) so verification `rg` passes.

### 3. `docs/product/README.md` becomes active SoT

Replace “Future source of truth” / “Until rewrite step 05” / tree-status “Step 05 pending” language with:

- This folder **is** the active product source of truth for MVP work.
- Delivery plan = `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`.
- `docs/migration/` = historical only.
- Tree status: steps 01–04 complete; pointers activated in step 05.

Keep the existing “How to read (order)” structure — it already matches the intended agent reading order.

### 4. `docs/product/ACCEPTANCE.md` structure

Single checklist file with:

1. **Release criteria** — mirror parent guide bullets (complete `docs/product/` tree; MVP plan exists; personas; Discover→Events + public detail; `@unveiled/ui` + Theme Overview; BDD proximity; lint/doc checks; no code required to close this feature).
2. **Verification commands** — consolidate steps 01–04 + this step’s `rg` / `test -f` / `bun run lint` commands with expected outcomes.
3. **Cold-read test** — from `AGENTS.md` alone, agent finds product SoT + MVP plan without using migration as SoT.
4. **Sign-off** — date / agent-or-human / notes (blank fields OK).

### 5. Parent guide closure

In `mvp-spec-rewrite-parent-guide.md`:

- Strike-through / mark step 05 **done** (same style as 01–04).
- Check release-criteria items if they use checkboxes; otherwise add an explicit **Status: complete** (or checkboxes) so `rg` for done/complete/`[x]` succeeds.

### 6. Optional e2e README pointer

Add one sentence near the selector-policy section: selector contract SoT is `docs/product/testing/bdd-and-e2e.md`. Do not rewrite the e2e suite.

### 7. Spec delta approach

- **ADDED** `Canonical product specification location` on `platform-foundation` (new requirement from step brief).
- **MODIFIED** `MVP product-spec charter` — remove “stub / not yet SoT until pointer step” language; README SHALL state `docs/product/` is the active agent source of truth; keep charter binding + partner post-MVP scenarios.

Do not rewrite unrelated platform-foundation requirements that still mention `docs/migration/` paths (e.g. image-upload docs) in this step — those are historical openspec wording; product SoT for images is already under `docs/product/extras/`.

## Risks / Trade-offs

- **[Risk] Incomplete AGENTS path rewrite leaves migration as SoT in a subsection** → Mitigation: grep `AGENTS.md` for `docs/migration` and `IMPLEMENTATION-PLAN.md` after edits; every hit must be historical/superseded framing or retargeted to `docs/product/`.
- **[Risk] Agents still open migration first out of habit** → Mitigation: banners on migration README + old plan; AGENTS SoT table first; ACCEPTANCE cold-read test.
- **[Risk] Over-editing AGENTS hard rules causes drift from product UI docs** → Mitigation: change paths/pointers only; do not invent new hard rules; cite product UI/BDD docs.
- **[Trade-off] openspec/specs still mention migration in older requirements** → Accept for this docs-only step; product behavior for agents is AGENTS + `docs/product/`, not archived openspec wording.

## Migration Plan

1. Confirm `docs/product/` tree + `IMPLEMENTATION-PLAN.mvp.md` exist (prereq).
2. Grep agent-facing entry docs for `docs/migration`.
3. Patch AGENTS → banners → product README → docs/README → ACCEPTANCE → parent guide → optional e2e pointer.
4. Run verification commands including `bun run lint`.
5. Rollback = revert pointer commits; historical files unchanged in body.

## Open Questions

- None blocking. Whether to add checkboxes vs a Status line on the parent guide release criteria is implementer choice as long as verification `rg` finds done/complete/`[x]`.
