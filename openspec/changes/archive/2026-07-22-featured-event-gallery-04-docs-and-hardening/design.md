## Context

Parent feature: Featured Event Gallery (`.dev-plan/current-iteration/featured-event-gallery-parent-guide.md`). Steps 01–03 are done:

- Schema + domain: `event_gallery_images`, `listEventGalleryImages` / `addEventGalleryImages` / `removeEventGalleryImages`, max 12
- Admin SSR: `/:locale/admin/events/:id/gallery*` (list / multi-add / remove confirm)
- Public: `EventDetailPage` end-of-page gallery + `EventGallerySlider` island; empty gallery omits section; **not** gated on Discover featured membership

Gaps vs releasable:

- `docs/product/features/*.feature` lack gallery scenarios (openspec specs already describe behavior)
- `ui-component-map.md`, `content-i18n-inventory.md`, `image-uploads.md` §9 still omit or contradict galleries
- `gaps-and-decisions.md` still lists “featured-only display” as an open parent-guide question
- Demo seed features three titles but attaches **zero** gallery images
- Playwright has admin-events + event-discovery specs but no gallery scenarios
- JSON-LD/OG gallery expansion was deferred in step 03 — remains deferred (SEO polish later)

Constraints: product SoT is `docs/product/` (not `openspec/specs/`); proximity selectors only; SSR mutations; HeroUI-only markup; no partner portal; no drag-and-drop reorder; no new resize pipeline.

## Goals / Non-Goals

**Goals:**

- Align `docs/product/` (features, sitemap notes, UI map, i18n inventory, image-uploads, decisions) with shipped gallery behavior.
- Seed ≥2 gallery images on at least one upcoming featured demo event.
- Playwright happy paths for admin add/remove + public slider **or** documented demo script + named skip reasons.
- Narrow polish for max-cap/empty/error copy and slider a11y if gaps found.
- Mark parent feature releasable.

**Non-Goals:**

- Expanding Event JSON-LD / Open Graph to all gallery images (keep primary hero for OG/JSON-LD unless a separate SEO change mandates it).
- Discover card multi-image carousels; drag-and-drop reorder; partner portal gallery.
- New `@unveiled/images` resize work (`client-image-resize`).
- Reopening hero `events.image_id` semantics.

## Decisions

1. **Featured-only display — closed decision**
   - **Choice:** Public detail shows gallery whenever `listEventGalleryImages` is non-empty for that event. **Do not** gate on `featured_events` membership. Document in `gaps-and-decisions.md` under Discovery & personalization (and/or Image uploads) with refs to feature files + schema.
   - **Rationale:** Already shipped in step 03; simplest rule; storage is per-event; Discover featured remains a curation surface, not a gallery gate.
   - **Alternatives:** Featured-only display (rejected — more special cases, hides stocked galleries on non-featured detail URLs).

2. **Product Gherkin ownership**
   - **Choice:** Add scenarios to existing `admin-events.feature` and `event-discovery.feature` (not a new feature file). Mirror openspec gallery requirements with proximity-friendly wording; Scenario titles MUST be stable for Playwright `test()` titles.
   - **Rationale:** Step brief Spec Deltas; keeps gallery under existing domains.
   - **Alternatives:** New `event-gallery.feature` (unnecessary split for MVP).

3. **Docs sync surface**
   - **Choice:**
     - Sitemap: gallery admin rows already present — verify only; fix if drift.
     - UI component map: extend **Event detail** row for end-of-page gallery + slider island; add/extend admin Events row for Gallery manage links.
     - `content-i18n-inventory.md`: inventory DE/EN keys already in `admin-content.ts` + `event-detail-gallery-copy.ts`.
     - `image-uploads.md` §9: remove “galleries out of scope”; point at `event_gallery_images` + primary hero unchanged; cleanup rules include gallery remove/event delete.
     - Schema overview: verify max-12 + relationships; edit only if gaps remain.
   - **Rationale:** Step deliverables; agents must find gallery without tribal knowledge.
   - **Alternatives:** Docs-only PR without seed/e2e (fails parent release criteria).

