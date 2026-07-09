## 1. Membership page layout

- [x] 1.1 Rework `MembershipInfoPage` to use the wide marketing shell (`max-w-7xl`) with a hero band for title/subtitle/guarantee/CTA/secure line
- [x] 1.2 Render the three perks as a responsive multi-column grid of `SectionCard` (or equivalent HeroUI cards), keeping DE/EN perk copy verbatim
- [x] 1.3 Update `MembershipInfoPage` Ladle story and any membership-specific theme layout classes if needed

## 2. Header and FAQ chrome

- [x] 2.1 Remove guest "Become a member" / "Mitglied werden" CTA from `AppNavbar` (desktop) and `AppNavbarMenu` (drawer); clean unused props/`guestCta` if nothing else references it
- [x] 2.2 Remove the FAQ Back / Zurück button from `FaqPage`; drop unused `backButton` content/type fields if orphaned
- [x] 2.3 Update migration UI notes (`app-shell.md` guest CTA and/or FAQ back-button section, or `gaps-and-decisions.md`) so docs match the rewrite

## 3. Verification

- [x] 3.1 Manual QA: `/de|en/membership` wide + perk cards; guest header has no Become-a-member CTA; FAQ has no Back
- [x] 3.2 Adjust E2E/stories only if they assert the removed CTA or Back control; keep How-it-works "Become a member" step copy assertions
- [x] 3.3 `bun run lint` and `bun run typecheck` on touched packages
