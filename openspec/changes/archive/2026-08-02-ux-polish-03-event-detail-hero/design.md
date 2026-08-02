## Context

Parent feature: UX polish (`.dev-plan/current-iteration/ux-polish-parent-guide.md`), step 03 — event-detail hero framing (no stretch-to-fill).

Current state:

- **Markup:** `EventDetailPage` renders primary hero as HeroUI `Surface.event-detail--checkout__hero` wrapping a native `<img class="event-detail--checkout__hero-image">` (documented image exception). Media row is full-width stack (hero then Markdown description).
- **Theme:** `.event-detail--checkout__hero` is `width: 100%`. `.event-detail--checkout__hero-image` uses `width: 100%`, `max-width: none`, `height: auto`, `object-fit: contain` — forces the image to span the band even when intrinsic width is narrower, which reads as stretch-to-fill rather than centered natural sizing.
- **Legacy:** Unused `.event-detail__hero-image` still sets `aspect-ratio: 16/9` + `object-fit: cover` in `globals.css` (no TSX references).
- **Docs:** `ui-component-map` Event detail notes “full-width primary hero (`object-fit: contain`)” but does not state centered / non-stretch framing.

Constraints: theme-only visuals (AGENTS §8–9); HeroUI `Surface` + `<img>` exception; no gallery / pipeline / EventCard changes; independently mergeable vs other ux-polish steps; proximity-only e2e.

## Goals / Non-Goals

**Goals:**

- Full-width rectangular hero frame (band spans the detail content width).
- Primary image horizontally centered inside that frame; aspect ratio preserved; not stretched to fill.
- `max-width: 100%` (and optional `height: auto`) allowed so wide images downscale without overflow.
- Framing rules owned by theme CSS; routes do not add ad-hoc stretch/cover utilities.
- Align `ui-component-map` (+ gaps note if useful), EventDetail stories, and e2e only if old sizing was asserted.
- Mark step done in the parent guide after verification.

**Non-Goals:**

- Gallery slider / `event_gallery_images`; image pipeline or variant ladder changes.
- EventCard cover crop behavior; Discover / feed card layouts.
- Restoring lg+ side-by-side hero|description columns (separate layout concern; out of this step).
- `ux-polish-04`–`05`; partner portal; Phase 6+ booking changes.

## Decisions

1. **Theme CSS owns the framing contract; markup only if centering needs structure**
   - **Choice:** Fix `.event-detail--checkout__hero` / `__hero-image` in `globals.css`. Prefer: frame `width: 100%` + center children (`display: flex; justify-content: center` or equivalent); image `width: auto; max-width: 100%; height: auto;` keep border/cream background on the image (or frame) as today. Touch `EventDetailPage.tsx` only if a structural class is required for centering — no Tailwind color/object-fit utilities on the route.
   - **Rationale:** Step plan + design-system delta; AGENTS theme-only visuals.
   - **Alternatives:** `object-fit: contain` inside a fixed aspect box with `width: 100%` (rejected — still forces a fill box and letterboxes oddly); keep `width: 100%` + contain (rejected — contradicts centered non-stretch).

2. **Do not force a fixed hero aspect ratio**
   - **Choice:** No `aspect-ratio` / `object-fit: cover` on the checkout hero. Intrinsic aspect wins; downscale via `max-width: 100%` only.
   - **Rationale:** Parent guide: “don’t resize” / no stretch-to-fill; cover+ratio is the old stretch-fill pattern.
   - **Alternatives:** Locked 16:9 band with contain letterboxing (rejected for this step — not in the brief).

3. **Retire dead `.event-detail__hero-image` cover rule**
   - **Choice:** Remove or neutralize the unused `.event-detail__hero-image` block in source `globals.css` so cover/16:9 cannot be reattached by mistake. Do not chase compiled `public/assets/globals.css` by hand (build artifact).
   - **Rationale:** Dead CSS with the wrong contract is a footgun.
   - **Alternatives:** Leave unused rule (rejected — confusing vs new contract).

4. **Docs + stories in the same change; e2e opportunistic**
   - **Choice:** Update Event detail row in `ui-component-map.md` to state full-width frame, centered image, no stretch-to-fill (`max-width: 100%` OK). Refresh EventDetail Ladle stories if visual defaults need a non-banner-ish fixture note. Grep Playwright for hero width/object-fit assertions; change only if present.
   - **Rationale:** `docs/product/` is SoT; step plan says e2e only if old sizing was asserted.
   - **Alternatives:** Defer docs (rejected — parent release criteria).

5. **Canonical product docs over archived OpenSpec alone**
   - **Choice:** Ship behavior + `docs/product/` updates together; OpenSpec deltas archive with the change.
   - **Rationale:** AGENTS: ignore `openspec/specs/` as product SoT; still keep deltas for the change workflow.

## Risks / Trade-offs

- **[Risk] Very tall portrait heroes make the page very long** → Mitigation: accept intrinsic height (brief forbids stretch-fill); do not reintroduce cover crop in this step.
- **[Risk] Wide banner images look unchanged (still full-width via max-width)** → Mitigation: expected; visual smoke should use a non-16:9 / narrower asset to prove centering.
- **[Risk] Implementer “fixes” with Tailwind `object-cover` / `w-full` on the img** → Mitigation: design-system requirement + code review against theme-only rule.
- **[Trade-off] Cream/border chrome may sit tightly on the image rather than a tall empty frame** → Acceptable; frame is the full-width band, not a forced letterbox.

## Migration Plan

1. Update hero theme CSS (+ minimal markup if needed); remove dead cover rule.
2. Align `ui-component-map` / gaps + EventDetail stories; touch e2e only if asserted.
3. Run lint + typecheck; visual smoke (centered, not stretch-filled).
4. Mark `ux-polish-03-event-detail-hero` done in `ux-polish-parent-guide.md`.
5. Rollback: revert PR (CSS/docs/stories only; no schema).

## Open Questions

- None blocking. Exact flex vs `margin-inline: auto` centering is an apply-time detail as long as the visual contract holds.
