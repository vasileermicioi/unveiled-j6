import { describe, expect, test } from "bun:test";
import { createDb, users } from "@unveiled/db";
import { eq } from "drizzle-orm";
import {
  isEventSaved,
  listMemberFeedEvents,
  listMemberFeedMapEvents,
  listSavedUpcomingEvents,
  saveEvent,
} from "./discovery";
import { CatalogValidationError } from "./errors";
import {
  countEvents,
  createEvent,
  deleteEvent,
  getEventById,
  getPublicEventById,
  listBookableEventsForSitemap,
  listEvents,
  listUpcomingEvents,
  setEventPublished,
} from "./events";
import {
  addFeaturedEvent,
  listFeaturedEvents,
  removeFeaturedEvent,
  setFeaturedEventPublished,
} from "./featured-events";
import {
  addFeaturedPartner,
  listFeaturedPartners,
  removeFeaturedPartner,
  setFeaturedPartnerPublished,
} from "./featured-partners";
import { createPartner, deletePartner } from "./partners";
import { createTestImagePrebuilt } from "./test-image";
import { structuredLocationFromAddress } from "./test-location";

const databaseUrl = process.env.DATABASE_URL;

function eventInput(partnerId: string, title: string, secretCode: string, dateTime: Date) {
  return {
    partnerId,
    title,
    description: "Description",
    ...structuredLocationFromAddress("Publishstraße 1, Berlin"),
    country: "DE" as const,
    city: "berlin",
    zipCode: "10115",
    category: "theater",
    eventType: "theater_play",
    dateTimes: [dateTime],
    creditPrice: 1,
    secretCode,
    imagePrebuilt: createTestImagePrebuilt(),
    skipUpload: true,
  };
}