4. **Demo seed gallery strategy**
   - **Choice:** After creating events + featuring `DEMO_FEATURED_TITLES`, attach ≥2 gallery images to **one** featured upcoming title (prefer `DEMO_DISCOVERY_TITLES.tonight` or `theaterFuture`). Persist via existing seed prebuilt path (`persistPrebuiltImage` / `readSeedPrebuilt`) using **other** demo event `imagePath` fixtures (distinct files) then `addEventGalleryImages`. Do **not** reuse the same `images.id` as the event hero (hero FK + gallery join are separate rows). Pause between persists like other seed uploads if R2 rate-limits apply.
   - **Rationale:** Guarantees staging/demo slider without new photography pipeline; reuses baked variants under `public/images/seed/`.
   - **Alternatives:** Admin-only manual upload for demos (fragile); new dedicated gallery fixture pack (more bake work — only if reuse fails).

5. **E2E vs demo script**
   - **Choice:** Prefer extending `e2e/specs/admin-events.spec.ts` and `e2e/specs/event-discovery.spec.ts` with verbatim Scenario titles:
     - Admin: multi-upload (≥2 files via existing `SAMPLE_EVENT_IMAGE` / second fixture), list shows photos, remove one via confirm, optional capacity skip if hard to drive.
     - Public: guest opens seeded featured event detail → gallery section → open slider → next/prev (proximity: heading “Gallery”/“Galerie”, buttons by aria-label).
     - Skip with reason when `!r2Configured()` / `!hasAdminCredentials()` / `!hasDatabaseUrl()` as today.
     - Update `coverage-matrix.md` rows for new scenarios.
     - If a path is too brittle (e.g. multi-file Pica island), document manual demo steps in `apps/web/DEPLOYMENT.md` and matrix as named skip — still satisfy release criteria via parent demo script.
   - **Rationale:** Repo already has the two feature hooks; BDD contract forbids CSS-class fishing.
   - **Alternatives:** New `event-gallery.spec.ts` only (OK if cleaner; still map matrix to feature files).

6. **SEO / JSON-LD**
   - **Choice:** Explicitly leave gallery images out of JSON-LD/`og:image` this step; document as deferred in parent guide / gaps note if helpful. Primary hero remains SEO image.
   - **Rationale:** Step 03 deferred; SEO polish is a separate concern; avoids scope creep.
   - **Alternatives:** Add all gallery URLs to JSON-LD now (larger SEO change — out of scope).

7. **Copy / a11y polish bar**
   - **Choice:** Only fix clear gaps: missing max-cap message surface, empty list CTA clarity, slider prev/next/close labels incompleteness. No redesign.
   - **Rationale:** Hardening slice, not a UI rewrite.

## Risks / Trade-offs

- **[Risk] Seed reuses another event’s image bytes → visually duplicate gallery** → Mitigation: pick two distinct fixture `imagePath`s; acceptable for demo; note in DEPLOYMENT if needed.
- **[Risk] Multi-file Pica admin e2e flakes** → Mitigation: named skip + manual demo script; still seed public path for guest slider e2e.
- **[Risk] Docs drift vs openspec/specs** → Mitigation: update `docs/product/` as SoT; openspec delta is planning contract only (AGENTS.md).
- **[Risk] Existing DBs already seeded without gallery** → Mitigation: document `seed:demo --force` (or equivalent) for staging refresh; e2e that depends on gallery may call a fixture helper to attach images when seed is old.
- **[Trade-off] No JSON-LD gallery** → Mitigation: parent guide notes deferral; hero OG unchanged.

## Migration Plan

1. Update product docs + decisions + i18n inventory + image-uploads cross-links.
2. Extend demo seed with gallery images on one featured event; verify with local `seed:demo`.
3. Add/adjust Playwright + coverage matrix; or write DEPLOYMENT demo script.
4. Polish copy/a11y if needed.
5. `bun run lint`, `bun run typecheck`, touched e2e when env allows.
6. Mark step 04 + parent feature releasable; note `client-image-resize` satisfied if shipped.
7. Rollback = revert docs/seed/e2e/copy commits; no schema migration in this step.

## Open Questions

- None blocking. Prefer `tonight` as the seeded gallery host unless e2e title helpers make another featured title cheaper — implementer may choose any of `DEMO_FEATURED_TITLES` as long as ≥2 gallery images land on an upcoming featured event.
