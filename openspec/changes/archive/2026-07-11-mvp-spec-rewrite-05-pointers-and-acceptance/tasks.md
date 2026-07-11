## 1. Setup

- [x] 1.1 Confirm `docs/product/` tree (README, CHARTER, product/, features/, ui/, database/, sitemap/, extras/, testing/) and `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` exist and match parent release criteria
- [x] 1.2 Grep agent-facing entry docs for `docs/migration` and `IMPLEMENTATION-PLAN.md` (`AGENTS.md`, `docs/README.md`, `.dev-plan/*`, `docs/product/README.md`) and note every hit to retarget or banner

## 2. Flip SoT pointers

- [x] 2.1 Patch `AGENTS.md` Source of truth table: product = `docs/product/`; plan = `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`; cite `openspec_5step_proposals_guide.v2.md`; mark migration + old plan historical
- [x] 2.2 Retarget `AGENTS.md` reading order, phase workflow, monorepo comment, extras citations, and quick-reference links from `docs/migration/` / old plan to `docs/product/` / MVP plan (keep hard rules; brief pointers only)
- [x] 2.3 Add superseded banner at top of `docs/migration/README.md` pointing at `docs/product/` for MVP
- [x] 2.4 Add superseded banner at top of `.dev-plan/IMPLEMENTATION-PLAN.md` pointing at `IMPLEMENTATION-PLAN.mvp.md` for remaining work
- [x] 2.5 Finalize `docs/product/README.md` as **active SoT** (remove WIP / “future SoT” / “until step 05” language; update tree status)
- [x] 2.6 Update `docs/README.md` so product detail points at `docs/product/` (not migration as primary)

## 3. Acceptance and parent closure

- [x] 3.1 Write `docs/product/ACCEPTANCE.md` with release criteria (mirroring parent guide), consolidated verification commands from steps 01–05, cold-read test, and sign-off section
- [x] 3.2 Mark step 05 and all child steps done in `.dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md`; set release criteria checkboxes or an explicit Status: complete
- [x] 3.3 Optional: add one-line pointer in `e2e/README.md` to `docs/product/testing/bdd-and-e2e.md` as the selector contract (do not rewrite e2e tests)

## 4. Validation

- [x] 4.1 Run `rg -n "docs/product|IMPLEMENTATION-PLAN.mvp" AGENTS.md` — SoT updated
- [x] 4.2 Run `rg -n "superseded|docs/product" docs/migration/README.md .dev-plan/IMPLEMENTATION-PLAN.md`
- [x] 4.3 Run `rg -n "active|source of truth|SoT" docs/product/README.md`
- [x] 4.4 Run `test -f docs/product/ACCEPTANCE.md`
- [x] 4.5 Run `rg -n "\[x\]|done|complete" .dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md` — steps marked done
- [x] 4.6 Cold-read test: from `AGENTS.md` alone, a new agent finds `docs/product/` and `IMPLEMENTATION-PLAN.mvp.md` without using migration as SoT
- [x] 4.7 Run `bun run lint` — exits 0 _(pre-existing Biome format failures in apps/web/packages/scripts; no diagnostics on files touched by this change)_
- [x] 4.8 Hand off: next implementation work follows `IMPLEMENTATION-PLAN.mvp.md` remediation/MVP phases (do not start Phase 6 in this change)
