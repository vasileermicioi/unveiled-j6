## Why

Public `/events/:id` correctly stays indexable without auth, but guests (and other non–booking-eligible viewers) still see membership credit totals and event date/time chrome. Those fields should match EventCard gating: reserved for booking-eligible members so the public page markets identity/content without leaking member pricing or schedule details used for booking decisions.

## What Changes

- Gate **credit price / total** and **date/time** UI on public event detail for guests and other non–booking-eligible signed-in viewers (`membership_required`, `past_due`).
- Keep booking-eligible members (`viewer.kind === "eligible"` / `ACTIVE` + `CANCELLED_PENDING`) unchanged — credits and date remain visible.
- Preserve public identity content (title, description, venue/address, hero, unlock/login CTA) and SEO surfaces (OG + JSON-LD `startDate` stay; UI chrome only is gated).
- Drive visibility from the existing SSR session → `EventDetailViewer` path — no client-only hide.
- Update product Gherkin / related docs that currently claim guests see summary-card credits (and any guest date chrome assumptions).
- Optional: adjust an existing Playwright guest-detail assertion only if it already asserts credits/date metadata.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-discovery`: Public event detail for guests SHALL NOT show membership credit price or event date/time chrome; booking-eligible members SHALL still see both.
- `event-catalog`: Align the public detail / checkout-card requirements that currently require guests to see total credits (and any date-in-DETAILS assumptions) with the same booking-eligibility gate.

## Impact

- **UI:** `apps/web/app/components/catalog/EventDetailPage.tsx` (DETAILS calendar/date MetaCell); `apps/web/app/islands/EventDetailCheckoutCard.tsx` (credit total row / pricing display).
- **Route:** `apps/web/app/routes/[locale]/events/[id].tsx` — already computes `viewer`; may pass an explicit boolean if cleaner than deriving in the page.
- **Stories:** `EventDetailPage.stories.tsx` (and checkout card stories if present) — guest vs eligible frames should show gated vs ungated chrome.
- **Product SoT:** `docs/product/features/event-discovery.feature` (guest detail scenario currently requires summary-card credits); related UI map notes if they claim guest credits/date.
- **Unchanged:** booking domain, book route, Stripe, map popup, auth form width, membership benefits layout, JSON-LD/OG indexability.
- **Source brief:** `.dev-plan/current-iteration/manual-test-ux-01-guest-event-detail-gating.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- **Consumed by:** `manual-test-ux-05-map-close-and-hardening` (docs/e2e alignment)
- **Verification:** `bun run lint`, `bun run typecheck`; manual guest vs eligible on the same event id
