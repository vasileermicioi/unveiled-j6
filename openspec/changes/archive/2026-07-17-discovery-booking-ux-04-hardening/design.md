## Context

Steps 01–03 of Discovery & Booking Surfaces UX are shipped and archived:

- `PageSectionHeader` on Discover, FAQ, auth, member feed (and related non-admin surfaces).
- EventCard primary CTA is **Book Now** / **Bin dabei** (Waitlist when sold out) → always `/:locale/events/:id`.
- `EventDetailPage` is checkout-focused (identity + dark summary card; close Link; qty as navigation state only).

Product SoT and e2e still lag:

| Surface | Stale claim | Shipped truth |
|---|---|---|
| `ui-component-map.md` EventCard CTA | Guest → “See details” / “Mehr sehen”; inactive → “Unlock event” | Guest/inactive bookable → Book Now → detail; sold-out → Waitlist |
| `static-pages-content.md` Discover | Guest CTA “See details” | Book Now / Bin dabei |
| `static-pages.feature` + `static-pages.spec.ts` | Step/assert “See details” / `mehr sehen\|see details` | Book Now / Bin dabei — **e2e currently broken** |
| `CHARTER.md`, `sitemap.md` | Guest CTA “See details” | Book Now |
| `content-i18n-inventory.md` | Guest “See details” + inactive “Unlock event” as special labels | Guest uses `bookNow`; inactive also Book Now on card |
| `docs/UX_RULES.md` | Guest “See details”; “never see … book labels” | Guest sees Book Now |
| `docs/COMPONENTS.md` | PageHero notes; FAQ “direct-on-yellow hero” | Document `PageSectionHeader` as default ruled header |
| Event detail in component map | No checkout-layout entry | Document checkout identity + summary card |
| Stories | Present for all three surfaces | Confirm only; fill gaps if any |

Constraints: proximity e2e selectors only (no new `data-testid`); HeroUI-only markup already shipped; product SoT is `docs/product/`; do not expand into partner portal or Stripe UI.

## Goals / Non-Goals

**Goals:**

- Align product docs, Gherkin, Playwright, and agent UI docs with shipped header / Book Now / checkout-detail contracts.
- Green targeted e2e for Discover Book Now → detail, ruled headers (FAQ/auth), guest checkout card CTA.
- Confirm Ladle coverage for the three surfaces.
- Mark parent guide steps 01–04 done and feature complete; resolve decided open questions.

**Non-Goals:**

- Visual redesign beyond fixing regressions found while updating e2e.
- New domain features (waitlist algorithm, Stripe, credit rules).
- Merging `/events/:id/book` into detail.
- Reworking MembershipInfoPage card hero (parent risk noted; out of this step unless a one-line doc note).
- Syncing historical `openspec/specs/` as implementer SoT (optional archive; update `docs/product/` for agents).

## Decisions

1. **Prefer MODIFY existing Gherkin/e2e scenarios over new parallel ones**  
   Keep scenario title `Discover preview links to public event detail`; change the When step and Playwright locator from See details → Book Now / Bin dabei. Rationale: title already matches; avoid duplicate scenarios. Alternatives: rename scenario — rejected (unnecessary churn vs `event-discovery` guest titles).

2. **E2E assertions use role/name proximity, never CSS class or `data-testid`**  
   - Discover CTA: `getByRole("link", { name: /bin dabei|book now/i })` (match `event-discovery.spec.ts`).  
   - FAQ/auth header: assert visible eyebrow + level-1 heading (and optional rule via accessible structure if needed) — not `.page-section-header` class selectors.  
   - Guest detail checkout: assert summary/total/login (or unlock) CTA via role/text near the dark card content.  
   Alternatives: class-based header assert — rejected (violates BDD contract).

3. **Doc sync is the primary deliverable; UI code only for e2e regressions**  
   Steps 01–03 already shipped UI. This step edits docs/features/e2e/stories notes. Touch app components only if an assertion reveals a real regression (e.g. missing accessible name). Alternatives: drive new UI polish in 04 — rejected (scope creep).

4. **EventCard CTA precedence rewrite (guest-first)**  
   Document: guest → Book Now (or Waitlist if sold out) → detail; signed-in sold-out → Waitlist; else Book Now → detail. Remove “Unlock event” as a card CTA (unlock/membership messaging lives on detail checkout card). Rationale: matches step 02 shipped behavior. Alternatives: keep “Unlock event” on inactive cards — rejected (step 02 decided Book Now for inactive).

5. **`PageSectionHeader` vs `PageHero` documentation split**  
   - `PageSectionHeader`: default on-yellow ruled header (Discover, FAQ, auth, member browse).  
   - `PageHero`: optional bordered card hero for long-form marketing/legal (how-it-works, etc.).  
   Update `COMPONENTS.md` + component map / static-pages notes accordingly. Alternatives: deprecate PageHero — rejected (still used).

6. **Stories: verify, don’t duplicate**  
   Confirm existing `PageSectionHeader`, `EventCard / Guest — Book Now`, `EventDetailPage / Guest|Eligible|Sold out` stories. Add only if a surface lacks a story. Alternatives: new Chromatic suite — out of scope.

7. **Parent Risks cleanup**  
   Resolve Guest CTA / docs-lag / Step 03 docs-lag items as done when docs land. Leave MembershipInfoPage hero as deferred note or drop if still out of pattern by choice. Sold-out Waitlist label stays (confirmed in step 02).

8. **Manual smoke docs** (`docs/manual-smoke-testing/*`)  
   Update Phase 1 / 5.5 smoke lines that still say “See details” if touched during grep; not a primary deliverable but cheap consistency.

## Risks / Trade-offs

- **[Risk] `static-pages.spec.ts` Discover CTA is red until locator update** → Mitigation: fix that test first; mirror `event-discovery.spec.ts` Book Now pattern.
- **[Risk] FAQ/auth header e2e flakes on eyebrow copy i18n** → Mitigation: locale-aware regex from static copy; assert H1 + known eyebrow substrings; no class selectors.
- **[Risk] Over-editing `CHARTER.md` Locked decisions** → Mitigation: only update the Discover CTA bullet that still says “See details”; do not reopen unrelated locks.
- **[Risk] Duplicate/conflicting Gherkin if both static-pages and event-discovery describe the same path** → Mitigation: keep one Discover→detail scenario in `static-pages.feature`; ensure `event-discovery.feature` guest detail scenario stays about unauthenticated GET, not card CTA label.
- **[Trade-off] Historical openspec/specs may lag product docs** → Acceptable per AGENTS.md; delta specs in this change capture the contract for archive.

## Migration Plan

1. Grep `docs/product/`, `docs/UX_RULES.md`, `docs/COMPONENTS.md`, e2e for “See details” / “Mehr sehen” / Unlock-on-card / PageHero-as-FAQ-default.
2. Update product docs + Gherkin; fix Playwright locators/assertions; confirm stories.
3. Run `bun run lint`, `bun run typecheck`, targeted Playwright (static-pages + discovery/detail).
4. Grep sanity: no product SoT claiming guest EventCard CTA is only “See details” without Book Now.
5. Mark step 04 + feature complete in parent guide; resolve decided Risks.
6. Rollback: revert doc/e2e commits — UI from 01–03 unchanged.

## Open Questions

- None blocking. MembershipInfoPage card hero remains intentionally out of `PageSectionHeader` unless product later wants it unified — document as deferred, do not restyle in this step.
