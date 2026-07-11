## ADDED Requirements

### Requirement: MVP implementation plan artifact

The repository SHALL provide `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` as the delivery plan for remaining MVP work, referencing `docs/product/` as the product specification and treating Phases 0–5 as a shipped baseline with explicit remediation for design-system and BDD debt.

#### Scenario: New plan sits beside the old plan

- **WHEN** a reader lists `.dev-plan/`
- **THEN** both `IMPLEMENTATION-PLAN.md` (historical) and `IMPLEMENTATION-PLAN.mvp.md` (active MVP plan) are present

#### Scenario: Plan references product docs as source of truth

- **WHEN** an agent reads `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`
- **THEN** the plan cites `docs/product/` for product behavior, cites `openspec_5step_proposals_guide.v2.md` for step planning, and does not treat `docs/migration/` as the active source of truth

#### Scenario: Baseline and remediation are explicit

- **WHEN** an agent reads the MVP plan phase list
- **THEN** Phases 0–5 are summarized as shipped (not re-prompted to rebuild), and design-system consolidation plus BDD remediation appear as scheduled work before or interleaved with remaining product phases

#### Scenario: Partner is not an active MVP phase

- **WHEN** an agent scans MVP phase goals in `IMPLEMENTATION-PLAN.mvp.md`
- **THEN** `/partner` portal and check-in appear only in a post-MVP appendix, not as an active MVP phase goal
