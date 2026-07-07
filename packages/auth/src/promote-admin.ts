import { type Db, type User, users } from "@unveiled/db";
import { eq } from "drizzle-orm";

function parseAdminPromoteEmails(): string[] {
  const raw = process.env.ADMIN_PROMOTE_EMAILS;
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function maybePromoteAdminByEmail(db: Db, row: User): Promise<User> {
  if (row.role === "ADMIN") {
    return row;
  }

  const emails = parseAdminPromoteEmails();
  if (emails.length === 0 || !emails.includes(row.email.toLowerCase())) {
    return row;
  }

  if (row.role !== "USER") {
    return row;
  }

  const [updated] = await db
    .update(users)
    .set({ role: "ADMIN", updatedAt: new Date() })
    .where(eq(users.id, row.id))
    .returning();

  return updated ?? row;
}
