import { and, count, eq, isNull } from "drizzle-orm";

import type { Db } from "../index";
import { bookings } from "../schema/bookings";
import { savedEvents } from "../schema/saved-events";
import { type Subscription, subscriptions } from "../schema/subscriptions";
import { type User, users } from "../schema/users";
import { waitlistEntries } from "../schema/waitlist-entries";

import { AdminMemberError } from "./errors";

export type MemberDetail = {
  user: User;
  subscription: Subscription | null;
  counts: {
    bookings: number;
    waitlistEntries: number;
    savedEvents: number;
  };
};

export async function getMemberDetail(db: Db, userId: string): Promise<MemberDetail> {
  const user =
    (await db.query.users.findFirst({
      where: and(eq(users.id, userId), isNull(users.deletedAt)),
    })) ?? null;

  if (!user) {
    throw new AdminMemberError("USER_NOT_FOUND", "Member not found");
  }

  const subscription =
    (await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    })) ?? null;

  const [[bookingRow], [waitlistRow], [savedRow]] = await Promise.all([
    db.select({ value: count() }).from(bookings).where(eq(bookings.userId, userId)),
    db.select({ value: count() }).from(waitlistEntries).where(eq(waitlistEntries.userId, userId)),
    db.select({ value: count() }).from(savedEvents).where(eq(savedEvents.userId, userId)),
  ]);

  return {
    user,
    subscription,
    counts: {
      bookings: bookingRow?.value ?? 0,
      waitlistEntries: waitlistRow?.value ?? 0,
      savedEvents: savedRow?.value ?? 0,
    },
  };
}
