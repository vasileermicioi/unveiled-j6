## ADDED Requirements

### Requirement: Event wizard BDD and docs
`docs/product/features/admin-events.feature` SHALL include scenarios titled `Create walks three steps`, `Create submit is on the image step`, `Edit can jump to image`, and `Missing image returns to step 3`. Playwright in `e2e/specs/admin-events.spec.ts` SHALL use those titles verbatim. The Events entry in `docs/product/ui/ui-component-map.md` SHALL mention the three-step create/edit stepper. Sitemap paths SHALL remain `/admin/events/new` and `/admin/events/:id/edit`. Clone SHALL be documented as not using the stepper.

#### Scenario: Coverage lists wizard scenarios
- **WHEN** I read the admin-events coverage matrix (if present)
- **THEN** it includes the four wizard scenario titles (pass or explicit environment skip)

#### Scenario: Clone is not a wizard
- **WHEN** I open clone for an existing event
- **THEN** I do not see the three-step progress chrome from create/edit
