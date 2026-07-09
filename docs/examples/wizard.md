# Example: Multi-Step Wizard (Onboarding)

**Status:** Not implemented — Phase 3 blueprint.  
**Spec:** `docs/migration/features/onboarding.feature`, `docs/migration/sitemap/sitemap.md`

---

## Routes (one page per step)

```text
GET  /:locale/onboarding/age         → Step 1 (skippable)
POST /:locale/onboarding/age         → save + redirect
GET  /:locale/onboarding/interests   → Step 2
POST /:locale/onboarding/interests   → …
GET  /:locale/onboarding/location    → Step 3 (districts + radius)
POST /:locale/onboarding/location    → …
GET  /:locale/onboarding/timing      → Step 4
POST /:locale/onboarding/timing      → complete → redirect /membership
```

Each step is a **full SSR page** with form POST — not a client stepper that never hits the server until the end.

---

## Page structure

```tsx
<Surface className="mx-auto max-w-7xl flex flex-col gap-8 ..." variant="transparent">
  {/* Step indicator — SSR, not client state */}
  <Surface className="onboarding-steps" variant="transparent">
    <Paragraph color="muted" size="sm">
      Step {current} of 4
    </Paragraph>
    {/* Optional: HeroUI Progress or themed step dots in globals.css */}
  </Surface>

  <PageHero headline={stepTitle} description={stepSubtitle} />

  <Card>
    <Card.Content>
      <form method="post">
        {/* Step-specific fields: CheckboxGroup, RadioGroup, Slider */}
        <Surface className="flex flex-col gap-3 sm:flex-row" variant="transparent">
          {skippable ? (
            <Button type="submit" name="action" value="skip" className="button button--secondary button--md">
              Skip
            </Button>
          ) : null}
          <Button type="submit" name="action" value="next" className="button button--primary button--md">
            Continue
          </Button>
        </Surface>
      </form>
    </Card.Content>
  </Card>
</Surface>
```

---

## Step content (behavioral)

| Step | Fields | Skippable |
|---|---|---|
| Age | Age range selection | Yes |
| Interests | Category checkboxes | No |
| Location | District multi-select + radius slider | No |
| Timing | Days, time windows, languages, accessibility | No |

Preferences stored for future use — feed remains filter-driven in v1, not algorithmic.

---

## Auth gate

- Routes require authenticated `USER` with `onboarding_complete=false`
- Incomplete onboarding redirects away from `/events` feed
- Middleware in `@unveiled/auth` (Phase 2+)

---

## UX rules

- **Back navigation:** browser back works — each step is a real URL
- **Skip:** explicit skip button posts `action=skip` — server records skip, advances
- **No client wizard library** — URL-per-step is the state machine
- **Validation:** server-side on POST; re-render step with errors

---

## Styling

- Same yellow page + white card pattern as marketing
- Step indicator styled in `.onboarding-steps` theme block
- Form controls use `--field-*` tokens
- Slider/checkbox groups: HeroUI primitives, layout Tailwind only

---

## Completion

Final POST sets `onboarding_complete=true` → redirect to `/:locale/membership` for Stripe checkout (Phase 6).

---

## Do not

- Single-page React wizard with hidden steps
- Client-only `useState` step index as sole progress source
- Modal overlays between steps
- Drop onboarding data on client without POST persistence

---

## Related

- Old app had "Guest Explorer" quiz entry — **dropped** in rewrite per `static-pages-content.md`
- Landing conversion card links to `/signup` and `/login` instead (Phase 2)
