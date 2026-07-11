# Authorization Matrix (MVP)

Default **deny**. Helpers: `requireAuth`, `requireRole`, `requireOwnerOrRole` (in `@unveiled/auth`). Aligns with [`sitemap/sitemap.md`](../sitemap/sitemap.md) and [`CHARTER.md`](../CHARTER.md).

**MVP personas:** Guest (unauthenticated), Member (`USER`), Admin (`ADMIN`). Partner column = **post-MVP** (appendix).

---

## Route-level (summary)

| Route / area | Guest | Member (`USER`) | Admin |
|---|---|---|---|
| Discover `/:locale`, marketing, legal | ✅ read | ✅ read | ✅ read |
| `/events/:id` (detail) | ✅ read | ✅ read | ✅ read |
| `/events`, `/events/map`, `/saved` | ❌ → login | ✅ | ✅ (or redirect to admin) |
| `/events/:id/book`, waitlist, bookings, profile | ❌ | ✅ (sub/credits gates apply) | support via admin tools |
| `/admin/*` | ❌ | ❌ | ✅ |
| `/partner/*`, `/checkin*` | — | — | **Post-MVP** |

---

## `users`

| Action | USER (self) | USER (other) | ADMIN |
|---|---|---|---|
| Read | ✅ | ❌ | ✅ |
| Create | ✅ signup | ❌ | ✅ (ops) |
| Update | ✅ profile only; ❌ role / credits / partnerId | ❌ | ✅ full |
| Delete | ❌ self hard-delete | ❌ | ✅ GDPR-assisted anonymization |

---

## `partners` (venues)

| Action | Guest | USER | ADMIN |
|---|---|---|---|
| Read (public display fields) | ✅ on Discover / event detail | ✅ | ✅ |
| Create / Update / Delete | ❌ | ❌ | ✅ |

---

## `events`

| Action | Guest | USER | ADMIN |
|---|---|---|---|
| Read public detail `/events/:id` | ✅ | ✅ | ✅ |
| Read member feed `/events` | ❌ | ✅ | ✅ |
| Create / Update / Delete | ❌ | ❌ | ✅ |

---

## `bookings`

| Action | USER (own) | USER (other) | ADMIN |
|---|---|---|---|
| Read | ✅ | ❌ | ✅ |
| Create | ✅ via atomic booking txn only | ❌ | ✅ comp-ticket path |
| Update / Cancel | limited self-cancel where specified | ❌ | ✅ |
| Delete | ❌ | ❌ | ✅ (retention rules apply) |

---

## `waitlist_entries`

| Action | USER (own) | USER (other) | ADMIN |
|---|---|---|---|
| Read | ✅ | ❌ | ✅ |
| Create | ✅ own | ❌ | ✅ |
| Update / promote | ❌ | ❌ | ✅ |
| Cancel own | ✅ | ❌ | ✅ |

---

## `credit_ledger` / `subscriptions` / `saved_events`

| Resource | USER (own) | ADMIN |
|---|---|---|
| Read | ✅ | ✅ |
| Write | via Membership/Booking domains only | ✅ adjust / refund / freeze paths |

---

## Storage (image uploads)

| Action | USER | ADMIN |
|---|---|---|
| Read public variants | ✅ | ✅ |
| Write (upload) | ❌ | ✅ |

---

## GDPR

| Action | USER (self) | ADMIN |
|---|---|---|
| Data export | ✅ | ✅ assisted |
| Account deletion (anonymize) | ✅ request flow | ✅ assisted |

---

## Appendix: post-MVP `PARTNER`

When partner portal ships: all partner reads/writes scoped by session `partnerId`; partner may CRUD own events and read/check-in own venue bookings; never cross-partner. Admin retains cross-partner visibility. See [`features/post-mvp/`](../features/post-mvp/) and the charter parking lot.
