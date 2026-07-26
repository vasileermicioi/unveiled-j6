## Context

Parent feature: Image pipeline (`.dev-plan/current-iteration/image-pipeline-parent-guide.md`). Child step 04 — final slice; depends on 01–03 (all done).

Runtime behavior already matches the parent release criteria: five WebP variants (no `original`), open browser decode (incl. SVG rasterize), no 800×420 / 8 MB product gates, required partner logos, client submit guards + localized errors, admin `AdminImageVariantGallery`. What remains stale is the **documentation and verification layer**:

- `docs/product/extras/image-uploads.md` and `schema-overview.md` still describe six JPEG + optional partner logo + min/max gates.
- `admin-events.feature` / `admin-partners.feature` still say six JPEG / optional logo.
- `apps/web/DEPLOYMENT.md` still demos JPEG ≥ 800×420 and six `.jpg` objects.
- Gaps log / i18n inventory / UI maps lag steps 01–03 copy keys and gallery.
- OpenSpec planning mirrors (`admin-events` gallery text) still say six JPEG in places even though `image-uploads` / `partner-catalog` were updated in earlier steps.
- Parent open risk: R2 JPEG→WebP migration script exists (`bun scripts/migrate-r2-jpeg-to-webp.ts`) but may still be **pending run** on staging/production.

Constraints: `docs/product/` is behavioral SoT (AGENTS.md); OpenSpec under `openspec/specs/` is a planning mirror only; BDD proximity/layout selectors only; no new pipeline features; historical gaps-log lines may keep old wording if clearly superseded.

## Goals / Non-Goals

**Goals:**

- Make product SoT, Gherkin, e2e/coverage-matrix, DEPLOYMENT, gaps, i18n inventory, and UI maps describe shipped WebP behavior.
- Sync OpenSpec main specs for the three modified capabilities via this change’s deltas (apply/archive path).
- Resolve or explicitly park residual JPEG migration with an owner note in parent/DEPLOYMENT/gaps.
- Mark step 04 and parent release criteria done.

**Non-Goals:**

- New image-pipeline features (crop UI, Worker resize, MIME allowlists, bulk auto-migration beyond the existing script).
- Partner portal / check-in.
- Reopening Phase 6+ billing/email work.
- Rewriting unrelated CHARTER gap register rows except where image-pipeline decisions must be logged.
- Changing runtime variant generation / gallery / submit-guard code unless a doc/e2e mismatch reveals a clear bug from 01–03 (prefer fix-forward only if verification fails).

## Decisions

1. **Product SoT rewrite order (docs first, then BDD, then e2e)**
   - **Choice:** Rewrite `image-uploads.md` end-to-end as the contract spine, then patch `schema-overview.md`, then feature files, then gaps/i18n/UI maps, then DEPLOYMENT, then Playwright + coverage-matrix. Mirror OpenSpec deltas last (or in parallel with feature files).
   - **Rationale:** Step brief; agents read `image-uploads.md` first; e2e should assert the same language Gherkin uses.
   - **Alternatives:** Patch e2e before docs — leaves SoT lying; only update OpenSpec — violates AGENTS.md SoT preference.

2. **`image-uploads.md` content contract (what “rewrite” means)**
   - **Choice:** Replace current JPEG/six-variant/optional-logo/800×420/8 MB sections with: five WebP filenames; no original master; decode-success acceptance (incl. SVG → canvas → WebP, never store raw SVG); client Pica + server validate/store; JS required; required event primary + required partner logo; client errors block submit; variant preview gallery; gallery photos use same five-WebP pipeline; abuse/DoS proxy caps called out separately from removed product gates. Keep useful structure (storage layout, variant table, admin UX, cleanup) where it still fits.
   - **Rationale:** Step Spec Delta + parent release criteria.
   - **Alternatives:** Minimal search-replace JPEG→WebP — leaves contradictory sections (min size, original master).

3. **Historical gaps-log lines stay; mark supersession explicitly**
   - **Choice:** Do not rewrite old “six JPEG” decision rows into falsehoods. Append new decision rows (or annotate) stating WebP five-variant / required logo / client errors / gallery supersede those entries. Doc-grep verification allows historical changelog lines that clearly mark superseded decisions.
   - **Rationale:** Step verification note; audit trail.
   - **Alternatives:** Delete historical rows — loses decision history; silent rewrite of old rows — confuses chronology.

4. **Gherkin alignment: required logo + five WebP wording**
   - **Choice:** Update `admin-partners.feature` so create scenarios require logo (drop “optionally a logo” / “omitting both leaves without a logo”). Update `admin-events.feature` header/comments and gallery steps from “six JPEG” → “five WebP”. Touch `event-discovery.feature` only if it still claims JPEG variants. Keep scenario titles stable where possible so coverage-matrix rows stay mappable; rename only when the scenario meaning changes (optional → required).
   - **Rationale:** Step brief Spec Deltas; coverage-matrix couples titles to Playwright.
   - **Alternatives:** Leave scenario titles and only fix comments — BDD SoT still wrong for agents.

