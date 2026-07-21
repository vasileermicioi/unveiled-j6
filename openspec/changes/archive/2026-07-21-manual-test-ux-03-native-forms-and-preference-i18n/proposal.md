## Why

Onboarding and profile preference UIs use HeroUI Checkbox/Radio/Switch/NumberField chrome that is easy to miss (ref: `.dev-plan/manual-test-register-preferences.png`), and some preference option labels are not fully localized for `locale=de` (ref: `.dev-plan/manual-test-register-translations.png`). Preference and related quantity forms need **native** controls for visibility, plus DE/EN labels for every user-visible option.

## What Changes

- Replace custom multi-select / faux-checkbox preference controls with native checkboxes (and native radio for single-value age) on onboarding + profile preferences.
- Replace the accessibility HeroUI `Switch` with a native checkbox with a visible label.
- Replace HeroUI `NumberField` steppers with native `input type="number"` (or native select) for travel radius.
- Align booking/waitlist ticket count with native `<select>` (Discover filter precedent); optionally align event-detail qty if still a custom ± stepper in the same pass when cheap.
- Localize every preference label and option via `onboarding-content.ts` locale maps — no hard-coded English-only option strings when `locale=de` (fix age labels if needed; expand DE district labels; keep stored allowlist values unchanged).
- Document the AGENTS.md §14 / HeroUI Select-only **exception** for preference/booking forms in product UI guidance.
- Update i18n inventory + e2e fixtures/selectors if roles/labels change.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-onboarding`: Onboarding preference steps SHALL use native HTML form controls and SHALL show DE/EN option labels according to the active locale.
- `member-profile`: Profile cultural preferences editor SHALL use the same native-control + localized-option contract as onboarding.
- `booking`: Book/waitlist ticket quantity SHALL use a native `<select>` (or native number input), not a HeroUI Select that fails visibility/hydration.
- `platform-foundation`: Product UI docs SHALL state an explicit native-control exception for onboarding, profile preferences, and booking quantity fields.

## Impact

- **UI components:** `apps/web/app/components/onboarding/*StepForm.tsx`; `apps/web/app/components/profile/PreferencesForm.tsx`; island `ProfilePreferencesForm.tsx`; `apps/web/app/islands/TicketCountSelect.tsx` (+ waitlist/book pages); optionally `EventDetailCheckoutCard.tsx` qty.
- **Copy:** `apps/web/app/lib/onboarding-content.ts` (option label maps); inventory `docs/product/extras/content-i18n-inventory.md`; product UI docs for the checkbox/select exception.
- **Theme:** `apps/web/app/styles/globals.css` — restyle `.onboarding-form` for native checkbox/radio/number/select (reuse/adapt `.event-feed-filters__select` precedent); no per-route color classes.
- **Domain constants:** `@unveiled/auth` allowlists stay the stored values; only display labels change.
- **E2E:** `e2e/fixtures/onboarding.ts`, `e2e/specs/onboarding.spec.ts` (and any booking qty selectors if detail stepper changes).
- **Unchanged:** Auth backend, booking domain transaction, Stripe, membership benefits layout (step 04), map popup (step 05), guest event detail gating (step 01).
- **Source brief:** `.dev-plan/current-iteration/manual-test-ux-03-native-forms-and-preference-i18n.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- **Depends on (soft):** `manual-test-ux-02-auth-form-width` (done)
- **Consumed by:** `manual-test-ux-04-membership-benefits-and-page-headers`, `manual-test-ux-05-map-close-and-hardening`
- **Verification:** `bun run lint`, `bun run typecheck`; manual DE/EN onboarding — native accessibility checkbox visible; options follow locale
