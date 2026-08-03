## 1. Setup / confirm inputs

- [x] 1.1 Confirm step 02 admin hours work and event detail already loads partner for logo/name (`EventDetailPartnerAttribution`, DETAILS partner block)
- [x] 1.2 Skim parent guide release criteria / non-goals (no Discover hours, overnight, holidays, partner portal)

## 2. Event detail hours display

- [x] 2.1 Extend `EventDetailPartnerAttribution` with `hasOpeningHours` + `openingHours` (or equivalent); wire `/:locale/events/:id` to pass partner values
- [x] 2.2 Add locale weekday + closed/open-range formatter (Mon→Sun, Europe/Berlin wall times, DE/EN); omit block when hours disabled/null
- [x] 2.3 Render hours under/beside logo + name in DETAILS partner attribution (HeroUI `Paragraph` / `Surface`; no nested Card)
- [x] 2.4 Update `EventDetailPage` Ladle stories with an enabled-hours fixture (and optionally a disabled case)

## 3. Product docs and BDD

- [x] 3.1 Update `docs/product/features/event-discovery.feature`: DETAILS attribution wording; add guest hours + omit-when-disabled scenarios
- [x] 3.2 Update `docs/product/features/admin-partners.feature`: enable week, invalid/incomplete rejection, disable so public detail omits hours
- [x] 3.3 Update `schema-overview.md` (display note if needed), `ui/ui-component-map.md`, `extras/content-i18n-inventory.md`, gaps row if needed, and coverage-matrix rows for new scenarios

## 4. Playwright and verification

- [x] 4.1 Add Playwright: admin save enabled hours; guest/member sees weekday hours on detail; disabled partner shows no hours list (proximity selectors; R2 skip only when logo upload required)
- [x] 4.2 Run `bun run lint` and `bun run typecheck` — both exit 0
- [x] 4.3 Run targeted partner + event-discovery e2e when env is available
- [x] 4.4 Mark step 03 done in `.dev-plan/current-iteration/partner-opening-hours-parent-guide.md` (feature complete)
