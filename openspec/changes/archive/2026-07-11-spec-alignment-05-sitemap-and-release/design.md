## Context

Phase 5.5 final step (workstream **C** + release). Steps 01–04 are marked done in the parent guide. Product SoT for journeys:

- `docs/product/sitemap/sitemap.md` — Discover = locale home; legacy `/discover` 301; public `/events/:id`; gated `/events`
- `docs/product/features/static-pages.feature`, `event-discovery.feature`
- `docs/product/CHARTER.md` Locked §2–3
- Coverage matrix + named deferrals from step 04 (`docs/product/testing/coverage-matrix.md`)

**Pre-step inventory (code already present):**

| Check | Current state |
|---|---|
| `/:locale` = Discover | `[locale]/index.tsx` renders Discover marketing + curated preview |
| `/:locale/discover` → home | `[locale]/discover.tsx` → `c.redirect(\`/${locale}\`, 301)` |
| Bare `/discover` | **Likely missing** — only locale-scoped route exists; sitemap lists `/discover` → `/:locale` |
| `/events/:id` public | `[locale]/events/[id].tsx` — no auth gate for GET |
| `/events` gated | Member feed + middleware redirect guests to auth |
| Discover preview CTA | EventCard → public `/events/:id` |
| Discover browse CTA | `signup?returnTo=/:locale/events` (step 04) |
| Onboarding finish → returnTo | Still lands on `/membership` — named deferral (step 05 / Phase 8) |
| `DEPLOYMENT.md` Phase 5.5 | **Missing** — Phase 5 section exists; need Phase 5.5 close-out |
| Staging URL | Still TBD / operator-dependent in DEPLOYMENT.md |

Canonical product behavior stays in `docs/product/`; this OpenSpec change is planning-only for `/opsx:apply`.

## Goals / Non-Goals

**Goals:**

- Spot-check sitemap/journey alignment; fix drift only if found (minimal diffs)
- Ensure bare `/discover` 301 matches sitemap if it currently 404s
- Update `DEPLOYMENT.md` Phase 5.5 (demo script, staging note, “already aligned” if no code fixes)
- Deploy to staging; smoke Discover + public detail
- Finalize parent guide release criteria + consolidated named deferrals
- Hard stop before Phase 6

**Non-Goals:**

- `sitemap.xml` SEO polish (Phase 8)
- Partner portal / check-in
- Stripe, booking, waitlist, profile/billing, Resend, `packages/billing`
- Implementing onboarding auto-`returnTo` (keep as named deferral unless a one-line fix is trivial and already intended)
- Typography utility cleanup (step 02 deferral → Phase 8)
- Auth GDPR / Google OAuth e2e (deferred → Phase 8)
- Reopening CHARTER Locked decisions

## Decisions

### 1. Prefer document-over-refactor when already aligned

- **Choice:** After spot-check, if Discover home, locale `/discover` 301, public detail, gated feed, and CTA hrefs match the sitemap, make **no** drive-by refactors — write an explicit “already aligned” note in the PR and Phase 5.5 `DEPLOYMENT.md` section.
- **Rationale:** Step plan Scope & Conventions; reduces merge risk before Phase 6.
- **Alternatives:** Opportunistic cleanup of Discover typography utilities — rejected (named deferral to Phase 8).

### 2. Bare `/discover` — add minimal root redirect if missing

- **Choice:** During spot-check, `curl -I` / browser `/discover`. If 404, add a root route (sibling to `routes/index.tsx`) that 301s to `/${parseAcceptLanguage(...)}` — same locale resolution as `/`. Do **not** invent a third Discover page.
- **Rationale:** Sitemap table lists `/discover` → `/:locale`; locale-scoped `[locale]/discover.tsx` already covers `/:locale/discover`.
- **Alternatives:** Document “use `/:locale/discover` only” and change sitemap — rejected; prefer code match docs. 302 instead of 301 — rejected; sitemap says 301.

### 3. Onboarding returnTo polish stays a named deferral unless trivial

