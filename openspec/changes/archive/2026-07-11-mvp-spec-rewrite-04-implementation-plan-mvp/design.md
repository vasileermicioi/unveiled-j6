## Context

Steps 01–03 filled `docs/product/` (charter, vision, sitemap, UI, schema, extras, Gherkin, journeys, `testing/bdd-and-e2e.md`). Agents still lack a delivery plan that:

| Gap | Evidence | Step 04 lock |
|---|---|---|
| Old plan cites migration | `.dev-plan/IMPLEMENTATION-PLAN.md` → `docs/migration/` | New plan → `docs/product/` only |
| Phases 0–5 still look “to do” | Old plan agent prompts rebuild foundation | Baseline = shipped; list debt only |
| Partner in MVP cadence | Old Phase 8 | Post-MVP appendix only |
| DS / BDD debt unscheduled | Gaps G5–G7; `bdd-and-e2e.md` known coverage gaps | Explicit remediation phases |
| No `IMPLEMENTATION-PLAN.mvp.md` | Charter artifact table | Create beside old plan |

Constraints: docs-only; do not overwrite old plan; do not flip `AGENTS.md` (05); stack unchanged (Bun, Workers, R2, Neon Auth, Europe/Berlin); HeroUI / SSR / locale hard rules carry forward.

## Goals / Non-Goals

**Goals:**

- Produce agent-ready `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` so a cold agent can start the next MVP phase without opening `docs/migration/`.
- Treat Phases 0–5 as shipped baseline with known debt.
- Schedule UI DS consolidation, BDD remediation, and sitemap alignment before or interleaved with remaining product phases.
- Schedule remaining MVP: Stripe + booking; waitlist + profile/billing; admin ops + GDPR + SEO polish.
- Park partner portal/check-in in a short post-MVP appendix.
- Mark step 04 done in the parent guide.

**Non-Goals:**

- Implementing any phase (code, Playwright, Ladle moves).
- Editing `AGENTS.md` / README SoT flip (step 05).
- Deleting or rewriting the old `IMPLEMENTATION-PLAN.md` body (optional one-line banner deferred to 05).
- Deleting `docs/migration/`.
- Reopening charter Locked decisions.

## Decisions

### 1. File placement and SoT preamble

Create **exactly** `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` next to the old plan. Opening preamble MUST state:

- Product SoT = `docs/product/`
- Planning guide = `.dev-plan/openspec_5step_proposals_guide.v2.md`
- Ignore `openspec/specs/` for product behavior
- `docs/migration/` and `.dev-plan/IMPLEMENTATION-PLAN.md` = historical / superseded for new work

**Alternative considered:** Overwrite the old plan — rejected; step brief and charter require both files present.

### 2. Phase numbering scheme

Keep continuity with shipped work; do **not** renumber 0–5.

| Block | IDs | Purpose |
|---|---|---|
| Baseline | **Phases 0–5** | Shipped summary + known debt (no agent rebuild prompts) |
| Remediation | **Phase 5.5** (or named **Remediation A/B/C** under one “Phase 5.5 — Spec alignment & debt”) | UI DS + BDD + sitemap alignment |
| Remaining MVP | **Phase 6** Stripe + booking; **Phase 7** waitlist + profile/billing; **Phase 8** admin ops + GDPR + SEO polish | Product delivery |
| Post-MVP | **Appendix** (not an active phase number in MVP cadence) | Partner portal + check-in |

Rationale: charter and old plan already call remaining work “6–7 style”; collapsing old Phase 9 member/admin hardening into MVP **Phase 8** avoids a partner-shaped Phase 8. Using **5.5** for debt keeps “start at Phase 6 for money” mental model while forcing remediation first.

**Alternative considered:** Named phases only (`remediation-ds`, `payments`, …) — acceptable if clearly ordered; prefer numbered 5.5 / 6 / 7 / 8 for agent prompts that match “one phase = one session.”

**Alternative considered:** Put partner as Phase 8 and admin as Phase 9 (old plan) — rejected; charter parks partner post-MVP.

### 3. Remediation scope (Phase 5.5) — must be explicit with done-when

Single remediation phase with three workstreams (can be one agent session or sequenced sub-prompts in the same phase section):

1. **UI DS consolidation**
   - Move/share design-system stories toward `packages/ui`
   - Add **Theme Overview** story (Uber yellow / near-zero radius / borders / typography / primary+secondary buttons)
   - Audit raw HTML / non-theme styling against `docs/product/ui/*`
   - Done-when: Theme Overview exists under `@unveiled/ui`; DS ownership matches `ui/design-system.md`; audit findings either fixed or listed as explicit deferrals in the plan

2. **BDD remediation**
   - Align e2e titles with `docs/product/features/*.feature`
   - Replace non-proximity selectors where feasible (gap G7); file-input exceptions commented
   - Coverage matrix: feature Scenario ↔ Playwright test; clear `@skip-no-ui` only with plan deferral
   - Cite `docs/product/testing/bdd-and-e2e.md` as the contract
   - Done-when: matrix checked in; locator debt reduced or deferred by name; Discover/public-detail scenarios have matching tests or explicit deferrals

