import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import { createDb, eventVoucherCodes } from "../index";
import { CatalogValidationError } from "./errors";
import { createEvent, deleteEvent } from "./events";
import { createPartner, deletePartner } from "./partners";
import { createTestImagePrebuilt } from "./test-image";
import { structuredLocationFromAddress } from "./test-location";
import {
  appendPromoCodes,
  getVoucherInventoryCounts,
  replaceUnusedPromoCodes,
} from "./voucher-inventory";

const databaseUrl = process.env.DATABASE_URL;

describe("voucher inventory catalog (integration)", () => {
  test("append rejects duplicates; replace-unused keeps ALLOCATED", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping voucher inventory integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const logo = await createTestImagePrebuilt();
    const image = await createTestImagePrebuilt();

    const partner = await createPartner(db, {
      name: `Inv Venue ${suffix}`,
      ...structuredLocationFromAddress("Teststraße 1, Berlin"),
      contactEmail: `inv-${suffix}@example.com`,
      logoPrebuilt: logo,
      skipUpload: true,
    });

    const event = await createEvent(db, {
      partnerId: partner.id,
      title: `Inv Event ${suffix}`,
      description: "Description",
      ...structuredLocationFromAddress("Teststraße 1, Berlin"),
      country: "DE",
      city: "berlin",
      zipCode: "10115",
      category: "Theater",
      eventType: "Performance",
      dateTime: new Date(Date.now() + 86_400_000),
      creditPrice: 1,
      ticketType: "VOUCHER_PROMO",
      eventWebsiteUrl: "https://example.com/event",
      imagePrebuilt: image,
      skipUpload: true,
    });

    try {
      await appendPromoCodes(db, event.id, [`A-${suffix}`, `B-${suffix}`]);
      let counts = await getVoucherInventoryCounts(db, event.id);
      expect(counts.promo.available).toBe(2);
      expect(counts.promo.allocated).toBe(0);

      try {
        await appendPromoCodes(db, event.id, [`A-${suffix}`]);
        expect.unreachable("duplicate append should fail");
      } catch (error) {
        expect(error).toBeInstanceOf(CatalogValidationError);
        expect((error as CatalogValidationError).code).toBe("DUPLICATE_VOUCHER_CODE");
      }

      await db
        .update(eventVoucherCodes)
        .set({ status: "ALLOCATED" })
        .where(eq(eventVoucherCodes.code, `A-${suffix}`));

      await replaceUnusedPromoCodes(db, event.id, [`C-${suffix}`, `D-${suffix}`]);
      counts = await getVoucherInventoryCounts(db, event.id);
      expect(counts.promo.allocated).toBe(1);
      expect(counts.promo.available).toBe(2);

      const rows = await db
        .select()
        .from(eventVoucherCodes)
        .where(eq(eventVoucherCodes.eventId, event.id));
      expect(rows.some((row) => row.code === `A-${suffix}` && row.status === "ALLOCATED")).toBe(
        true,
      );
      expect(rows.some((row) => row.code === `B-${suffix}`)).toBe(false);
    } finally {
      await db.delete(eventVoucherCodes).where(eq(eventVoucherCodes.eventId, event.id));
      await deleteEvent(db, event.id, { skipBucket: true });
      await deletePartner(db, partner.id, { skipBucket: true });
    }
  });
});
