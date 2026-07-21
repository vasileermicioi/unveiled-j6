## Context

Manual QA after subscribe → book found two chrome gaps (parent: `.dev-plan/current-iteration/manual-test-ux-parent-guide.md` step 04; brief: `.dev-plan/current-iteration/manual-test-ux-04-membership-benefits-and-page-headers.md`):

1. **Membership benefits as three cards** — `MembershipInfoPage` maps `content.perks` into a `md:grid-cols-3` of `SectionCard` titles (refs: `.dev-plan/manual-test-sub-page.png`, `.dev-plan/manual-test-post-sub-page.png`). Guest home already stacks perks vertically with check icons (`LandingPage` + `.guest-home__perk*`).
2. **One-off book headers** — `BookEventPage` / `BookConfirmPage` use bare `Heading level={1}` (+ subtitle paragraph). Discover, FAQ, auth, My Tickets already use `PageSectionHeader` (eyebrow + headline + theme rule). Waitlist join/cancel share the same bare-heading pattern and are in the same smoke path.

Constraints: HeroUI compositions; theme colors/borders in `globals.css`; yellow page background; Work Sans; no hard drop shadows; existing perk copy in `membership.ts` stays unless wrong; membership hero CTA card stays — only the perk strip changes.

## Goals / Non-Goals

**Goals:**

- Vertical membership benefits list with a **distinct** lucide (or existing) icon per perk row.
- Same list on every `MembershipInfoPage` view that currently shows the three-card strip.
- Theme classes under `.membership-benefits__*` (layout via Tailwind flex/gap only).
- `BookEventPage` (normal + past-due) and `BookConfirmPage` use `PageSectionHeader`.
- Same-pass header migration for waitlist join/cancel when they still use bare H1.
- Docs + Ladle updated for the new benefits presentation and booking header usage.

**Non-Goals:**

- Redesigning the membership hero card / price / Stripe CTAs.
- Guest-home perk redesign (already vertical).
- Migrating every profile/admin bare H1 in this step (profile/security/billing stay for a later pass unless trivially adjacent).
- Map popup close (step 05).
- Stripe price or perk *wording* product changes (credits-no-rollover already fixed).
- Inventing a third header component.

## Decisions

1. **Benefits markup = vertical icon rows, not SectionCards**
   - **Choice:** Replace the `SectionCard` grid with a `Surface` stack (e.g. `.membership-benefits`) of rows: icon surface + `Paragraph` perk text. Keep `content.perks` as the string source.
   - **Rationale:** Matches brief + guest-home readability; cards implied equal weight / horizontal strip that fails on narrow viewports.
   - **Alternatives:** Keep SectionCards stacked vertically (still heavy cards); reuse `.guest-home__perk*` classes on yellow (wrong surface colors — guest perks sit on dark cream panel).

2. **Distinct icons per perk index**
   - **Choice:** Fixed icon map by perk index (0..2) using lucide icons already in the app (e.g. `Ticket` / `Sparkles` / `Coins` or similar — pick three that read as “events / early access / credits”). Same icons for DE/EN.
   - **Rationale:** Brief requires distinct bullets; index map avoids bloating content types with icon ids for three stable strings.
   - **Alternatives:** Same check icon for all (rejected by brief); put icon keys in `membership.ts` (overkill unless perks become dynamic).

3. **Theme under `.membership-benefits__*`**
   - **Choice:** New component classes in `globals.css` for icon size/color, row gap, text weight — tuned for brand-yellow page + optional cream/white surrounding surfaces. Do not reuse guest-home yellow-on-dark icon colors blindly.
   - **Rationale:** Theme-only visual styling rule; guest-home tokens assume inverted panel.
   - **Alternatives:** Tailwind color utilities on rows (forbidden); share guest-home class names (wrong contrast).

4. **Keep membership hero; only swap perk block**
   - **Choice:** Leave the top `membership-hero` Card (title/subtitle/CTAs) as-is. Do **not** force that hero through `PageSectionHeader` in this step — membership marketing uses a bordered hero card by design; the header consistency target is booking/member browse flows.
   - **Rationale:** Brief scopes headers to book/confirm outliers; membership hero is a deliberate marketing composition (closer to `PageHero` / section card than Discover rule).
   - **Alternatives:** Convert membership title to PageSectionHeader (would fight the hero card layout in screenshots).

5. **Booking headers = PageSectionHeader + keep subtitle below**
   - **Choice:** Add `eyebrow` to `booking-content` (book + confirm + past-due as needed). Render `PageSectionHeader` with eyebrow + `copy.title` as headline. Keep event-specific subtitle / body paragraphs below the header (not inside the header).
   - **Rationale:** Matches My Tickets / Discover contract; subtitle is transactional context, not the ruled header.
   - **Alternatives:** Put event title into headline (loses stable page title); invent centered book chrome (rejected).

6. **Same-pass waitlist headers**
   - **Choice:** Migrate `WaitlistJoinPage` / `WaitlistCancelPage` bare H1s to `PageSectionHeader` with eyebrows in `waitlist-content.ts` while touching the book path.
   - **Rationale:** Same one-off pattern; same member smoke path; cheap and prevents step 05 from rediscovering them.
   - **Alternatives:** Book-only (leaves obvious siblings); full profile migration (out of scope).

7. **Docs**
   - **Choice:** Note vertical icon-bullet membership benefits in `static-pages-content.md` / `ui-component-map.md`; extend PageSectionHeader consumers to include book/confirm (and waitlist). Product SoT is `docs/product/`; openspec deltas are workflow only.
   - **Rationale:** Prevents the next agent from restoring three-up cards or bare H1s.

## Risks / Trade-offs

- **[Risk] Icon choice feels arbitrary** → Mitigation: pick three obvious membership metaphors; keep DE/EN text unchanged so icons support rather than replace meaning.
- **[Risk] Membership page still “feels different” because of hero card** → Mitigation: intentional; document that PageSectionHeader is for default on-yellow titles, not the membership marketing hero.
- **[Risk] Missing eyebrow copy for book/waitlist** → Mitigation: add short DE/EN eyebrows consistent with My Tickets (“Buchungen” / “Bookings” or flow-specific “Reservieren” / “Reserve”).
- **[Risk] Scope creep into all profile H1s** → Mitigation: hard stop after book/confirm + waitlist; list remaining outliers in step notes if found, defer to later.
- **[Trade-off] openspec/specs are not product SoT** → Still write deltas; update `docs/product/` for implementers.

## Migration Plan

1. Implement vertical benefits + theme classes; update MembershipInfoPage stories.
2. Add eyebrows; swap book/confirm (+ waitlist) headers to `PageSectionHeader`.
3. Update product UI docs.
4. `bun run lint` && `bun run typecheck`; manual `/en/membership` + book page visual check vs FAQ/Discover.
5. Mark step 04 done in parent guide on merge. Rollback = revert PR. No DB/env migration.

## Open Questions

- None blocking. Default eyebrow for book: reuse bookings namespace (“Buchungen” / “Bookings”) unless existing static-pages copy already names a book-specific eyebrow — prefer matching My Tickets over inventing marketing fluff.