describe("catalog published flags", () => {
  test("draft is admin-visible, publicly missing, and omitted from sitemap/upcoming", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const now = new Date("2026-07-09T14:00:00.000Z");
    const partner = await createPartner(db, {
      name: `Publish Partner ${suffix}`,
      ...structuredLocationFromAddress("Publishstraße 1, Berlin"),
      contactEmail: `publish-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const draft = await createEvent(
      db,
      eventInput(
        partner.id,
        `Draft ${suffix}`,
        `DR${suffix.slice(0, 6)}`,
        new Date("2026-07-20T18:00:00.000Z"),
      ),
    );
    const live = await createEvent(
      db,
      eventInput(
        partner.id,
        `Live ${suffix}`,
        `LV${suffix.slice(0, 6)}`,
        new Date("2026-07-21T18:00:00.000Z"),
      ),
    );
    await setEventPublished(db, live.id, true);

    try {
      expect(draft.published).toBe(false);
      expect(await getEventById(db, draft.id)).not.toBeNull();
      expect(await getPublicEventById(db, draft.id)).toBeNull();
      expect((await getPublicEventById(db, live.id))?.id).toBe(live.id);

      const adminIds = (await listEvents(db, { q: suffix, limit: 20 })).map((row) => row.id);
      expect(adminIds).toContain(draft.id);
      expect(adminIds).toContain(live.id);

      const draftIds = (await listEvents(db, { q: suffix, published: false, limit: 20 })).map(
        (row) => row.id,
      );
      expect(draftIds).toContain(draft.id);
      expect(draftIds).not.toContain(live.id);
      expect(await countEvents(db, { q: suffix, published: false })).toBe(draftIds.length);

      const publishedIds = (await listEvents(db, { q: suffix, published: true, limit: 20 })).map(
        (row) => row.id,
      );
      expect(publishedIds).toContain(live.id);
      expect(publishedIds).not.toContain(draft.id);

      const sitemapIds = (await listBookableEventsForSitemap(db, { now })).map((row) => row.id);
      expect(sitemapIds).not.toContain(draft.id);
      expect(sitemapIds).toContain(live.id);

      const upcomingIds = (await listUpcomingEvents(db, { now, limit: 50 })).map((row) => row.id);
      expect(upcomingIds).not.toContain(draft.id);
      expect(upcomingIds).toContain(live.id);

      await expect(setEventPublished(db, crypto.randomUUID(), true)).rejects.toMatchObject({
        code: "EVENT_NOT_FOUND",
      });
      const noop = await setEventPublished(db, draft.id, false);
      expect(noop.id).toBe(draft.id);
      expect(noop.published).toBe(false);
    } finally {
      await deleteEvent(db, draft.id, { skipBucket: true });
      await deleteEvent(db, live.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });

  test("unpublished events are hidden from feed, map, saved-upcoming, and save", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const now = new Date("2026-07-09T14:00:00.000Z");
    const userId = `publish-save-${suffix}`;
    const partner = await createPartner(db, {
      name: `Publish Feed ${suffix}`,
      ...structuredLocationFromAddress("Publishstraße 1, Berlin"),
      contactEmail: `publish-feed-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const draft = await createEvent(
      db,
      eventInput(
        partner.id,
        `Feed Draft ${suffix}`,
        `FD${suffix.slice(0, 6)}`,
        new Date("2026-07-20T18:00:00.000Z"),
      ),
    );
    const live = await createEvent(
      db,
      eventInput(
        partner.id,
        `Feed Live ${suffix}`,
        `FL${suffix.slice(0, 6)}`,
        new Date("2026-07-21T18:00:00.000Z"),
      ),
    );
    await setEventPublished(db, live.id, true);

    try {
      await db.insert(users).values({
        id: userId,
        email: `${userId}@example.com`,
        emailVerified: false,
        role: "USER",
        credits: 17,
      });

      const feedIds = (await listMemberFeedEvents(db, { now, title: suffix })).items.map(
        (row) => row.id,
      );
      expect(feedIds).not.toContain(draft.id);
      expect(feedIds).toContain(live.id);

      const mapIds = (await listMemberFeedMapEvents(db, { now, title: suffix })).items.map(
        (row) => row.id,
      );
      expect(mapIds).not.toContain(draft.id);
      expect(mapIds).toContain(live.id);

      await expect(saveEvent(db, userId, draft.id)).rejects.toBeInstanceOf(CatalogValidationError);
      expect(await isEventSaved(db, userId, draft.id)).toBe(false);

      await saveEvent(db, userId, live.id);
      await setEventPublished(db, live.id, false);
      expect(await isEventSaved(db, userId, live.id)).toBe(true);
      const saved = await listSavedUpcomingEvents(db, userId, now);
      expect(saved.map((row) => row.id)).not.toContain(live.id);
    } finally {
      await deleteEvent(db, draft.id, { skipBucket: true });
      await deleteEvent(db, live.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  test("featured publishedOnly follows catalog published; add is live; unpublish keeps membership", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const partner = await createPartner(db, {
      name: `Publish Featured ${suffix}`,
      ...structuredLocationFromAddress("Publishstraße 1, Berlin"),
      contactEmail: `publish-feat-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });
    const otherPartner = await createPartner(db, {
      name: `Publish Other ${suffix}`,
      ...structuredLocationFromAddress("Publishstraße 2, Berlin"),
      contactEmail: `publish-other-${suffix}@example.com`,
      logoPrebuilt: createTestImagePrebuilt(),
      skipUpload: true,
    });

    const catalogDraft = await createEvent(
      db,
      eventInput(
        partner.id,
        `Feat Catalog Draft ${suffix}`,
        `CD${suffix.slice(0, 6)}`,
        new Date("2026-07-20T18:00:00.000Z"),
      ),
    );
    const featuredDraft = await createEvent(
      db,
      eventInput(
        partner.id,
        `Feat Row Draft ${suffix}`,
        `RD${suffix.slice(0, 6)}`,
        new Date("2026-07-21T18:00:00.000Z"),
      ),
    );
    const bothLive = await createEvent(
      db,
      eventInput(
        partner.id,
        `Feat Both Live ${suffix}`,
        `BL${suffix.slice(0, 6)}`,
        new Date("2026-07-22T18:00:00.000Z"),
      ),
    );
    await setEventPublished(db, featuredDraft.id, true);
    await setEventPublished(db, bothLive.id, true);

    try {
      await addFeaturedEvent(db, catalogDraft.id);
      await addFeaturedEvent(db, featuredDraft.id);
      await addFeaturedEvent(db, bothLive.id);

      await addFeaturedPartner(db, partner.id);
      await addFeaturedPartner(db, otherPartner.id);

      const adminFeatured = await listFeaturedEvents(db);
      const adminEventIds = adminFeatured.map((row) => row.id);
      expect(adminEventIds).toContain(catalogDraft.id);
      expect(adminEventIds).toContain(featuredDraft.id);
      expect(adminEventIds).toContain(bothLive.id);

      const catalogDraftRow = adminFeatured.find((row) => row.id === catalogDraft.id);
      const featuredDraftRow = adminFeatured.find((row) => row.id === featuredDraft.id);
      const bothLiveRow = adminFeatured.find((row) => row.id === bothLive.id);
      expect(catalogDraftRow?.published).toBe(false);
      expect(catalogDraftRow?.featuredPublished).toBe(false);
      expect(featuredDraftRow?.published).toBe(true);
      expect(featuredDraftRow?.featuredPublished).toBe(false);
      expect(bothLiveRow?.published).toBe(true);
      expect(bothLiveRow?.featuredPublished).toBe(false);

      const discoverEventIds = (await listFeaturedEvents(db, { publishedOnly: true })).map(
        (row) => row.id,
      );
      expect(discoverEventIds).not.toContain(catalogDraft.id);
      expect(discoverEventIds).toContain(featuredDraft.id);
      expect(discoverEventIds).toContain(bothLive.id);

      const adminPartners = await listFeaturedPartners(db);
      const adminPartnerIds = adminPartners.map((row) => row.id);
      expect(adminPartnerIds).toContain(partner.id);
      expect(adminPartnerIds).toContain(otherPartner.id);

      const discoverPartnerIds = (await listFeaturedPartners(db, { publishedOnly: true })).map(
        (row) => row.id,
      );
      expect(discoverPartnerIds).toContain(partner.id);
      expect(discoverPartnerIds).toContain(otherPartner.id);

      await setEventPublished(db, bothLive.id, false);
      const afterUnpublish = (await listFeaturedEvents(db, { publishedOnly: true })).map(
        (row) => row.id,
      );
      expect(afterUnpublish).not.toContain(bothLive.id);
      expect((await listFeaturedEvents(db)).map((row) => row.id)).toContain(bothLive.id);

      await expect(setFeaturedEventPublished(db, crypto.randomUUID(), true)).rejects.toMatchObject({
        code: "EVENT_NOT_FOUND",
      });
      await expect(
        setFeaturedPartnerPublished(db, crypto.randomUUID(), true),
      ).rejects.toMatchObject({
        code: "PARTNER_NOT_FOUND",
      });
    } finally {
      await removeFeaturedEvent(db, catalogDraft.id);
      await removeFeaturedEvent(db, featuredDraft.id);
      await removeFeaturedEvent(db, bothLive.id);
      await removeFeaturedPartner(db, partner.id);
      await removeFeaturedPartner(db, otherPartner.id);
      await deleteEvent(db, catalogDraft.id, { skipBucket: true });
      await deleteEvent(db, featuredDraft.id, { skipBucket: true });
      await deleteEvent(db, bothLive.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
      await deletePartner(db, otherPartner.id, { skipBucket: true });
    }
  });
});
