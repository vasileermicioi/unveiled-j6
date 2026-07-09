# Example: Event Form (Admin CRUD)

**Status:** Not implemented — Phase 4+ blueprint.  
**Spec:** `docs/migration/features/admin-events.feature`, `docs/migration/extras/image-uploads.md`

---

## Routes

```text
GET  /:locale/admin/events/new          → create form
POST /:locale/admin/events/new          → validate + insert + redirect
GET  /:locale/admin/events/:id/edit     → edit form
POST /:locale/admin/events/:id/edit     → validate + update + redirect
GET  /:locale/admin/events/:id/delete   → confirm page
POST /:locale/admin/events/:id/delete   → soft-delete + redirect
```

Each step is its own SSR page — **no modal**.

---

## Page structure

```tsx
<Surface className="mx-auto max-w-7xl ..." variant="transparent">
  <PageHero eyebrow="Admin" headline="New event" />

  <Card>
    <Card.Content>
      <form method="post" action={localizedPath(locale, "admin/events/new")}>
        {/* HeroUI form fields */}
        <Button type="submit" className="button button--primary button--md">
          Create event
        </Button>
      </form>
    </Card.Content>
  </Card>
</Surface>
```

---

## Form fields (from schema)

| Field | HeroUI | Notes |
|---|---|---|
| Title DE/EN | `TextField` or `Input` | Required |
| Description | multiline input | |
| Date/time | `Input type="datetime-local"` | Europe/Berlin |
| Credit price | `Input type="number"` | |
| Capacity | `Input type="number"` | |
| Partner | `Select` | Admin picks partner |
| Category | `Select` | |
| Hero image | file input + URL paste | `@unveiled/images` → 6 WebP variants |
| Ticket type | `RadioGroup` | SECRET_CODE / VOUCHER |

---

## Validation UX

- POST handler validates server-side
- On error: re-render same route with `422` and field errors in SSR HTML
- Associate errors: `aria-describedby` on fields
- No client-only validation as sole gate

---

## Styling

- Form fields use theme `--field-*` tokens (grey bg, dark border, zero radius)
- Submit: `button button--primary`
- Cancel: `Link` with `button button--secondary` back to list
- Add `.admin-event-form` block to `globals.css` if field spacing needs tuning — not Tailwind colors

---

## Authorization

- Route guarded by `@unveiled/auth` — `ADMIN` role only
- Partner events use `/partner/events/*` with `partnerId` from session (Phase 8)

---

## Do not

- Open create/edit in a Drawer or Modal
- POST via `fetch` from client
- Store images as base64 in DB
- Skip image variant pipeline
