## Why

Steps 01–04 delivered a complete `docs/product/` tree and `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`, but agent entry points (`AGENTS.md`, migration README, old plan, `docs/product/README.md`) still point at `docs/migration/` as the active product SoT. Until pointers flip and acceptance is written, cold agents will keep implementing against the superseded migration extract.

## What Changes

- Update **`AGENTS.md`** Source of truth table and related pointers: product SoT = `docs/product/`; active plan = `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`; cite `openspec_5step_proposals_guide.v2.md`; keep hard rules aligned with product UI/BDD docs (brief pointers, do not duplicate the full plan)
- Add a **superseded** banner at the top of `docs/migration/README.md` (MVP SoT is `docs/product/`; migration retained as historical extraction)
- Add a **superseded** banner at the top of `.dev-plan/IMPLEMENTATION-PLAN.md` (remaining work uses `IMPLEMENTATION-PLAN.mvp.md`)
- Finalize **`docs/product/README.md`** as **active SoT** (remove WIP / “future SoT” / “until step 05” language)
- Update **`docs/README.md`** if it indexes migration as primary — point to `docs/product/`
- Add **`docs/product/ACCEPTANCE.md`** — checklist mirroring parent release criteria + verification commands from steps 01–04; sign-off section
- Mark all child steps **done** in `mvp-spec-rewrite-parent-guide.md`; set release criteria checkboxes if present
- Optional: one-line note in `e2e/README.md` pointing at `docs/product/testing/bdd-and-e2e.md` as the selector contract
- Do **not** delete `docs/migration/` or the old plan; do **not** start Phase 6 implementation

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `platform-foundation`: MODIFIED — for new MVP work, canonical product specification SHALL be `docs/product/` and the active phased delivery plan SHALL be `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`; `docs/migration/` and `.dev-plan/IMPLEMENTATION-PLAN.md` remain as historical references only; agent entry via `AGENTS.md` directs to the new SoT

## Impact

- **Docs / pointers only:** `AGENTS.md`, `docs/migration/README.md`, `.dev-plan/IMPLEMENTATION-PLAN.md` (banner), `docs/product/README.md`, `docs/product/ACCEPTANCE.md`, `docs/README.md`, parent guide, optional `e2e/README.md`
- **Consumers:** all future agents implementing remaining MVP phases; closes the `mvp-spec-rewrite` parent feature
- **Sources:** parent guide release criteria; steps 01–04 verification commands; existing `docs/product/` tree + `IMPLEMENTATION-PLAN.mvp.md`
- **Out of scope:** moving Ladle stories; fixing `page.locator` in e2e; Stripe/booking code; deleting historical docs
