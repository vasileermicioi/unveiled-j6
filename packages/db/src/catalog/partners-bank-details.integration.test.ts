import { describe, expect, test } from "bun:test";
import { createDb } from "@unveiled/db";

import { createPartner, deletePartner, getPartnerById, updatePartner } from "./partners";
import { createTestImagePrebuilt } from "./test-image";
import { structuredLocationFromAddress } from "./test-location";

const databaseUrl = process.env.DATABASE_URL;

describe("partner bank details integration", () => {
  test("persist, omit, and clear", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const suffix = crypto.randomUUID().slice(0, 8);
    const details = "IBAN DE89 3704 0044 0532 0130 00\nKontoinhaber Ada";

    const omitted = await createPartner(db, {
      name: `Bank Omit ${suffix}`,
      ...structuredLocationFromAddress("Bank Straße 1, Berlin"),
      contactEmail: `bank-omit-${suffix}@example.com`,
      logoPrebuilt: await createTestImagePrebuilt(),
      skipUpload: true,
    });

    try {
      expect(omitted.bankDetails).toBeNull();

      const created = await createPartner(db, {
        name: `Bank Set ${suffix}`,
        ...structuredLocationFromAddress("Bank Straße 2, Berlin"),
        contactEmail: `bank-set-${suffix}@example.com`,
        logoPrebuilt: await createTestImagePrebuilt(),
        skipUpload: true,
        bankDetails: `  ${details}  `,
      });

      try {
        expect(created.bankDetails).toBe(details);

        const leftAlone = await updatePartner(db, created.id, { name: created.name });
        expect(leftAlone.bankDetails).toBe(details);

        const cleared = await updatePartner(db, created.id, { bankDetails: "   " });
        expect(cleared.bankDetails).toBeNull();

        const reloaded = await getPartnerById(db, created.id);
        expect(reloaded?.bankDetails).toBeNull();
      } finally {
        await deletePartner(db, created.id, { skipBucket: true });
      }
    } finally {
      await deletePartner(db, omitted.id, { skipBucket: true });
    }
  });
});
