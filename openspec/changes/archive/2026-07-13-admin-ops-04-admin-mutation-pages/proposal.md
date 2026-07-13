## Why

Membership HQ detail (step 03) already links to adjust-credits, freeze, comp-ticket, and refund paths, and steps 01–02 shipped the domain writers — but those URLs still 404. Admins also lack SSR surfaces for waitlist list/promote and booking cancel. This step closes the admin write loop with dedicated form POST pages (no client-only modals) so support ops work end-to-end before Ladle/e2e polish in step 05.

## What Changes

- Add SSR mutation pages under `/:locale/admin/users/:id/*`:
  - `adjust-credits` — amount + required reason → `adjustMemberCredits`
  - `freeze` — freeze/unfreeze confirm → `freezeMember` / `unfreezeMember`
  - `comp-ticket` — event Select + optional notes → `createCompTicket`
  - `refund` — amount + required reason → `refundMemberCredits`
- Add `/:locale/admin/waitlist` list (`eventId`, `status`, `page`) via `listAdminWaitlistEntries`
- Add `/:locale/admin/waitlist/:id/promote` confirm/POST → `promoteWaitlistEntryAsAdmin`
- Add `/:locale/admin/bookings/:id/cancel` confirm/POST with required reason → `cancelBookingAsAdmin` (no auto-refund)
- Wire navigation from Membership HQ detail and booking/waitlist surfaces; surface domain errors on-page
- HeroUI forms; Select for choices; ADMIN + `noindex`; locale in URL
- **No** delete-account (→ `gdpr-rights-02`); **no** Playwright suite (step 05); **no** new domain APIs

## Capabilities

### New Capabilities

- _(none)_ — SSR UI over existing admin-users, waitlist, and booking capabilities

### Modified Capabilities

- `admin-users`: Dedicated SSR form POST pages for adjust-credits, freeze/unfreeze, comp-ticket, and refund under `/:locale/admin/users/:id/*` (ADMIN-only, no client-only mutation modals)
- `waitlist`: Admin waitlist list page and manual promote confirm/POST pages
- `booking`: Admin cancel booking confirm/POST page that cancels without refunding credits

## Impact

- **Code:** `apps/web` — routes under `app/routes/[locale]/admin/users/[id]/`, `admin/waitlist/`, `admin/bookings/[id]/cancel.tsx`; form components under `app/components/admin/`; `admin-content` copy; detail/list CTA wiring
- **Packages:** consume existing `@unveiled/db` admin exports and `@unveiled/billing` freeze/unfreeze; no new domain writers
- **Database:** none
- **Upstream:** Depends on `admin-ops-01`, `admin-ops-02`, `admin-ops-03` (merged)
- **Downstream:** Consumed by `admin-ops-05-ladle-e2e`
- **Docs:** step plan `.dev-plan/current-iteration/admin-ops-04-admin-mutation-pages.md`; mark step 04 done in `admin-ops-parent-guide.md` after apply; no `docs/product/` edits expected (sitemap already lists these routes)
- **Out of scope:** `/admin/users/:id/delete-account`; Playwright; partner routes; new domain logic
