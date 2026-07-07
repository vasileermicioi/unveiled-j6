import { describe, expect, test } from "bun:test";
import { createDb, users } from "@unveiled/db";
import { eq } from "drizzle-orm";

import { maybePromoteAdminByEmail } from "./promote-admin";

const databaseUrl = process.env.DATABASE_URL;

describe("maybePromoteAdminByEmail", () => {
  test("promotes USER to ADMIN when email is listed in ADMIN_PROMOTE_EMAILS", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const original = process.env.ADMIN_PROMOTE_EMAILS;
    const db = createDb(databaseUrl);
    const userId = `test-promote-admin-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;

    process.env.ADMIN_PROMOTE_EMAILS = email;

    try {
      await db.insert(users).values({
        id: userId,
        email,
        emailVerified: true,
        role: "USER",
        credits: 17,
        profile: { onboarding_complete: false },
      });

      const promoted = await maybePromoteAdminByEmail(db, {
        id: userId,
        email,
        emailVerified: true,
        role: "USER",
        credits: 17,
        partnerId: null,
        profile: { onboarding_complete: false },
        behavior: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      expect(promoted.role).toBe("ADMIN");

      const row = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      expect(row?.role).toBe("ADMIN");
    } finally {
      process.env.ADMIN_PROMOTE_EMAILS = original;
      await db.delete(users).where(eq(users.id, userId));
    }
  });
});
