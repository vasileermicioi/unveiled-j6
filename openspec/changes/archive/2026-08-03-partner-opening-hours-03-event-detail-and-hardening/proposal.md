## Why

Steps 01–02 shipped validated opening hours and admin authoring, but public event detail still shows only partner name + logo. Visitors cannot see when the venue is typically open, and product Gherkin / e2e do not yet cover hours display or admin hours scenarios. This final step closes parent feature `partner-opening-hours`.

## What Changes

- Extend `EventDetailPartnerAttribution` with optional structured hours (or locale-ready lines from the route).
- On public `/events/:id`, when `hasOpeningHours` is true and a valid week exists, list Mon→Sun open–close (or closed) under/beside partner logo + name in the DETAILS partner attribution block; omit the hours list entirely when disabled/null.
- Format weekday labels and times for the active locale (Europe/Berlin wall times); HeroUI-only chrome (existing partner logo `<img>` exception remains).
- Update canonical product docs: `schema-overview.md`, `admin-partners.feature`, `event-discovery.feature`, `ui-component-map.md`, `content-i18n-inventory.md` (and gaps row if needed); coverage matrix for new scenarios.
- Playwright: admin save hours; guest/member sees hours on detail; disabled partner shows no hours (proximity selectors; R2 env-skip only where logo upload is required).
- Update EventDetail Ladle stories with an hours fixture when needed.
- Mark step 03 done in the parent guide (feature complete).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-discovery`: Partner attribution on public event detail SHALL also list weekly opening hours when enabled; omit hours when disabled/null; Gherkin + e2e align.
- `partner-catalog`: `admin-partners.feature` and Playwright SHALL document/cover enabling, validating, and disabling weekly opening hours end-to-end with public-detail omit behavior.

## Impact

- **UI:** `EventDetailPage` / `EventDetailPartnerAttribution`; optional small display helper for weekday lines.
- **Route:** `apps/web/app/routes/[locale]/events/[id].tsx` — pass partner `hasOpeningHours` + `openingHours` into attribution props.
- **Copy / i18n:** Public detail weekday + closed labels (DE/EN); i18n inventory.
- **Docs / BDD:** `docs/product/features/{event-discovery,admin-partners}.feature`, schema overview, ui-component-map, gaps if needed, coverage matrix; Playwright under `e2e/`.
- **Fixtures:** `EventDetailPage.stories.tsx` hours fixture.
- **Source brief:** `.dev-plan/current-iteration/partner-opening-hours-03-event-detail-and-hardening.md`
- **Parent:** `.dev-plan/current-iteration/partner-opening-hours-parent-guide.md`
- **Depends on:** `partner-opening-hours-02-admin-ui` (done)
- **Verification:** `bun run typecheck`; `bun run lint`; targeted Playwright for new scenarios
