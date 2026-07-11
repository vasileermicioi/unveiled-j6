## Context

Phases 0–5 are implemented. Product behavior still lives in `docs/migration/` (migration extract) and delivery in `.dev-plan/IMPLEMENTATION-PLAN.md` (phases through partner/admin ops). Parent feature `mvp-spec-rewrite` rewrites specs into `docs/product/` + `IMPLEMENTATION-PLAN.mvp.md` over five steps; this is step 01 — charter only.

Known contradictions and drift (evidence for the charter gap register):

| Gap | Evidence |
|---|---|
| `/events/:id` auth vs SEO | `sitemap/sitemap.md` lists USER auth; `extras/seo-and-metadata.md` marks bookable detail indexable; `AGENTS.md` already says public detail |
| Discover vs Events | Shipped `/:locale` index is Discover (`getPageContent(..., "discover")`); migration still documents separate `/` landing + `/discover`; member feed is gated `/events` |
| Ladle ownership | `packages/ui`: 1 story (`EventCard`); `apps/web`: 43 stories; `ThemeDecorator` imports `apps/web/app/styles/globals.css` |
| BDD selectors | ~25 `page.locator(...)` usages in e2e (mostly `input[name=…]` + file inputs) vs ~135 `getByRole` |
| Partner in MVP language | Migration features include `partner-portal.feature`, `checkin.feature`; plan phases 8–9 |

Constraints: docs-only; do not edit `AGENTS.md`, old plan, or feature files; do not copy the full migration tree yet.

## Goals / Non-Goals

**Goals:**

- Produce a decisive `docs/product/CHARTER.md` that later steps treat as binding.
- Stub `docs/product/README.md` clarifying WIP / not yet SoT.
- Lock the six decisions from the step brief with enough specificity that step 02 can encode sitemap/UI/schema without re-asking.
- Mark step 01 done in the parent guide.

**Non-Goals:**

- Rewriting sitemap, features, journeys, schema overview, or implementation plan.
- Moving Ladle stories or changing theme CSS ownership in code.
- Deleting or archiving `docs/migration/`.
- Implementing booking, Stripe, waitlist, or partner portal.

## Decisions

### 1. Charter lives at `docs/product/CHARTER.md`; folder is the future SoT

New canonical product-spec root is **`docs/product/`** (not `docs/migration/`). Step 01 creates only README + CHARTER. Full tree lands in 02–03; SoT switch in 05.

**Alternative considered:** Keep extending `docs/migration/` in place — rejected; migration framing and partner-in-MVP language are the problem being fixed.

### 2. MVP personas: guest / member / admin; partner post-MVP

- **Guest** — unauthenticated.
- **Member** — `USER` role.
- **Admin** — `ADMIN` role.
- **Partner (`PARTNER`)** — post-MVP: no partner login, portal, or check-in UI in MVP docs or `IMPLEMENTATION-PLAN.mvp.md` phases. Venue/`partners` records remain for admin-managed events and public display.

**Alternative considered:** Keep partner portal in MVP because Phase 8 exists in the old plan — rejected per parent guide release criteria.

### 3. Public event detail; member-gated feed

- `/events/:id` is **public** (no auth). Indexable when bookable (future + remaining capacity); sold-out/past use `noindex` per existing SEO rules.
- Booking, waitlist, save, and member feed (`/events`, `/events/map`, `/saved`) stay gated.
- Aligns shipped intent in `AGENTS.md` and SEO doc; sitemap auth row is a documented gap for step 02 to fix.

**Alternative considered:** Auth-gate detail for “membership exclusivity” — rejected; breaks SEO/social share (explicit user issue).

### 4. Discover → Events navigation (locked guest path)

**Shipped fact:** locale home `/:locale` **is** Discover (marketing + curated upcoming preview). Legacy `/discover` may redirect; do not invent a third home.

**Locked journey:**

1. Guest lands on Discover (`/:locale`).
2. Preview cards link to public `/events/:id` (“See details”).
3. Path to the full browse experience: primary CTA to **signup/login**; after auth (+ onboarding if incomplete), land on member `/events`.
4. Guests do **not** get a public full upcoming-events list equivalent to `/events` in MVP. SEO long-tail is via public detail pages + Discover, not an ungated feed.

