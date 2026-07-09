## Context

`MembershipInfoPage` currently wraps a single `Card` with `max-w-lg` inside a `max-w-7xl` shell, so the page looks like a stub compared to Discover / FAQ / How it works. Perks are a left-aligned list of small `Paragraph`s with no card treatment. Guest chrome still renders `copy.guestCta` ("Become a member" / "Mitglied werden") as a third header action next to Login + Sign up (desktop and mobile drawer via `showCta`). FAQ renders a centered secondary Back link to the locale root per older `static-pages-content.md` §3.

Constraints: HeroUI-only markup; theme-only visual styling; Tailwind for layout only; keep membership perk/title/CTA copy verbatim from `membershipContent`; Stripe checkout remains disabled until Phase 6.

## Goals / Non-Goals

**Goals:**

- Membership page uses the same wide shell rhythm as other marketing pages and presents perks as first-class visual blocks.
- Guest header no longer shows a separate "Become a member" CTA anywhere (desktop or drawer).
- FAQ has no Back button.
- Stories and E2E stay green for affected assertions.

**Non-Goals:**

- Enabling Stripe / live checkout.
- Changing membership price, perk wording, or legal copy.
- Redesigning Discover / How it works / landing.
- Reintroducing hamburger-only nav changes beyond removing the CTA props.
- Broad theme token restyle unrelated to membership layout.

## Decisions

### 1. Membership layout: wide shell + hero band + 3 perk cards + CTA row

Mirror Discover’s `max-w-7xl` + section gaps:

1. **Hero band** — full-width bordered `Card` (or equivalent HeroUI surface) with title, subtitle, guarantee, primary CTA (`content.button`, still disabled until Phase 6), and secure line.
2. **Perks grid** — `md:grid-cols-3` of `SectionCard` (or bordered `Card` tiles) with each perk string as the card title (and optional short empty description). Reuse Discover’s value-prop pattern so benefits read as three equal columns, not a bullet list.
3. Keep a single primary CTA in the hero (and optionally repeat a secondary-width CTA under the grid if the hero CTA feels distant on long viewports — prefer one CTA first; add a second only if visual QA needs it).

**Alternative considered:** Keep one wide card with an internal 3-column perk row. Rejected as primary — Discover already teaches “section + three cards”; matching that language is clearer.

### 2. Remove guest header CTA entirely

- Delete `showCta` / `guestCta` rendering from `AppNavbar` and stop passing `showCta` / `ctaHref` / `ctaLabel` into `AppNavbarMenu` (or hard-wire `showCta={false}` and remove dead props in the same change).
- Leave Login + Sign up for guests; Membership remains a primary nav item.
- `copy.guestCta` may remain unused or be removed if nothing else references it (How-it-works step title "Become a member" is separate content — do not touch).

**Alternative:** Keep CTA only on non-membership pages. Rejected — user asked to remove it from all pages; nav already covers membership.

### 3. FAQ: drop Back control

- Remove the Back `Link` block from `FaqPage`.
- Leave `backButton` in content types for now **or** remove from `FaqContent` + `faq.ts` if unused after the change — prefer delete unused field to avoid dead copy.
- Update `docs/migration/ui/static-pages-content.md` FAQ §3 and `app-shell.md` guest CTA note (or `gaps-and-decisions.md`) so product docs match the rewrite.

### 4. Visual styling

- Prefer existing theme classes (`Card`, `SectionCard`, `button--primary`) and layout utilities.
- If membership needs a small `@layer components` hook (e.g. `.membership-hero`), keep it theme-token based — no ad-hoc color utilities on the route.

## Risks / Trade-offs

- **[Docs drift]** Old migration UI docs still describe Back + guest CTA → Mitigation: update those two sections (or gaps log) in the same PR.
- **[E2E false positives]** `static-pages.spec.ts` matches "Become a member" on How it works step copy — keep that assertion; only fix tests that target the header CTA or FAQ Back.
- **[Empty header on mobile]** Removing CTA leaves Login/Sign up + Menu — acceptable; Membership stays in drawer nav links.
- **[Disabled CTA still prominent]** Checkout remains disabled until Phase 6 → Keep disabled primary button; do not fake Stripe.

## Migration Plan

1. Implement membership layout + perk cards.
2. Strip guest CTA from navbar + drawer.
3. Remove FAQ Back; clean unused content fields.
4. Update stories, docs notes, and any E2E.
5. Manual QA on `/de|en/membership`, `/faq`, and a non-membership page header.
6. Rollback: revert the four component files + content/docs.

## Open Questions

- None blocking — perk presentation defaults to Discover-style three `SectionCard`s unless apply-time visual QA prefers inverted/accent tiles.
