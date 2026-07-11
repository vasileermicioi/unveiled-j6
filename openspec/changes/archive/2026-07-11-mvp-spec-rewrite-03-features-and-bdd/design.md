## Context

Step 02 filled the structural half of `docs/product/` (vision, sitemap, UI, schema, extras) under charter locks. Behavioral specs still live only under `docs/migration/features/` and `docs/migration/product/user-journeys.md`, which:

| Gap | Migration evidence | Charter / step 03 lock |
|---|---|---|
| G4 | `partner-portal.feature`, `checkin.feature`, Journey 5 partner portal | Partner post-MVP; park under `features/post-mvp/` |
| G1/G2 | Scenarios still imply gated detail / separate Discover | Public `/events/:id`; Discover = `/:locale`; guest preview + auth CTA |
| G7 | `e2e/README.md` states proximity policy; ~25 `page.locator` uses; no product-level contract | `testing/bdd-and-e2e.md` hard rules + exception list |
| Drift | Shipped e2e titles already diverge from some migration scenarios (e.g. static-pages “Discover is the home page” vs “Landing page”) | Inventory gaps in testing/journeys; prefer aligning product Gherkin to shipped titles when behavior matches |

Foundation docs to align against: `docs/product/CHARTER.md`, `sitemap/sitemap.md`, `ui/design-system.md`, `product/vision-and-domains.md`.

Constraints: docs-only; HeroUI Select (not Radio/Checkbox) in scenarios; prefer modifying migration scenario wording over inventing parallel titles when behavior is unchanged; no Playwright/Ladle code; no MVP plan (04); no `AGENTS.md` flip (05).

## Goals / Non-Goals

**Goals:**

- Complete the behavioral half of `docs/product/`: MVP journeys + Gherkin features for guest / member / admin.
- Park partner portal + check-in under `features/post-mvp/` clearly labeled not-in-MVP.
- Encode an enforceable BDD contract in `docs/product/testing/bdd-and-e2e.md` (Scenario titles, proximity selectors, exceptions, `@skip-no-ui` gate, Ladle pointer).
- Update README reading order; reconcile CHARTER target-tree filename (`bdd-playwright.md` → `bdd-and-e2e.md`).
- Document known e2e↔feature coverage gaps for step 04 to schedule.
- Mark step 03 done in the parent guide.

**Non-Goals:**

- Writing or fixing Playwright specs / moving Ladle stories.
- `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` (step 04).
- `AGENTS.md` / SoT flip (step 05).
- Deleting `docs/migration/` feature files.
- Implementing booking, Stripe, waitlist, or partner portal code.

## Decisions

### 1. Filename: `testing/bdd-and-e2e.md` (amend CHARTER)

Step 03 brief and verification commands use `bdd-and-e2e.md`. CHARTER target tree and README currently say `bdd-playwright.md`. **Use `bdd-and-e2e.md`** and amend CHARTER + README so the tree does not drift.

**Alternative considered:** Keep `bdd-playwright.md` to match CHARTER — rejected; step verification and brief are explicit.

### 2. Port/rewrite migration features; classify keep / rewrite / post-mvp

| Migration file | Action |
|---|---|
| `static-pages`, `auth`, `onboarding` | Port + rewrite Discover/home + CTAs to match sitemap |
| `event-discovery` | **Rewrite** — guest preview, public detail, member feed/saved/map |
| `admin-events` | Port (SSR pages already) |
| `admin-partners` | **Rewrite** — venue CRUD only; portal-access + venue QR regenerate → post-mvp (or tagged deferred) |
| `admin-users`, `booking`, `credits-subscription`, `waitlist`, `profile` | Port / trim for MVP (unshipped code OK — specs lead) |
| `partner-portal`, `checkin` | **Move** to `features/post-mvp/` (single combined file or two files, clearly labeled) |

Prefer keeping Scenario titles that already match shipped `e2e/specs/*.spec.ts` when behavior is unchanged (reduces drift). When sitemap forces a behavior change (public detail, Discover home), rewrite the Scenario text and note the e2e gap for step 04.

**Alternative considered:** Leave partner features in top-level with `@post-mvp` tags only — rejected; step brief requires physical parking under `post-mvp/`.

### 3. Guest discovery narrative in Gherkin (locked)

Encode in `event-discovery.feature` + `static-pages.feature` + journeys:

