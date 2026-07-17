## Context

Today `resolveEventCardCta` in `packages/ui` applies guest-first precedence (`See details` / `Mehr sehen`), then Waitlist when sold out, then Unlock for inactive members, then Book Now. Feed/saved href helper `resolveEventFeedCtaHref` sends inactive non-sold-out members to `/membership`. Discover already passes detail hrefs but still shows guest “See details”. Parent feature `discovery-booking-ux` wants cards to always invite booking and always open public detail; membership/booking/waitlist decisions move to detail (step 03) and later SSR pages.

Constraints from AGENTS.md and the step plan: CTA remains a `Link` (no booking form POST from the card); HeroUI + theme classes only; bookmark SSR forms unchanged; product SoT doc rewrites deferred to step 04.

## Goals / Non-Goals

**Goals:**

- Unify bookable-card CTA label to **Book Now** / **Bin dabei** for all viewer states when capacity remains.
- Keep **Waitlist** / **Warteliste** when `remainingCapacity <= 0` for all viewers (including guests).
- Force primary CTA href on Discover, `/events`, and saved list to `/:locale/events/:id`.
- Update EventCard Ladle stories to match the new label matrix.

**Non-Goals:**

- Event detail checkout redesign (step 03).
- Rewriting `docs/product/` Gherkin/charter/component map (step 04).
- Changing booking, waitlist join, or membership mutation flows.
- Deep-linking card CTA to `/events/:id/book`.
- Credit economics, capacity rules, or availability-strip copy.

## Decisions

1. **CTA label precedence: capacity first, then Book Now**
   - **Choice:** `soldOut` → Waitlist; else → Book Now. Drop guest-only and inactive-unlock branches from `resolveEventCardCta`.
   - **Rationale:** Matches product invitation language; sold-out stays distinct so users are not promised booking inventory that is gone.
   - **Alternatives:** Book Now even when sold out (rejected; parent guide default keeps Waitlist); keep guest “See details” (rejected; contradicts iteration goal).

2. **Href resolution always detail**
   - **Choice:** Simplify `resolveEventFeedCtaHref` (and shared use from SavedEvents) to always `localizedPath(locale, \`events/${event.id}\`)`. Discover continues to pass detail hrefs.
   - **Rationale:** Single navigation contract; membership unlock happens on detail later.
   - **Alternatives:** Keep membership shortcut for inactive members (rejected); link active members to `/book` (rejected; booking stays SSR on dedicated page after detail).

3. **Remove unused label helpers only if unused**
   - **Choice:** After precedence change, delete or stop calling `guestCtaLabel` / `unlockCtaLabel` if nothing else needs them; keep `bookCtaLabel` / `waitlistCtaLabel`.
   - **Rationale:** Avoid dead strings that drift from product copy.
   - **Alternatives:** Leave helpers for step 04 cleanup (acceptable if stories still reference temporarily — prefer delete in this change).

4. **Stories: replace Unlock / guest See-details stories**
   - **Choice:** Guest + member bookable stories show Book Now; dedicated sold-out Waitlist story for guest and/or member; drop Unlock story (or rename to document that inactive members also see Book Now).
   - **Rationale:** platform-foundation story coverage must stay accurate.
   - **Alternatives:** Keep Unlock story as “legacy” (rejected; confusing).

5. **E2E / product docs**
   - **Choice:** Do not rewrite Playwright or `docs/product/` in this change; note handoff list for step 04. If a CI e2e assertion hard-fails on “See details”, fix the assertion minimally to Book Now so the change stays green — prefer deferring broader BDD alignment to step 04 unless CI blocks.
   - **Rationale:** Step plan scopes SoT rewrites to hardening.

## Risks / Trade-offs

- **[Risk] Spec drift vs `docs/product/` until step 04** → Mitigation: list exact files in tasks/cleanup; parent guide already flags guest CTA copy change.
- **[Risk] Guests see Waitlist on sold-out Discover cards (behavior change from “never Waitlist for guests”)** → Mitigation: intentional; document in static-marketing-pages delta and step 04.
- **[Risk] Inactive members lose one-click path to `/membership` from the card** → Mitigation: detail page (step 03) will surface unlock/login CTAs; temporary gap accepted for this step.
- **[Trade-off] `viewer` / `subscriptionActive` may become unused for CTA label** → Keep props if still needed for bookmarks or future UI; do not expand API in this change.

## Migration Plan

1. Implement label + href changes and stories.
2. Run `bun run lint` and `bun run typecheck`.
3. Smoke: guest Discover Book Now → detail; inactive member feed Book Now → detail (not membership).
4. No DB or env migration. Rollback = revert the PR.

## Open Questions

- None blocking. Sold-out label remains Waitlist (parent guide default). Product SoT updates explicitly owned by step 04.
