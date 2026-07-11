# BDD and E2E contract (MVP)

**Status:** Binding for product rewrite steps 03–05 and for all new/changed Playwright work after step 05 flips `AGENTS.md` to `docs/product/`.  
**Companion:** [`e2e/README.md`](../../../e2e/README.md) (harness how-to). When they conflict on selector or title rules, **this file wins** for product behavior; keep `e2e/README.md` in sync in step 04/05.

Gherkin under [`../features/`](../features/) is the **behavioral source of truth** for MVP. Playwright proves those scenarios in the browser.

---

## Hard rules

### 1. File mapping

| Gherkin | Playwright |
|---|---|
| `docs/product/features/<name>.feature` | `e2e/specs/<name>.spec.ts` |

- One spec file per MVP feature basename.
- Harness-only specs (e.g. `smoke.spec.ts`) are exempt from feature mapping.
- Post-MVP features under `features/post-mvp/` do **not** require MVP e2e coverage.

### 2. Scenario titles (verbatim)

Every MVP `Scenario:` that ships **MUST** have a Playwright test titled:

```ts
test("Scenario: <exact Gherkin scenario title>", …)
```

- Match the Gherkin `Scenario:` line **verbatim** (same wording, punctuation, and casing after `Scenario: `).
- Scenario Outline rows → separate tests named after the outline + example identity, or one test per example with a title that still traces clearly to the outline (document the convention in the spec file comment if not 1:1).
- Do not invent parallel titles for the same behavior.

### 3. Selectors — proximity / layout only

| Allowed | Examples |
|---|---|
| `getByRole` | `getByRole('button', { name: /anmelden/i })` |
| `getByLabel` | `getByLabel(/e-?mail/i)` |
| `getByText` | `getByText(/discover/i)` |
| `filter({ has / hasText })` | `locator.filter({ hasText: 'Berlin' })` |
| Parent walks | `getByRole('main').getByRole('link')` |
| `nth()` | `getByRole('row').nth(1)` |

**Forbidden:**

- `data-testid` (and any production markup added only for tests)
- CSS class selectors (`.button--primary`, `.card__title`, …)
- `#id` selectors for tests
- XPath aimed at implementation details
- Standing use of `page.locator('input[name=…]')` for date/time or other fields that should expose accessible names

If a scenario cannot be asserted with allowed locators, **fix the UI accessibility** (labels, roles, visible text) — do not add test-only attributes.

### 4. Documented exceptions

| Exception | Rule |
|---|---|
| Native file inputs / file chooser | Prefer role/label. If unavoidable, `page.locator` / `setInputFiles` is allowed **only** with an inline comment `// BDD exception: file-input` next to the locator. |
| Hidden date / name-attribute inputs | **Not** a standing exception. Prefer `getByLabel` / labeled textboxes once forms expose accessible names. Admin event date/time locators were remediated in Phase 5.5 step 03. Do not expand the exception list without a charter amendment. |

Any other `page.locator` usage must be justified against this exception list in code review / PR description.

### 5. Coverage gate (`@skip-no-ui`)

- Phase / plan **“done when”** for an MVP feature **MUST NOT** pass while MVP-required scenarios remain tagged `@skip-no-ui` **unless** the plan records an explicit deferral (scenario name + reason + target phase).
- `@skip-no-ui` on **post-MVP** scenarios (portal access, check-in, etc.) is fine and expected until that work is scheduled.
- Skipping because R2 env vars are missing is an environment skip, not `@skip-no-ui` folklore — document in the test.

### 6. Ladle / design system

- Design-system stories live in `packages/ui` (`@unveiled/ui`).
- A **Theme Overview** story is required (Uber yellow / near-zero radius / borders / typography / primary+secondary buttons).
- Page compositions may keep optional stories in `apps/web` when route-specific.
- Full policy: [`../ui/design-system.md`](../ui/design-system.md). Theme Overview and DS ownership were remediated in Phase 5.5 steps 01–02.

---

## Known coverage gaps

**Inventory:** [`coverage-matrix.md`](./coverage-matrix.md) — Scenario → Playwright status for all MVP features, post-MVP skips, and Phase 6–8 unshipped rows. Prefer the matrix over duplicating gap tables here.

### Residual notes (after Phase 5.5 step 04)

| Area | Notes |
|---|---|
| Discover CTA → `/events` | Browse CTA goes to `signup?returnTo=/:locale/events`; onboarding finish still lands on membership. Auto `returnTo` after onboarding polish → step 05 / Phase 8. |
| `auth` / GDPR | Google OAuth + data export/deletion remain `deferred` → Phase 8 (stubs in `auth.spec.ts`). |
| Post-MVP | `admin-partners` portal/QR `@skip-no-ui` stubs — leave until post-MVP. |
| Locator polish | `e2e/fixtures/onboarding.ts` `page.locator("label").filter` — proximity-adjacent; optional later cleanup. |
| Unshipped | `booking`, `credits-subscription`, `waitlist`, `profile`, `admin-users` — matrix rows `unshipped`; ship e2e with Phases 6–8. |

Admin event G7 date/time locators and remote-URL image were remediated in step 03. File inputs keep `// BDD exception: file-input`.

---

## Implementer checklist

Before adding or changing an E2E test for an MVP feature:

1. Open the matching `docs/product/features/<name>.feature`.
2. Copy the `Scenario:` title into `test("Scenario: …")` verbatim.
3. Use proximity/layout selectors only; justify any `page.locator` against §4.
4. Do not leave MVP-required scenarios on `@skip-no-ui` without a plan deferral.
5. Prefer fixing accessible names in the UI over expanding exceptions.
6. Update [`coverage-matrix.md`](./coverage-matrix.md) when adding or deferring a Scenario.
