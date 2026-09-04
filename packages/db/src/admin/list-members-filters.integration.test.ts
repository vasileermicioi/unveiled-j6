import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import { createTestImagePrebuilt } from "../catalog/test-image";
import { structuredLocationFromAddress } from "../catalog/test-location";
import {
  bookings,
  countMembers,
  createDb,
  createEvent,
  createPartner,
  deleteEvent,
  deletePartner,
  listMembers,
  subscriptions,
  users,
} from "../index";

const databaseUrl = process.env.DATABASE_URL;

async function expectParity(
  db: ReturnType<typeof createDb>,
  filters: Parameters<typeof listMembers>[1],
  q: string,
) {
  const base = { q, limit: 50, ...(filters ?? {}) };
  const list = await listMembers(db, base);
  const count = await countMembers(db, { q, ...(filters ?? {}) });
  expect(count).toBe(list.length);
  return list;
}

describe("member list filters and sort (integration)", () => {
  test("filters by subscription including NONE with parity", async () => {
    if (!databaseUrl) {
      console.warn("Skipping member filters integration test (DATABASE_URL unset)");
      return;
    }
    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const activeId = `mf-sub-active-${suffix}`;
    const inactiveId = `mf-sub-inactive-${suffix}`;
    const noneId = `mf-sub-none-${suffix}`;

    try {
      await db.insert(users).values([
        {
          id: activeId,
          email: `active-${suffix}@example.com`,
          emailVerified: true,
          credits: 5,
          role: "USER",
          profile: { first_name: "Sub", last_name: `Active-${suffix.slice(0, 8)}` },
        },
        {
          id: inactiveId,
          email: `inactive-${suffix}@example.com`,
          emailVerified: true,
          credits: 5,
          role: "USER",
          profile: { first_name: "Sub", last_name: `Inactive-${suffix.slice(0, 8)}` },
        },
        {
          id: noneId,
          email: `none-${suffix}@example.com`,
          emailVerified: true,
          credits: 5,
          role: "USER",
          profile: { first_name: "Sub", last_name: `None-${suffix.slice(0, 8)}` },
        },
      ]);
      await db.insert(subscriptions).values([
        { userId: activeId, status: "ACTIVE" },
        { userId: inactiveId, status: "INACTIVE" },
      ]);

      const active = await expectParity(db, { subscription: "ACTIVE" }, suffix);
      expect(active.map((m) => m.id)).toEqual([activeId]);

      const none = await expectParity(db, { subscription: "NONE" }, suffix);
      expect(none.map((m) => m.id)).toEqual([noneId]);

      const inactive = await expectParity(db, { subscription: "INACTIVE" }, suffix);
      expect(inactive.map((m) => m.id)).toEqual([inactiveId]);

      const all = await expectParity(db, {}, suffix);
      expect(all.length).toBe(3);
    } finally {
      await db.delete(subscriptions).where(eq(subscriptions.userId, activeId));
      await db.delete(subscriptions).where(eq(subscriptions.userId, inactiveId));
      await db.delete(users).where(eq(users.id, activeId));
      await db.delete(users).where(eq(users.id, inactiveId));
      await db.delete(users).where(eq(users.id, noneId));
    }
  });

  test("filters by credits and event-open ranges with parity", async () => {
    if (!databaseUrl) {
      console.warn("Skipping member filters integration test (DATABASE_URL unset)");
      return;
    }
    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const lowId = `mf-num-low-${suffix}`;
    const midId = `mf-num-mid-${suffix}`;
    const highId = `mf-num-high-${suffix}`;

    try {
      await db.insert(users).values([
        {
          id: lowId,
          email: `low-${suffix}@example.com`,
          emailVerified: true,
          credits: 2,
          role: "USER",
          profile: { first_name: "Num", last_name: `Low-${suffix.slice(0, 8)}` },
          behavior: {},
        },
        {
          id: midId,
          email: `mid-${suffix}@example.com`,
          emailVerified: true,
          credits: 10,
          role: "USER",
          profile: { first_name: "Num", last_name: `Mid-${suffix.slice(0, 8)}` },
          behavior: { event_open_count: 3 },
        },
        {
          id: highId,
          email: `high-${suffix}@example.com`,
          emailVerified: true,
          credits: 17,
          role: "USER",
          profile: { first_name: "Num", last_name: `High-${suffix.slice(0, 8)}` },
          behavior: { event_open_count: 8 },
        },
      ]);

      const min10 = await expectParity(db, { creditsMin: 10 }, suffix);
      expect(min10.map((m) => m.id).sort()).toEqual([highId, midId].sort());

      const max10 = await expectParity(db, { creditsMax: 10 }, suffix);
      expect(max10.map((m) => m.id).sort()).toEqual([lowId, midId].sort());

      const range = await expectParity(db, { creditsMin: 10, creditsMax: 17 }, suffix);
      expect(range.map((m) => m.id).sort()).toEqual([highId, midId].sort());

      const opensMin = await expectParity(db, { eventOpensMin: 1 }, suffix);
      expect(opensMin.map((m) => m.id).sort()).toEqual([highId, midId].sort());

      const opensZero = await expectParity(db, { eventOpensMax: 0 }, suffix);
      expect(opensZero.map((m) => m.id)).toEqual([lowId]);

      const opensMid = await expectParity(db, { eventOpensMin: 1, eventOpensMax: 5 }, suffix);
      expect(opensMid.map((m) => m.id)).toEqual([midId]);
    } finally {
      await db.delete(users).where(eq(users.id, lowId));
      await db.delete(users).where(eq(users.id, midId));
      await db.delete(users).where(eq(users.id, highId));
    }
  });

  test("filters by booking-count range with parity", async () => {
    if (!databaseUrl) {
      console.warn("Skipping member filters integration test (DATABASE_URL unset)");
      return;
    }
    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const zeroId = `mf-book-zero-${suffix}`;
    const oneId = `mf-book-one-${suffix}`;
    const twoId = `mf-book-two-${suffix}`;

    const partner = await createPartner(db, {
      name: `Member Filter Venue ${suffix.slice(0, 8)}`,
      ...structuredLocationFromAddress("Teststraße 22, Berlin"),
      contactEmail: `mff-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });
    const event = await createEvent(db, {
      partnerId: partner.id,
      title: `Member Filter Event ${suffix.slice(0, 8)}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 22, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-09-01T18:00:00.000Z")],
      creditPrice: 2,
      totalCapacity: 20,
      secretCode: `MFF${suffix.slice(0, 6).toUpperCase()}`,
      imagePrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    try {
      await db.insert(users).values([
        {
          id: zeroId,
          email: `bzero-${suffix}@example.com`,
          emailVerified: true,
          credits: 5,
          role: "USER",
          profile: { first_name: "Book", last_name: `Zero-${suffix.slice(0, 8)}` },
        },
        {
          id: oneId,
          email: `bone-${suffix}@example.com`,
          emailVerified: true,
          credits: 5,
          role: "USER",
          profile: { first_name: "Book", last_name: `One-${suffix.slice(0, 8)}` },
        },
        {
          id: twoId,
          email: `btwo-${suffix}@example.com`,
          emailVerified: true,
          credits: 5,
          role: "USER",
          profile: { first_name: "Book", last_name: `Two-${suffix.slice(0, 8)}` },
        },
      ]);
      await db.insert(bookings).values([
        {
          userId: oneId,
          eventId: event.id,
          partnerId: partner.id,
          dateTime: event.dateTime,
          ticketsCount: 1,
          totalCredits: 2,
          status: "CONFIRMED",
          idempotencyKey: `mff-one-${suffix}`,
        },
        {
          userId: twoId,
          eventId: event.id,
          partnerId: partner.id,
          dateTime: event.dateTime,
          ticketsCount: 1,
          totalCredits: 2,
          status: "CONFIRMED",
          idempotencyKey: `mff-two-a-${suffix}`,
        },
        {
          userId: twoId,
          eventId: event.id,
          partnerId: partner.id,
          dateTime: new Date(event.dateTime.getTime() + 3_600_000),
          ticketsCount: 1,
          totalCredits: 2,
          status: "CONFIRMED",
          idempotencyKey: `mff-two-b-${suffix}`,
        },
      ]);

      const atLeastOne = await expectParity(db, { bookingsMin: 1 }, suffix);
      expect(atLeastOne.map((m) => m.id).sort()).toEqual([oneId, twoId].sort());

      const zeroOnly = await expectParity(db, { bookingsMax: 0 }, suffix);
      expect(zeroOnly.map((m) => m.id)).toEqual([zeroId]);

      const exactlyOne = await expectParity(db, { bookingsMin: 1, bookingsMax: 1 }, suffix);
      expect(exactlyOne.map((m) => m.id)).toEqual([oneId]);
    } finally {
      await db.delete(bookings).where(eq(bookings.userId, zeroId));
      await db.delete(bookings).where(eq(bookings.userId, oneId));
      await db.delete(bookings).where(eq(bookings.userId, twoId));
      await db.delete(users).where(eq(users.id, zeroId));
      await db.delete(users).where(eq(users.id, oneId));
      await db.delete(users).where(eq(users.id, twoId));
      await deleteEvent(db, event.id);
      await deletePartner(db, partner.id);
    }
  });

  test("filters by created Berlin-day range with parity", async () => {
    if (!databaseUrl) {
      console.warn("Skipping member filters integration test (DATABASE_URL unset)");
      return;
    }
    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const earlyId = `mf-created-early-${suffix}`;
    const midId = `mf-created-mid-${suffix}`;
    const lateId = `mf-created-late-${suffix}`;

    try {
      await db.insert(users).values([
        {
          id: earlyId,
          email: `early-${suffix}@example.com`,
          emailVerified: true,
          credits: 5,
          role: "USER",
          profile: { first_name: "Created", last_name: `Early-${suffix.slice(0, 8)}` },
          createdAt: new Date("2026-01-15T12:00:00.000Z"),
        },
        {
          id: midId,
          email: `mid-${suffix}@example.com`,
          emailVerified: true,
          credits: 5,
          role: "USER",
          profile: { first_name: "Created", last_name: `Mid-${suffix.slice(0, 8)}` },
          createdAt: new Date("2026-06-15T12:00:00.000Z"),
        },
        {
          id: lateId,
          email: `late-${suffix}@example.com`,
          emailVerified: true,
          credits: 5,
          role: "USER",
          profile: { first_name: "Created", last_name: `Late-${suffix.slice(0, 8)}` },
          createdAt: new Date("2026-12-15T12:00:00.000Z"),
        },
      ]);

      const window = await expectParity(
        db,
        { createdFrom: "2026-02-01", createdTo: "2026-11-30" },
        suffix,
      );
      expect(window.map((m) => m.id)).toEqual([midId]);

      const singleDay = await expectParity(
        db,
        { createdFrom: "2026-06-15", createdTo: "2026-06-15" },
        suffix,
      );
      expect(singleDay.map((m) => m.id)).toEqual([midId]);

      const fromOnly = await expectParity(db, { createdFrom: "2026-12-01" }, suffix);
      expect(fromOnly.map((m) => m.id)).toEqual([lateId]);

      const toOnly = await expectParity(db, { createdTo: "2026-02-01" }, suffix);
      expect(toOnly.map((m) => m.id)).toEqual([earlyId]);
    } finally {
      await db.delete(users).where(eq(users.id, earlyId));
      await db.delete(users).where(eq(users.id, midId));
      await db.delete(users).where(eq(users.id, lateId));
    }
  });

  test("sorts by every column in both directions", async () => {
    if (!databaseUrl) {
      console.warn("Skipping member filters integration test (DATABASE_URL unset)");
      return;
    }
    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const short = suffix.slice(0, 8);
    const aId = `mf-sort-a-${suffix}`;
    const bId = `mf-sort-b-${suffix}`;
    const cId = `mf-sort-c-${suffix}`;

    const partner = await createPartner(db, {
      name: `Member Sort Venue ${short}`,
      ...structuredLocationFromAddress("Teststraße 22, Berlin"),
      contactEmail: `mfs-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });
    const event = await createEvent(db, {
      partnerId: partner.id,
      title: `Member Sort Event ${short}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 22, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "theater",
      eventType: "theater_play",
      dateTimes: [new Date("2026-09-01T18:00:00.000Z")],
      creditPrice: 2,
      totalCapacity: 20,
      secretCode: `MFS${suffix.slice(0, 6).toUpperCase()}`,
      imagePrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    try {
      await db.insert(users).values([
        {
          id: aId,
          email: `anna-${suffix}@example.com`,
          emailVerified: true,
          credits: 2,
          role: "ADMIN",
          profile: { first_name: "Anna", last_name: `Sort-${short}` },
          behavior: { event_open_count: 1 },
          createdAt: new Date("2026-01-15T12:00:00.000Z"),
        },
        {
          id: bId,
          email: `ben-${suffix}@example.com`,
          emailVerified: true,
          credits: 10,
          role: "PARTNER",
          profile: { first_name: "Ben", last_name: `Sort-${short}` },
          behavior: { event_open_count: 5 },
          createdAt: new Date("2026-06-15T12:00:00.000Z"),
        },
        {
          id: cId,
          email: `cara-${suffix}@example.com`,
          emailVerified: true,
          credits: 17,
          role: "USER",
          profile: { first_name: "Cara", last_name: `Sort-${short}` },
          behavior: {},
          createdAt: new Date("2026-12-15T12:00:00.000Z"),
        },
      ]);
      await db.insert(subscriptions).values([
        { userId: aId, status: "ACTIVE" },
        { userId: bId, status: "INACTIVE" },
      ]);
      await db.insert(bookings).values([
        {
          userId: aId,
          eventId: event.id,
          partnerId: partner.id,
          dateTime: event.dateTime,
          ticketsCount: 1,
          totalCredits: 2,
          status: "CONFIRMED",
          idempotencyKey: `mfs-a1-${suffix}`,
        },
        {
          userId: aId,
          eventId: event.id,
          partnerId: partner.id,
          dateTime: new Date(event.dateTime.getTime() + 3_600_000),
          ticketsCount: 1,
          totalCredits: 2,
          status: "CONFIRMED",
          idempotencyKey: `mfs-a2-${suffix}`,
        },
        {
          userId: cId,
          eventId: event.id,
          partnerId: partner.id,
          dateTime: event.dateTime,
          ticketsCount: 1,
          totalCredits: 2,
          status: "CONFIRMED",
          idempotencyKey: `mfs-c1-${suffix}`,
        },
      ]);

      const order = async (sort?: string, dir?: string) =>
        (
          await listMembers(db, {
            q: suffix,
            limit: 50,
            sort: sort as never,
            dir: dir as never,
          })
        ).map((m) => m.id);

      expect(await order()).toEqual([aId, bId, cId]);
      expect(await order("member", "asc")).toEqual([aId, bId, cId]);
      expect(await order("member", "desc")).toEqual([cId, bId, aId]);

      expect(await order("role", "asc")).toEqual([aId, bId, cId]);
      expect(await order("role", "desc")).toEqual([cId, bId, aId]);

      expect(await order("subscription", "asc")).toEqual([aId, bId, cId]);
      expect(await order("subscription", "desc")).toEqual([cId, bId, aId]);

      expect(await order("credits", "asc")).toEqual([aId, bId, cId]);
      expect(await order("credits", "desc")).toEqual([cId, bId, aId]);

      // Bookings: B=0, C=1, A=2
      expect(await order("bookings", "asc")).toEqual([bId, cId, aId]);
      expect(await order("bookings", "desc")).toEqual([aId, cId, bId]);

      // Event opens: C=0, A=1, B=5
      expect(await order("eventOpens", "asc")).toEqual([cId, aId, bId]);
      expect(await order("eventOpens", "desc")).toEqual([bId, aId, cId]);

      expect(await order("created", "asc")).toEqual([aId, bId, cId]);
      expect(await order("created", "desc")).toEqual([cId, bId, aId]);
    } finally {
      await db.delete(bookings).where(eq(bookings.userId, aId));
      await db.delete(bookings).where(eq(bookings.userId, bId));
      await db.delete(bookings).where(eq(bookings.userId, cId));
      await db.delete(subscriptions).where(eq(subscriptions.userId, aId));
      await db.delete(subscriptions).where(eq(subscriptions.userId, bId));
      await db.delete(users).where(eq(users.id, aId));
      await db.delete(users).where(eq(users.id, bId));
      await db.delete(users).where(eq(users.id, cId));
      await deleteEvent(db, event.id);
      await deletePartner(db, partner.id);
    }
  });

  test("combined filter, sort, and pagination agree with count", async () => {
    if (!databaseUrl) {
      console.warn("Skipping member filters integration test (DATABASE_URL unset)");
      return;
    }
    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const short = suffix.slice(0, 8);
    const ids = [0, 1, 2, 3].map((n) => `mf-page-${n}-${suffix}`);
    const credits = [2, 5, 10, 17];
    const created = [
      "2026-02-01T12:00:00.000Z",
      "2026-04-01T12:00:00.000Z",
      "2026-08-01T12:00:00.000Z",
      "2026-10-01T12:00:00.000Z",
    ];
    const names = ["Anna", "Ben", "Cara", "Dana"];

    try {
      await db.insert(users).values(
        ids.map((id, n) => ({
          id,
          email: `page${n}-${suffix}@example.com`,
          emailVerified: true,
          credits: credits[n] as number,
          role: "USER" as const,
          profile: { first_name: names[n], last_name: `Page-${short}` },
          createdAt: new Date(created[n] as string),
        })),
      );
      await db.insert(subscriptions).values([
        { userId: ids[1] as string, status: "ACTIVE" },
        { userId: ids[2] as string, status: "ACTIVE" },
        { userId: ids[3] as string, status: "ACTIVE" },
      ]);

      const filters = {
        q: suffix,
        subscription: "ACTIVE" as const,
        creditsMin: 5,
        sort: "created" as const,
        dir: "desc" as const,
      };
      const total = await countMembers(db, {
        q: suffix,
        subscription: "ACTIVE",
        creditsMin: 5,
      });
      // ids[0] excluded (no subscription + credits 2); other three match.
      expect(total).toBe(3);

      const page1 = await listMembers(db, { ...filters, limit: 2, offset: 0 });
      expect(page1.map((m) => m.id)).toEqual([ids[3], ids[2]]);

      const page2 = await listMembers(db, { ...filters, limit: 2, offset: 2 });
      expect(page2.map((m) => m.id)).toEqual([ids[1]]);

      expect(page1.length + page2.length).toBe(total);
    } finally {
      for (const id of ids) {
        await db.delete(subscriptions).where(eq(subscriptions.userId, id));
        await db.delete(users).where(eq(users.id, id));
      }
    }
  });

  test("ignores invalid filter and sort input without throwing", async () => {
    if (!databaseUrl) {
      console.warn("Skipping member filters integration test (DATABASE_URL unset)");
      return;
    }
    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID();
    const u1 = `mf-invalid-1-${suffix}`;
    const u2 = `mf-invalid-2-${suffix}`;

    try {
      await db.insert(users).values([
        {
          id: u1,
          email: `inv1-${suffix}@example.com`,
          emailVerified: true,
          credits: 4,
          role: "USER",
          profile: { first_name: "Inv", last_name: `One-${suffix.slice(0, 8)}` },
        },
        {
          id: u2,
          email: `inv2-${suffix}@example.com`,
          emailVerified: true,
          credits: 12,
          role: "USER",
          profile: { first_name: "Inv", last_name: `Two-${suffix.slice(0, 8)}` },
        },
      ]);

      const garbage = {
        q: suffix,
        limit: 50,
        role: "NOPE",
        subscription: "BOGUS",
        creditsMin: Number.NaN,
        creditsMax: Number.POSITIVE_INFINITY,
        bookingsMin: Number.NaN,
        createdFrom: "not-a-date",
        createdTo: "also-bad",
        sort: "bogus",
        dir: "sideways",
      } as unknown as Parameters<typeof listMembers>[0];

      const list = await listMembers(db, garbage);
      expect(list.map((m) => m.id).sort()).toEqual([u1, u2].sort());
      const count = await countMembers(db, garbage);
      expect(count).toBe(2);

      const inverted = await listMembers(db, {
        q: suffix,
        limit: 50,
        creditsMin: 17,
        creditsMax: 2,
        createdFrom: "2026-12-01",
        createdTo: "2026-01-01",
      });
      expect(inverted.map((m) => m.id).sort()).toEqual([u1, u2].sort());

      // Valid predicates still apply alongside invalid ones.
      const mixed = await listMembers(db, {
        q: suffix,
        limit: 50,
        creditsMin: 10,
        subscription: "BOGUS" as never,
        sort: "bogus" as never,
      });
      expect(mixed.map((m) => m.id)).toEqual([u2]);
      expect(await countMembers(db, { q: suffix, creditsMin: 10 })).toBe(1);
    } finally {
      await db.delete(users).where(eq(users.id, u1));
      await db.delete(users).where(eq(users.id, u2));
    }
  });
});
