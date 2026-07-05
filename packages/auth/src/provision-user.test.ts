import { describe, expect, test } from "bun:test";
import { createDb, subscriptions, users } from "@unveiled/db";
import { eq } from "drizzle-orm";

import { provisionNewUser } from "./provision-user";

const databaseUrl = process.env.DATABASE_URL;

describe("provisionNewUser", () => {
  test("creates starter USER and INACTIVE subscription", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const userId = `test-provision-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;

    try {
      const user = await provisionNewUser(db, {
        id: userId,
        email,
        emailVerified: true,
        name: "Test User",
      });

      expect(user.role).toBe("USER");
      expect(user.credits).toBe(17);
      expect(user.profile.onboarding_complete).toBe(false);

      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      });

      expect(subscription?.status).toBe("INACTIVE");
      expect(subscription?.plan).toBe("BASIC_BERLIN");

      const reprovisioned = await provisionNewUser(db, {
        id: userId,
        email,
      });

      expect(reprovisioned.id).toBe(userId);
    } finally {
      await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });
});