3. **Sitemap alignment**
   - Verify Discover→Events CTAs and public `/events/:id` match `docs/product/sitemap/sitemap.md` + features
   - Fix code drift if still present; otherwise document “already aligned”
   - Done-when: spot-check routes match product sitemap; e2e or manual demo covers guest Discover → public detail → auth CTA path

### 4. Remaining MVP phase content (structure from old plan, paths rewritten)

Copy useful structure from old Phases 6–7 and member/admin parts of old Phase 9. Every “docs to read” path uses `docs/product/...`.

**Phase 6 — Payments & booking**

- `packages/billing`, `packages/email`; Stripe Checkout + webhooks; atomic booking; `/membership`, `/events/:id/book*`, `/bookings`
- Docs: `features/credits-subscription.feature`, `features/booking.feature`, `database/schema-overview.md`, `product/user-journeys.md`, `extras/integrations-and-config.md`
- Done-when: Stripe test card → ACTIVE → book → ticket + email; Ladle + Playwright for those features per BDD doc

**Phase 7 — Waitlist & member account**

- Waitlist join/cancel/auto-promote; `/profile`, `/profile/billing`, `/profile/preferences`; credit expiry (no rollover)
- Docs: `features/waitlist.feature`, `features/profile.feature`, `features/credits-subscription.feature`
- Done-when: sold-out → waitlist → promote → email; Ladle + Playwright pass

**Phase 8 — Admin ops, GDPR, SEO polish** (MVP slice of old Phase 9)

- `/admin/users/*`, admin waitlist/booking cancel; GDPR export/delete; `sitemap.xml` + SEO polish; Sentry optional; fix “credits roll over” copy
- **Exclude** partner-codes cron / partner-only bits → post-MVP appendix (or note “defer until partner”)
- Docs: `features/admin-users.feature`, auth GDPR scenarios, `extras/seo-and-metadata.md`, `extras/content-i18n-inventory.md`
- Done-when: MVP feature scenarios covered (or deferred by name); staging walkthrough green

### 5. Post-MVP appendix

Short appendix pointing at `docs/product/features/post-mvp/` (partner portal + check-in). Mention old Phase 8 scope as future work. **`/partner` appears only here**, not as an active MVP phase goal.

### 6. Hard rules + monorepo + roles blocks

Port from old plan with updates:

- Hard rules: HeroUI-only, theme-only, SSR mutations, locale, no Radio/Checkbox, **`@unveiled/ui` + Theme Overview**, **BDD proximity** citing `docs/product/testing/bdd-and-e2e.md`
- Monorepo tree: `docs/product/`; Ladle primarily under `packages/ui`; e2e traced to `docs/product/features/`
- Roles: MVP = ADMIN + USER (+ guest); PARTNER post-MVP; `partners` = venue records

### 7. Agent context block

Replace “build from `docs/migration/`” with “build from `docs/product/` + this MVP plan.” Cite `openspec_5step_proposals_guide.v2.md` for step plans under `.dev-plan/current-iteration/`.

### 8. Spec delta is a documentation contract

OpenSpec ADDED requirement on `platform-foundation`: the MVP plan file exists with the properties above. No runtime code in this step.

## Risks / Trade-offs

- **[Risk] Remediation scope balloons (43 story moves)** → Phase 5.5 done-when allows “move shared DS primitives + Theme Overview first; page stories may remain in `apps/web` with ownership documented”; full move can be phased inside 5.5 with explicit deferrals.
- **[Risk] Agents skip 5.5 and jump to Stripe** → Plan states remediation is **required before Phase 6** (or “must complete before Phase 6 done-when”); parent guide / step 05 can reinforce.
- **[Risk] Partner cron / daily codes still in old Phase 9** → Park in post-MVP; MVP Phase 8 SEO/admin must not require partner email cron.
- **[Risk] Old plan still looks active** → Step 05 adds banner; this step only creates the new file.
- **[Trade-off] Phase 8 number reused for admin (not partner)** → Document clearly in preamble so readers do not expect old Phase 8 partner work.

## Migration Plan

1. Outline phase list from decisions above against `docs/product/README.md` + CHARTER + `testing/bdd-and-e2e.md` known gaps.
2. Write full `IMPLEMENTATION-PLAN.mvp.md` (preamble → hard rules → monorepo → baseline 0–5 → Phase 5.5 → 6 → 7 → 8 → post-MVP appendix → how to run with agents).
3. Mark step 04 done in parent guide.
4. Run step verification `rg` / `test -f` commands.
5. No runtime deploy; rollback = delete `IMPLEMENTATION-PLAN.mvp.md` and uncheck parent guide.

## Open Questions

- None blocking. Sub-ordering inside Phase 5.5 (DS vs BDD vs sitemap first) left to implementer preference as long as all three have done-when before Phase 6 starts.
