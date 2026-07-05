import { type Db, subscriptions, type User, users } from "@unveiled/db";
import { eq } from "drizzle-orm";

import type { NeonAuthUser, ProvisionProfile } from "./types";

const STARTER_CREDITS = 17;
const STARTER_PLAN = "BASIC_BERLIN";

function parseName(name?: string | null): Pick<ProvisionProfile, "firstName" | "lastName"> {
  if (!name?.trim()) {
    return {};
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0] };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

async function ensureSubscription(db: Db, userId: string): Promise<void> {
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  if (existing) {
    return;
  }

  await db
    .insert(subscriptions)
    .values({
      userId,
      status: "INACTIVE",
      plan: STARTER_PLAN,
    })
    .onConflictDoNothing({ target: subscriptions.userId });
}

export async function provisionNewUser(
  db: Db,
  neonAuthUser: NeonAuthUser,
  profile?: ProvisionProfile,
): Promise<User> {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, neonAuthUser.id),
  });

  if (existing) {
    await ensureSubscription(db, existing.id);
    return existing;
  }

  const parsedName = parseName(neonAuthUser.name);
  const firstName = profile?.firstName ?? parsedName.firstName ?? null;
  const lastName = profile?.lastName ?? parsedName.lastName ?? null;

  const inserted = await db
    .insert(users)
    .values({
      id: neonAuthUser.id,
      email: neonAuthUser.email,
      emailVerified: neonAuthUser.emailVerified ?? false,
      role: "USER",
      credits: STARTER_CREDITS,
      profile: {
        first_name: firstName,
        last_name: lastName,
        onboarding_complete: false,
      },
    })
    .onConflictDoNothing({ target: users.id })
    .returning();

  if (inserted[0]) {
    await ensureSubscription(db, inserted[0].id);
    return inserted[0];
  }

  const row = await db.query.users.findFirst({
    where: eq(users.id, neonAuthUser.id),
  });

  if (!row) {
    throw new Error(`Failed to provision user ${neonAuthUser.id}`);
  }

  await ensureSubscription(db, row.id);
  return row;
}