1. Guest on Discover (`/:locale`) sees curated preview; cards → public `/events/:id`.
2. Path to full browse: signup/login → onboarding if needed → member `/events`.
3. No public full feed equivalent to `/events`.
4. Member: `/events`, `/events/map`, `/saved`, public detail.

Public detail scenarios MUST appear in `event-discovery.feature` (unauthenticated access). Discover→browse CTAs MUST appear in `static-pages.feature` and/or journeys.

### 4. Admin partners: venues in MVP; portal/check-in out

`admin-partners.feature` keeps create/edit/delete/logo/rename-propagates. Scenarios for portal access and venue check-in QR regenerate move to post-mvp (charter: no partner login / check-in UI in MVP). Venue **records** remain first-class.

### 5. BDD contract content (enforceable, not folklore)

`docs/product/testing/bdd-and-e2e.md` SHALL state:

| Rule | Detail |
|---|---|
| SoT | Gherkin under `docs/product/features/` (after step 05; until then charter + this tree bind rewrite work) |
| File mapping | One `e2e/specs/<feature-basename>.spec.ts` per MVP feature basename |
| Titles | `test("Scenario: …")` matches `Scenario:` line **verbatim** |
| Selectors | Proximity/layout only: `getByRole`, `getByLabel`, `getByText`, `filter`, parent walks, `nth` |
| Forbidden | `data-testid`; CSS class selectors; `#id` for tests; production markup added only for tests |
| Exceptions | Native file inputs / file chooser: allowed with `// BDD exception: file-input` comment; prefer role/label first. Date/name-attribute locators are **not** a standing exception — schedule a11y + test fixes in step 04 (gap G7) |
| Coverage gate | Phase “done when” cannot pass with `@skip-no-ui` left on MVP-required scenarios without an explicit plan deferral |
| Ladle | DS stories in `packages/ui`; Theme Overview required; page stories per `ui/design-system.md` |

Also include a short **known coverage gaps** section listing shipped e2e titles vs product features (inventory only).

### 6. Journeys structure

`user-journeys.md` MVP sections: guest→member (Discover home + public detail + auth CTA), subscription/booking/credits, waitlist promotion, payment failure/recovery, cancellation/deletion, admin catalog + support. **Post-MVP** section: partner onboarding/portal/check-in (former Journey 5), clearly labeled.

### 7. Spec deltas are documentation contracts

OpenSpec deltas record that product Gherkin + BDD docs exist with the required content. They do not require code changes in this step. Use **ADDED** requirements (new doc contracts on existing capabilities), not partial MODIFIED of Phase 5 runtime requirements.

### 8. No Radio/Checkbox in scenarios

Describe multi-select / single-select via **Select** (HeroUI) wording, matching UI docs.

## Risks / Trade-offs

- **[Risk] Scenario title churn breaks existing e2e** → Prefer keeping shipped titles when behavior unchanged; when titles must change for sitemap locks, document as known gap for step 04 (do not edit Playwright here).
- **[Risk] Portal scenarios still referenced from admin-partners e2e with `@skip-no-ui`** → Park in post-mvp features; testing doc notes `@skip-no-ui` on post-MVP is fine; MVP “done when” gate applies only to MVP-required scenarios.
- **[Risk] Unshipped booking/waitlist features feel speculative** → Acceptable: charter says specs lead; port migration scenarios aligned to product sitemap/schema.
- **[Risk] CHARTER filename drift (`bdd-playwright` vs `bdd-and-e2e`)** → Amend CHARTER + README in the same change as creating the file.
- **[Trade-off] Combined vs split post-mvp feature files** → Prefer `features/post-mvp/partner-and-checkin.feature` (or keep two files under `post-mvp/`) with a header “Not in MVP”; either is fine if verification `rg` on top-level `features/*.feature` finds no portal requirements.

## Migration Plan

1. Classify each migration `.feature` (keep / rewrite / post-mvp) against charter + sitemap.
2. Inventory shipped `e2e/specs/` Scenario titles vs migration features → draft “known coverage gaps.”
3. Write journeys → MVP features → post-mvp park → `testing/bdd-and-e2e.md` → README + CHARTER filename amend → parent guide checkbox.
4. Run step verification commands.
5. No runtime deploy; rollback = delete new docs under `docs/product/features|testing|product/user-journeys.md` (foundation from step 02 untouched except README/CHARTER filename lines).

## Open Questions

- None blocking. Filename resolved to `bdd-and-e2e.md`. Post-mvp file layout (one combined vs two) left to implementer preference as long as top-level MVP features stay clean.