5. **Playwright: assert WebP; keep R2 skip; require logo on partner create helpers**
   - **Choice:** Update selectors/assertions from `.jpg` → `.webp` where present; ensure `createPartnerViaUI` / admin fixtures always attach a logo on create happy paths; add or tighten a create-without-logo rejection case only if cheap and not flaky (client block is enough — prefer asserting blocked submit or server error with proximity selectors). Keep `test.skip` when R2 vars missing; document in e2e README / coverage-matrix notes if wording still says “six R2 vars” for env presence (env var *count* may stay six — that is infrastructure, not JPEG variant count).
   - **Rationale:** Proximity selectors; existing skip pattern; avoid conflating “six R2 env vars” with “six JPEG variants.”
   - **Alternatives:** Fail hard without R2 — breaks CI; invent new skip taxonomy — unnecessary.

6. **i18n inventory + UI maps for step 03 keys**
   - **Choice:** Add parent-listed keys to `content-i18n-inventory.md`: `imageRequiredError`, `imageUndecodableError`, `imageWebpUnsupportedError`, `imageIncompleteVariantsError`, `imageProcessingSubmitBlocked`, `imageVariantGalleryLabel`, plus refreshed `imageUploadHint` / `imageProcessingError`. List `AdminImageVariantGallery` (or shipped name) in `ui-component-map.md` / `docs/COMPONENTS.md` if those inventories catalog admin islands.
   - **Rationale:** Parent open question for step 04; prevents orphan copy.
   - **Alternatives:** Skip inventory — agents miss keys on next i18n pass.

7. **Residual R2 JPEG migration: run-or-park with owner**
   - **Choice:** Confirm whether staging/production buckets still have `.jpg` keys. If yes and credentials available in this session’s env, run `bun scripts/migrate-r2-jpeg-to-webp.ts` (prefer `--dry-run` first) and document in DEPLOYMENT. If not runnable here, park explicitly in parent Risks + DEPLOYMENT with owner = staging operator / next deploy checklist — do **not** reintroduce JPEG URL fallbacks in app code.
   - **Rationale:** Parent non-goal allows deferral only when recorded; silent ignore leaves 404s.
   - **Alternatives:** Auto-fallback to `.jpg` in `buildVariantUrl` — rejected by pipeline cutover; force migration in CI — needs secrets.

8. **OpenSpec mirror sync is part of apply, not a second SoT**
   - **Choice:** Landing this change updates `openspec/specs/{image-uploads,admin-events,partner-catalog}` via the usual archive/sync path so planning mirrors stop saying six JPEG. Implementers still treat `docs/product/` as authoritative when they diverge.
   - **Rationale:** AGENTS.md; proposal Capabilities list.
   - **Alternatives:** Skip OpenSpec updates — leaves drift in `openspec/specs/admin-events`.

## Risks / Trade-offs

- **[Risk] Doc grep false positives on historical gaps rows** → Mitigation: Decision 3; grep focused SoT paths; allow clearly superseded changelog wording.
- **[Risk] Coverage-matrix title drift after Gherkin renames** → Mitigation: Decision 4 — prefer stable titles; update matrix rows in the same PR when titles change.
- **[Risk] Staging still serves broken `.jpg` URLs after docs claim WebP-only** → Mitigation: Decision 7 run-or-park; do not claim “migration complete” in DEPLOYMENT unless verified.
- **[Risk] CHARTER / assets-inventory still mention JPEG in old-app narrative** → Mitigation: Update only when they claim *rewrite* current behavior; leave accurate “old app SELECT JPEG” history.
- **[Trade-off] Broad DEPLOYMENT JPEG→WebP edits vs minimal section patch** → Prefer updating all *current-procedure* image sections (demo seed, R2 layout, admin smoke) so operators are not misled; leave unrelated Phase history intact.
- **[Trade-off] No runtime feature work** → If e2e reveals a real 01–03 bug, fix narrowly; do not expand into new UX.

## Migration Plan

1. Land doc + Gherkin + e2e + DEPLOYMENT + inventory updates (no schema migration expected).
2. Sync OpenSpec main specs from this change’s deltas when applying/archiving.
3. Run or park R2 JPEG→WebP migration; note outcome in DEPLOYMENT + parent guide.
4. Mark step 04 + parent release criteria done.
5. Rollback: revert the docs/e2e commit(s); runtime pipeline unchanged by this step’s happy path.

## Open Questions

- None blocking for planning. Residual migration run depends on whether staging R2 credentials are available at apply time — Decision 7 covers both outcomes.