Step 02 must encode this in sitemap + copy (nav labels, CTAs) without reopening “public browse list vs auth CTA.”

**Alternative considered:** Public `/events` list for guests (matches SEO table listing `/events` as indexable) — rejected for MVP to preserve membership-gated discovery and match shipped Phase 5 guards; step 02 may note SEO doc row for `/events` as member-only `noindex` correction.

### 5. Design system ownership

- `@unveiled/ui` owns shared primitives **and all Ladle stories for design-system primitives**.
- Theme tokens + **Theme Overview** Ladle story live under `packages/ui`.
- Page compositions may stay in `apps/web` (with optional page stories), but DS primitives must not be story-only in the app.
- Visual rules unchanged: HeroUI-only markup; Uber reskin — yellow `#FAFF86`, near-zero radius, no drop shadows, Work Sans; theme changes via `globals.css` / tokens only.
- Code move of existing `apps/web` stories is **scheduled in the new plan** (step 04), not executed in this feature.

**Alternative considered:** Declare `apps/web` the Ladle home because most stories are there — rejected; package boundary and ThemeDecorator cross-import are the drift to correct.

### 6. BDD / Playwright contract

- Every shipping MVP `features/*.feature` scenario MUST have a Playwright test whose title is `Scenario: …` verbatim.
- Selectors: proximity/layout only — `getByRole`, `getByLabel`, `getByText`, `filter`, parent walks, `nth`.
- **Non-compliant:** `page.locator('css…')`, `page.locator('input[name=…]')`, and `data-testid` except documented exceptions.
- **Exception policy (locked):** `input[type=file]` / file chooser setInputFiles may use a name- or label-adjacent locator when HeroUI/React Aria does not expose a stable role for the control; each exception MUST be commented in the test file with `// BDD exception: file-input`. Date/time native inputs SHOULD prefer `getByLabel` once labels exist; until forms are fixed, charter lists current `input[name=…]` date fields as a **gap owned by later plan work**, not a standing exception.

### 7. Artifact paths

- New plan: `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` (created in step 04).
- Old `docs/migration/` and `IMPLEMENTATION-PLAN.md` retained as historical; new work uses `docs/product/` after step 05.
- Cite `.dev-plan/openspec_5step_proposals_guide.v2.md` in the new plan (not v1).

### 8. Charter document structure

`CHARTER.md` MUST include: Purpose & success criteria; Source inventory; Gap register (severity); Locked decisions (expanded six); Target `docs/product/` tree; Migration→product mapping (port / rewrite / drop); Post-MVP parking lot. Prefer path citations over vague complaints.

## Risks / Trade-offs

- **[Risk] Guest browse feels thin without public `/events`** → Mitigation: Discover preview + public detail + clear auth CTA; revisit post-MVP if SEO demands a public list.
- **[Risk] SEO doc still lists `/events` as indexable** → Mitigation: charter + step 02 correct to member-only `noindex`; detail pages remain the indexable catalog surface.
- **[Risk] Charter ignored if AGENTS.md still points at migration** → Mitigation: step 05 flips pointers; README stub states WIP until then; Locked decisions still bind 02–04 authors.
- **[Risk] Over-scoping charter into full rewrite** → Mitigation: hard file allowlist (README + CHARTER only); verification commands only check those files.
- **[Trade-off] Partner features exist in migration but are parked** → Explicit parking lot + “drop for MVP” mapping rows so they are not silently deleted from institutional memory.

## Migration Plan

1. Create `docs/product/`.
2. Write `CHARTER.md` and `README.md`.
3. Run verification: files exist; `rg` hits for Locked decisions / personas / Theme Overview / proximity; partner explicitly post-MVP.
4. Check off step 01 in `mvp-spec-rewrite-parent-guide.md`.
5. Rollback: delete `docs/product/` and revert parent-guide checkbox (no runtime impact).

## Open Questions

- _(none blocking)_ — guest browse path, personas, public detail, DS ownership, and BDD exceptions are locked above. Step 02 may still reconcile Discover nav label vs locale-home URL as a documentation detail, not a product reopen.
