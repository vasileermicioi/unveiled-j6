## Context

Steps 01–04 of Event Detail UX are shipped and archived:

| Step | Shipped truth |
|---|---|
| 01 | Identity + checkout tops align on lg; responsive hero fills identity column |
| 02 | Below-fold DETAILS is a dense multi-column grid; LOCATION chrome tightened |
| 03 | MapLibre markers use brand pin (`.event-map__marker` + SVG), not a black square |
| 04 | Guest qty max 3; signed-in max = `min(floor(credits / creditPrice), remainingCapacity)` via `maxBookableTickets` |

Product SoT and coverage still lag:

| Surface | Stale / missing | Shipped truth |
|---|---|---|
| `booking.feature` Background | “ticket count between 1 and 3” for everyone | Members: credits ∩ capacity; guests preview 1–3 |
| `event-discovery.feature` | Checkout identity + summary only | Also dense DETAILS, pin marker, dynamic qty |
| `ui-component-map.md` Event detail | Checkout layout; no 01–04 layout/qty notes | Aligned columns, hero, dense DETAILS, pin, qty bounds |
| Ladle `EventDetailPage` | Guest / Eligible (`maxQty={8}`) / sold-out / gates | Confirm guest default max 3; add metadata-grid story if missing |
| Ladle `EventMap` | `MarkerPinChrome` present | Confirm only; fill gap if pin chrome missing |
| Playwright | Guest detail checkout card; no qty > 3 / DETAILS / pin asserts | Stable proximity + marker class/aria; skip map if consent blocks CI |
| Parent guide | Step 05 open; 01–04 marked done | Mark 05 done; release criteria checkable |

Constraints: product SoT is `docs/product/` (do not treat `openspec/specs/` as agent SoT); proximity e2e selectors per `bdd-and-e2e.md`; no new product features; HeroUI-only UI already shipped.

## Goals / Non-Goals

**Goals:**

- Align Gherkin, UI component map, Ladle stories, and Playwright with shipped 01–04 behavior.
- Make parent **Release Criteria** checkable (docs + tests + manual feedback PNGs).
- Document any CI-only map/consent skips with owner/follow-up.

**Non-Goals:**

- Re-opening layout/marker/qty design debates or changing `maxBookableTickets` rules.
- Partner portal / check-in maps.
- Staging deploy (operator) — optional one-line `DEPLOYMENT.md` demo note only.
- Pixel OCR / visual regression of map tiles.
- Syncing historical `openspec/specs/` as implementer SoT beyond this change’s delta archive.

## Decisions

1. **Prefer MODIFY existing Gherkin scenarios over parallel duplicates**  
   Rewrite Background / scenario steps in `booking.feature` and enrich `event-discovery.feature` public-detail scenarios rather than adding a second “ticket bounds” feature file. Rationale: single behavioral SoT; avoids conflicting Backgrounds. Alternatives: new outline-only scenarios — rejected (Background already wrong).

2. **Guest vs member qty language in Gherkin**  
   - Guests / unauthenticated preview: max 3.  
   - Signed-in booking panel: max = credits ∩ capacity; successful booking SHALL NOT require count ≤ 3 when eligible for more.  
   Keep capacity and credit rejection scenarios unchanged. Alternatives: keep “1 and 3” and add a footnote — rejected (agents will keep implementing hard 3).

3. **UI component map is the layout doc surface**  
   Expand the Event detail row in `ui-component-map.md` with aligned checkout, responsive hero, dense DETAILS, pin marker, and qty bounds. Do not invent a new design-system page. Alternatives: long prose in `DESIGN.md` — rejected (component map is agent route→UI map).

4. **Stories: verify first, add only gaps**  
   - Guest story: ensure default/`maxQty` behavior is reviewable at 3 (explicit `maxQty={3}` if default is opaque).  
   - Eligible already uses `maxQty={8}` — keep.  
   - Add a DETAILS/metadata-density story (or document in Guest/Eligible description) only if the grid is not visible in existing wide stories.  
   - Map: `EventMap / Marker pin chrome` already exists — do not duplicate.  
   Alternatives: full Chromatic suite — out of scope.

5. **Playwright: stable assertions only**  
   - DETAILS: assert multi-field metadata visible (label/value proximity or heading + several field labels) on detail — not CSS-module hashes.  
   - Guest qty: assert + disabled at 3 (role/name near checkout card).  
   - Eligible member qty > 3: seed ACTIVE member with enough credits + event capacity; assert option/control can reach 4+ (or + enabled past 3).  
   - Map pin: prefer DOM assertion on `.event-map__marker` (or accessible name) after consent fixture; `test.skip` / conditional skip if consent still blocks tiles in CI — owner: platform, reuse existing map consent helper from `event-discovery.spec.ts`.  
   Alternatives: screenshot diff of pin — rejected (flake + OCR).

6. **Gaps log optional**  
   Append one row to `gaps-and-decisions.md` only if that file’s convention already logs UX/ticket-cap decisions; otherwise skip. Rationale: step plan says “if used by convention.”

7. **Parent guide closure**  
   When verification passes, mark step 05 done and note feature complete against release criteria; call out deferred flakes under Risks. Do not mark done before lint/typecheck/targeted e2e.

8. **No app behavior changes unless e2e reveals regression**  
   This step is docs/stories/tests. Touch `apps/web` / packages only to fix accessible names or story props needed for review — not layout redesign.

## Risks / Trade-offs

- **[Risk] Member qty > 3 e2e needs seeded credits/capacity** → Mitigation: reuse demo seed / existing booking fixtures; skip with documented reason if env lacks ACTIVE member seed.
- **[Risk] Map pin e2e flakes on cookie consent or tile load** → Mitigation: assert marker DOM/CSS after consent accept helper; skip when consent gate blocks; do not wait on OSM tiles.
- **[Risk] Over-editing CHARTER Locked decisions** → Mitigation: do not touch CHARTER unless a ticket-cap bullet explicitly contradicts 04; prefer feature files + component map.
- **[Risk] Gherkin Background change breaks scenario titles that Playwright matches verbatim** → Mitigation: keep Scenario titles stable; only change Background / Then steps; update Playwright only where assertions encode “1 and 3”.
- **[Trade-off] Historical openspec/specs may lag product docs** → Acceptable per AGENTS.md; this change’s deltas capture the hardening contract for archive.

## Migration Plan

1. Diff `docs/product/` against shipped detail UI; list stale hits (especially “1 and 3”).
2. Update `booking.feature`, `event-discovery.feature`, `ui-component-map.md` (+ gaps log if warranted).
3. Refresh Ladle stories for qty + metadata + confirm pin chrome.
4. Add/adjust Playwright; run lint, typecheck, targeted e2e.
5. Mark parent guide 01–05 done; note CI skips.
6. Rollback: revert doc/story/e2e commits — runtime from 01–04 unchanged.

## Open Questions

- None blocking. Map consent CI skip remains an accepted residual (platform fixture) if still red after reuse of existing helper.