- **Choice:** Do **not** expand step 05 into onboarding redirect redesign. Keep matrix note: CTA → `signup?returnTo=/events` is correct; post-onboarding still → membership unless a one-line already-supported returnTo handoff exists and is safe. Target Phase 8 (or tiny follow-up) in parent Risks.
- **Rationale:** Step 04 already marked this; release gate allows named deferrals; Phase 6 must not wait on polish.
- **Alternatives:** Implement full returnTo-through-onboarding in this step — out of scope creep.

### 4. Named deferrals inventory for parent close-out

- **Choice:** Finalize this list in the parent guide (and leave matrix Notes as-is unless wrong):

  | Id | Reason | Target |
  |---|---|---|
  | Auth Google OAuth + GDPR scenarios | `@skip` / empty stubs | Phase 8 |
  | Onboarding finish ignores `returnTo=/events` | lands on `/membership` | Phase 8 (or tiny follow-up) |
  | UI typography utilities on page compositions | `font-semibold` / `uppercase` / etc. on HeroUI Paragraph | Phase 8 polish |
  | Onboarding fixture `label.filter` proximity-adjacent | left in step 03 | Phase 8 polish |
  | Booking / credits / waitlist / profile / admin-users e2e | unshipped features | Phases 6–8 |
  | Partner portal / QR | post-MVP `@skip-no-ui` | Post-MVP |

- **Rationale:** Parent release criteria allow “complete with named deferrals.”

### 5. DEPLOYMENT.md Phase 5.5 section shape

- **Choice:** Append a **Phase 5.5 — Spec alignment** section after Phase 5 covering: Theme Overview in Ladle; guest Discover → public detail smoke; locale `/discover` 301; e2e titles match Gherkin / matrix; staging URL or deploy note; explicit “no Stripe/booking started”; pointer to parent guide + coverage matrix for deferrals. Env vars unchanged unless steps 01–04 required any (they did not for deploy secrets).
- **Rationale:** Matches step deliverables and AGENTS.md phase workflow.

### 6. Staging deploy practice

- **Choice:** Run `bun run deploy:workers` per project practice when credentials available; record Workers URL / date in `DEPLOYMENT.md`. If operator token missing, document the block in DEPLOYMENT.md and still complete code/docs/e2e locally — flag staging as operator action, not silent skip of the release criteria checkbox without a named deferral.
- **Rationale:** Prior phases already note `CLOUDFLARE_API_TOKEN` dependency; release criteria require staging evidence.

### 7. Phase 6 hard-stop verification

- **Choice:** Before marking parent complete, `rg` for new `packages/billing`, booking POST routes, Stripe/Resend env usage introduced in this change — expect none. Do not open Phase 6 proposals in the apply session.
- **Rationale:** Step plan Validation + Spec Delta release gate.

## Risks / Trade-offs

- **[Risk] Bare `/discover` missing** → Mitigation: Decision 2 one-file redirect.
- **[Risk] Staging token unavailable** → Mitigation: Decision 6 — document blocker; do not fake a staging URL.
- **[Risk] Spot-check finds unexpected CTA drift** → Mitigation: minimal href/middleware fix only; no redesign.
- **[Risk] Treating returnTo polish as blocking** → Mitigation: Decision 3 named deferral.
- **[Trade-off] Document vs fix** → Prefer document when aligned; only fix true sitemap violations.

## Migration Plan

1. Spot-check routes + CTAs (manual + existing e2e).
2. Fix bare `/discover` and any other confirmed drift.
3. Update `DEPLOYMENT.md` Phase 5.5; finalize parent guide checkboxes + deferrals.
4. Run lint, typecheck, stories, e2e.
5. Deploy staging; record evidence.
6. Mark step 05 + parent complete (with named deferrals if any).
7. Rollback: revert redirect/CTA diffs + DEPLOYMENT notes; no schema/migrations.

## Open Questions

- None blocking apply — staging credential availability may affect the deploy checkbox; handle per Decision 6.
