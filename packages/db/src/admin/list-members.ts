import { and, asc, count, eq, ilike, isNull, or, type SQL, sql } from "drizzle-orm";

import type { Db } from "../index";
import { bookings } from "../schema/bookings";
import { type SubscriptionStatus, subscriptions } from "../schema/subscriptions";
import { type User, type UserRole, users } from "../schema/users";

export type ListMembersOptions = {
  q?: string;
  role?: UserRole;
  limit?: number;
  offset?: number;
};

export type MemberListItem = {
  id: string;
  email: string;
  role: UserRole;
  credits: number;
  subscriptionStatus: SubscriptionStatus | null;
  bookingCount: number;
  eventOpenCount: number | null;
  profile: User["profile"];
  behavior: User["behavior"];
};

/**
 * Display name for Membership HQ sort: trim(first_name || ' ' || last_name).
 * Empty names sort before named rows; email then id are stable tie-breakers.
 */
const displayNameExpr = sql`trim(coalesce(${users.profile}->>'first_name','') || ' ' || coalesce(${users.profile}->>'last_name',''))`;

function memberSearchCondition(q?: string): SQL | undefined {
  const search = q?.trim();
  if (!search) {
    return undefined;
  }

  const pattern = `%${search}%`;
  return or(
    ilike(users.email, pattern),
    sql`(${users.profile}->>'first_name') ILIKE ${pattern}`,
    sql`(${users.profile}->>'last_name') ILIKE ${pattern}`,
  );
}

export async function listMembers(
  db: Db,
  options: ListMembersOptions = {},
): Promise<MemberListItem[]> {
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;

  const conditions: SQL[] = [isNull(users.deletedAt)];
  const search = memberSearchCondition(options.q);
  if (search) {
    conditions.push(search);
  }
  if (options.role) {
    conditions.push(eq(users.role, options.role));
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      credits: users.credits,
      profile: users.profile,
      behavior: users.behavior,
      subscriptionStatus: subscriptions.status,
      bookingCount: sql<number>`coalesce((
        select count(*)::int from ${bookings}
        where ${bookings.userId} = ${users.id}
      ), 0)`,
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(and(...conditions))
    .orderBy(asc(displayNameExpr), asc(users.email), asc(users.id))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    credits: row.credits,
    subscriptionStatus: row.subscriptionStatus ?? null,
    bookingCount: Number(row.bookingCount),
    eventOpenCount:
      typeof row.behavior?.event_open_count === "number" ? row.behavior.event_open_count : null,
    profile: row.profile,
    behavior: row.behavior,
  }));
}

export async function countMembers(
  db: Db,
  options: Pick<ListMembersOptions, "q" | "role"> = {},
): Promise<number> {
  const conditions: SQL[] = [isNull(users.deletedAt)];
  const search = memberSearchCondition(options.q);
  if (search) {
    conditions.push(search);
  }
  if (options.role) {
    conditions.push(eq(users.role, options.role));
  }

  const [row] = await db
    .select({ value: count() })
    .from(users)
    .where(and(...conditions));

  return row?.value ?? 0;
}
