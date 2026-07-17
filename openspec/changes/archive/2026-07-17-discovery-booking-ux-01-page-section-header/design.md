## Context

Discovery & Booking Surfaces UX step 01 extracts Discover’s live-preview section header into a shared composition so FAQ, auth, member feed, and saved events stop inventing separate heroes.

Current state:

- **Discover** (`DiscoverPage.tsx`): `.discover-events-heading` — muted uppercase eyebrow + `Heading` level 1 + `border-bottom: 2px solid var(--border)` on brand yellow. Visual SoT: `.dev-plan/1-page-header.png`.
- **FAQ** (`FaqPage.tsx`): `.faq-hero` stack with eyebrow + h1 + subheadline; custom h1/subheadline type rules in `globals.css`. No bottom rule.
- **Auth** (`AuthPageLayout.tsx`): plain `Heading` + description `Paragraph`; no eyebrow.
- **Member feed / saved**: plain `Heading` title (feed also has a map Link sibling).
- **Membership** (`MembershipInfoPage.tsx`): `Card` `.membership-hero` — **not** the on-yellow ruled pattern; leave unchanged (same deferral class as `PageHero`).
- **Contrast:** `PageHero` is a bordered white/cream **card** hero for How it works / legal — out of scope to replace.

Constraints: HeroUI-only markup; theme tokens for color/border/typography; Tailwind layout/spacing only; no admin shell changes; locale routes stay under `/:locale/*`.

## Goals / Non-Goals

**Goals:**

- One `PageSectionHeader` composition used by Discover and the listed adoption surfaces.
- Shared theme class (e.g. `.page-section-header`) owning the full-width rule + header spacing (and shared headline type scale if FAQ’s large h1 should match Discover).
- Eyebrow + headline + rule on yellow; optional supporting paragraph **below** the ruled block.
- Auth pages gain eyebrow copy (DE/EN) per page key.
- Ladle story for default + long-headline cases.

**Non-Goals:**

- EventCard CTA changes (step 02).
- Event detail checkout layout (step 03).
- Product Gherkin / charter updates (step 04).
- Removing or migrating `PageHero` / How it works / legal.
- Restyling `MembershipInfoPage` card hero in this step.
- Admin UI headers.

## Decisions

1. **Shared component API**  
   `PageSectionHeader({ eyebrow, headline, id?, level = 1, className? })` composing HeroUI `Surface` (transparent) + `Paragraph` (eyebrow, muted, uppercase tracking) + `Heading`. Optional `id` on the heading (or surface) for `aria-labelledby` from a parent section.  
   Rejected: extending `PageHero` — that component is a card hero with different visual contract.

2. **Theme class rename**  
   Introduce `.page-section-header` with the current `.discover-events-heading` rule (padding-bottom + 2px bottom border on `var(--border)`). Prefer migrating Discover to the new class and removing `.discover-events-heading`, or keep a one-line alias `@apply`/selector group during the PR — do not leave divergent spacing/border values.  
   If FAQ’s large display h1 should match the PNG, move relevant `.faq-hero .typography--h1` rules under `.page-section-header` (or a BEM child) so Discover and FAQ share one headline scale; keep `.faq-hero__subheadline` for copy **below** the header.

3. **Supporting copy placement**  
   `PageSectionHeader` does **not** take a description prop in v1. Call sites render description/subheadline as a sibling **below** the component (FAQ subheadline, auth description). Rule stays under the headline only.

4. **Auth eyebrows**  
   Extend `AuthPageCopy` with `eyebrow: string` per `AuthPageKey` × locale. Suggested tone: short uppercase brand labels (e.g. EN “Account” / “Welcome back”; DE equivalents) — final strings chosen to match existing voice in `auth-content` / static inventory; not marketing paragraphs.

5. **Feed / saved layout**  
   Replace the lone title `Heading` with `PageSectionHeader`. On `EventFeedPage`, keep the map Link as a sibling in the existing flex row (header block + link), not inside the ruled header. Add feed/saved eyebrows in content modules if missing (e.g. membership / browse context).

6. **Membership info**  
   **Do not adopt** `PageSectionHeader` on `MembershipInfoPage` in this step — it uses a multi-column `Card` hero. Note in parent-guide cleanup / step 04 follow-up if product later wants the ruled pattern there.

7. **Stories**  
   Add `PageSectionHeader.stories.tsx` under marketing: default (Discover-like short copy) + long-headline wrap case. Existing page stories should pick up the new header via composition; no requirement to rewrite all page stories beyond smoke.

## Risks / Trade-offs

- **[Risk] FAQ type scale changes when rule is added** → Mitigation: move shared display styles into `.page-section-header`; visual-check FAQ + Discover against PNG.
- **[Risk] Auth narrow `max-w-lg` makes rule look short** → Mitigation: acceptable — rule spans the header’s content width (auth column), not the full viewport; consistent with “content width” smoke criterion.
- **[Risk] Feed header + map Link flex breaks on mobile** → Mitigation: keep existing `flex-col` / `sm:flex-row` wrapper; only swap the title node for `PageSectionHeader`.
- **[Trade-off] Membership left on card hero** → Avoids mixing checkout marketing card with Discover section language; revisit in hardening if needed.
- **[Trade-off] OpenSpec vs product docs** → Delta lives under `platform-foundation` per step plan; product SoT updates for Gherkin stay in step 04; eyebrow strings may land in app content modules now.

## Migration Plan

1. Add `PageSectionHeader` + theme class; wire Discover first (visual parity with PNG).
2. Adopt FAQ (subheadline below), AuthPageLayout (eyebrow + description below), EventFeedPage, SavedEventsPage.
3. Add eyebrow copy; Ladle story.
4. `bun run lint` + `bun run typecheck` + stories smoke; manual `/de`, `/de/faq`, `/de/login`, `/de/events`.
5. Mark step 01 done in `discovery-booking-ux-parent-guide.md`.
6. Rollback: revert component, CSS class, and call-site/content edits.

## Open Questions

- None blocking. Exact auth/feed eyebrow strings can be chosen during implementation to match DE/EN voice; step 04 can later align any product-doc inventory.
