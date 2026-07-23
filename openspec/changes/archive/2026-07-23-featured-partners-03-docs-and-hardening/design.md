## Context

Parent feature: Featured partners (`.dev-plan/current-iteration/featured-partners-parent-guide.md`). Steps 01–02 are done:

- Schema + domain: `featured_partners`, `@unveiled/db` helpers, integration tests
- Admin: **Featured events** / **Empfohlene Events** tab label; **Featured partners** tab + SSR list/add/remove under `/:locale/admin/featured-partners*`
- Discover: Partner venues from `listFeaturedPartners(db, { limit: 8 })`; empty curated list hides section
- Demo seed: features a subset of partners (prefer logos; leave ≥1 non-featured when catalog size allows)

Gaps vs releasable:

- `schema-overview.md` tables list omits `featured_partners` (has `featured_events` only)
- Sitemap admin chrome still says “Featured tab”; no Featured partners routes
- `admin-events.feature` still says “Featured tab”; `admin-partners.feature` has no featured-partners scenarios; Discover Gherkin lacks curated Partner venues scenarios
- UI map row still “Admin Featured”; i18n / gaps / coverage matrix not synced for this feature
- E2E `AdminTab` lacks `featured-partners`; Partner venues assert only section visibility (not curated vs non-featured); no featured-partners add/remove Playwright

Constraints: product SoT is `docs/product/` (not `openspec/specs/`); proximity selectors only; no new product behavior; BDD titles match Gherkin where required; parent non-goals (portal, reorder UI, hard max-8 on add) stay out.

## Goals / Non-Goals

**Goals:**

- Align listed `docs/product/` surfaces with shipped Featured partners + Featured events naming.
- Playwright coverage (or matrix deferral with owner) for: Featured events tab label/nav; Featured partners add/remove; Discover curated partners / empty hide when practical.
- Stable seed/fixture contrast for featured vs non-featured partners.
- Mark step 03 + parent feature complete.

**Non-Goals:**

- Partner portal, public partner pages, clickable Discover tiles.
- Drag-and-drop reorder; hard-reject on 9th admin add.
- New admin/Discover product surfaces or schema changes.
- Phase 6+ billing/email.

## Decisions

1. **Gherkin ownership**
   - **Choice:** Extend existing `admin-partners.feature` with Featured partners list/add/remove/empty/remove-keeps-venue scenarios; rename “Featured tab” → **Featured events** wording in `admin-events.feature`; add Discover curated Partner venues (+ empty hide) to `event-discovery.feature` and/or `static-pages.feature` as fits existing structure. Prefer extending over new feature files.
   - **Rationale:** Step brief; Scenario titles become Playwright `test()` titles.
   - **Alternatives:** New `admin-featured-partners.feature` (unnecessary split when partners feature already owns venue admin).

2. **Docs sync surface**
   - **Choice:**
     - Schema: add `featured_partners` to tables list + entity section mirroring `featured_events` (PK `partner_id`, `sort_order`, `created_at`, ON DELETE CASCADE; remove-from-featured keeps partner).
     - Sitemap: Featured partners routes (`/admin/featured-partners`, `/add?q=`, `/:partnerId/remove`); admin chrome **Featured events** + **Featured partners**; Discover wording = curated featured partners not “first N of all partners”.
     - UI map: Admin Featured → Admin Featured events; add Admin Featured partners row; Discover Partner venues = admin-curated.
     - `static-pages-content.md`: verify Partner venues already aspirational-correct; edit only if drift.
     - i18n inventory + gaps-and-decisions: record curation decision + tab rename; inventory shipped DE/EN keys.
     - Coverage matrix: map new/updated scenarios to Playwright titles or named deferrals with owner.
   - **Rationale:** Step deliverables; agents must not invent catalog-slice Partner venues.
   - **Alternatives:** Docs-only without e2e (fails parent release criteria).

3. **E2E fixtures and specs**
   - **Choice:**
     - Extend `AdminTab` with `"featured-partners"` and `TAB_HREF`; keep `"featured"` → `admin/featured`.
     - Tab label assertions use **Featured events** / **Empfohlene Events** (and Featured partners / DE equivalent) — never bare `/^Featured$/` or `/^Empfohlen$/`.
     - Extend `e2e/specs/admin-partners.spec.ts` (or adjacent) for Featured partners flows with verbatim Scenario titles; skip with named env reasons when `!hasAdminCredentials()` / `!hasDatabaseUrl()`.
     - Discover: assert curated partners appear and a known non-featured partner does not; optional empty-hide test via fixture that clears featured partners in a controlled way (skip if too destructive for shared DB — matrix defer with owner).
     - Optional `ensureDemoFeaturedPartnersSplit` (or extend catalog fixture) akin to `ensureDemoFeaturedSplit` when seed alone is insufficient for contrast.
   - **Rationale:** Existing admin-partners + event-discovery hooks; BDD proximity contract.
   - **Alternatives:** New `admin-featured-partners.spec.ts` only (OK if cleaner; still map matrix to feature files).

4. **Seed vs fixture responsibility**
   - **Choice:** Rely on shipped demo seed subset first; add e2e fixture helpers only when tests need guaranteed mixed featured/non-featured state on shared DBs. Do not re-feature the entire catalog.
   - **Rationale:** Step 02 already seeds a subset; hardening should not regress contrast.
   - **Alternatives:** Always rebuild featured partners in every Discover test (heavier; OK if seed flaky).

5. **Coverage deferral bar**
   - **Choice:** Prefer executable Playwright. If empty-hide or multi-step add/remove is too brittle on shared staging, list a named deferral in `coverage-matrix.md` with owner — still document manual demo in handoff/parent criteria.
   - **Rationale:** Step brief allows matrix deferral; release still closes via docs + primary happy paths.

6. **openspec vs product SoT**
   - **Choice:** Update `docs/product/` as canonical merge target. Openspec deltas under this change are planning contracts only; do not treat `openspec/specs/` as product SoT (AGENTS.md).
   - **Rationale:** Repo convention.

## Risks / Trade-offs

- **[Risk] Shared staging DB lacks non-featured partners** → Mitigation: fixture helper to ensure split; or assert via admin-created partner never featured.
- **[Risk] Empty-hide e2e clears all featured partners and breaks parallel Discover tests** → Mitigation: skip/defer empty-hide; or isolate with unique DB branch; document owner in matrix.
- **[Risk] Brittle tab regex still matches “Featured events” via `/Featured/`** → Mitigation: use exact tab accessible names / `/^Featured events$/i` style; verify DE similarly.
- **[Risk] Docs drift vs openspec/specs** → Mitigation: `docs/product/` wins; openspec delta is planning only.
- **[Trade-off] No hard max-8 on admin add** → Mitigation: already decided; docs state Discover displays up to 8.

## Migration Plan

1. Update product docs (schema, sitemap, Gherkin, UI map, i18n, gaps, coverage matrix); verify static Discover copy.
2. Update e2e fixtures (`AdminTab`) + admin-events / admin-partners / event-discovery specs.
3. Add fixture helper for partner featured split only if needed; confirm seed contrast.
4. `bun run lint`, `bun run typecheck`; targeted e2e when env allows.
5. Grep sanity: no “first N of all partners” Discover claims in `docs/product/`.
6. Mark step 03 done and parent feature releasable in parent guide.
7. Rollback = revert docs/e2e/fixture commits; no schema migration in this step.

## Open Questions

- None blocking. Empty-hide Playwright may be matrix-deferred with owner if shared-DB isolation is impractical; implementer documents the deferral explicitly.
