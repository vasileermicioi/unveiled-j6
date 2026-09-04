import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lt,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";

import { berlinInclusiveDateRange, getBerlinCalendarDate } from "../catalog/datetime";
import type { Db } from "../index";
import { bookings } from "../schema/bookings";
import {
  type SubscriptionStatus,
  subscriptionStatusEnum,
  subscriptions,
} from "../schema/subscriptions";
import { type User, type UserRole, userRoleEnum, users } from "../schema/users";

/** URL-stable sort keys for the admin member list. */
export type MemberSort =
  | "member"
  | "role"
  | "subscription"
  | "credits"
  | "bookings"
  | "eventOpens"
  | "created";

export type MemberSortDir = "asc" | "desc";

export type ListMembersOptions = {
  q?: string;
  role?: UserRole;
  subscription?: SubscriptionStatus | "NONE";
  creditsMin?: number;
  creditsMax?: number;
  bookingsMin?: number;
  bookingsMax?: number;
  eventOpensMin?: number;
  eventOpensMax?: number;
  /** YYYY-MM-DD Europe/Berlin day or Date; inclusive bounds. */
  createdFrom?: string | Date;
  /** YYYY-MM-DD Europe/Berlin day or Date; inclusive bounds. */
  createdTo?: string | Date;
  sort?: MemberSort;
  dir?: MemberSortDir;
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
  createdAt: Date;
  profile: User["profile"];
  behavior: User["behavior"];
};

/**
 * Display name for Membership HQ sort: trim(first_name || ' ' || last_name).
 * Empty names sort before named rows; email then id are stable tie-breakers.
 */
const displayNameExpr = sql`trim(coalesce(${users.profile}->>'first_name','') || ' ' || coalesce(${users.profile}->>'last_name',''))`;

/** Reused in select, WHERE, and ORDER BY so filter and sort semantics match. */
const bookingCountExpr = sql<number>`coalesce((select count(*)::int from ${bookings} where ${bookings.userId} = ${users.id}), 0)`;

/**
 * Members without the key count as 0. The regex guard keeps non-numeric
 * JSON values from throwing on `::int` (behavior is write-controlled, but
 * admin list URLs are user-editable so the domain never throws).
 */
const eventOpenCountExpr = sql<number>`(case when (${users.behavior}->>'event_open_count') ~ '^-?[0-9]+$' then ((${users.behavior}->>'event_open_count')::int) else 0 end)`;

const USER_ROLES: ReadonlySet<string> = new Set(userRoleEnum.enumValues);
const SUBSCRIPTION_STATUSES: ReadonlySet<string> = new Set(subscriptionStatusEnum.enumValues);
const MEMBER_SORTS: ReadonlySet<string> = new Set([
  "member",
  "role",
  "subscription",
  "credits",
  "bookings",
  "eventOpens",
  "created",
]);

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function rangeConditions(expr: SQL | typeof users.credits, min: unknown, max: unknown): SQL[] {
  const hasMin = isFiniteNumber(min);
  const hasMax = isFiniteNumber(max);
  if (!hasMin && !hasMax) {
    return [];
  }
  // Inverted range: ignore the pair rather than returning empty or throwing.
  if (hasMin && hasMax && (min as number) > (max as number)) {
    return [];
  }
  const conditions: SQL[] = [];
  if (hasMin) {
    conditions.push(gte(expr as SQL, min as number));
  }
  if (hasMax) {
    conditions.push(lte(expr as SQL, max as number));
  }
  return conditions;
}

function toBerlinYmd(value: string | Date | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return undefined;
    }
    return getBerlinCalendarDate(value);
  }
  const trimmed = value.trim();
  return YMD_RE.test(trimmed) ? trimmed : undefined;
}

function memberCreatedRangeCondition(options: {
  createdFrom?: string | Date;
  createdTo?: string | Date;
}): SQL[] {
  const fromSupplied = options.createdFrom !== undefined;
  const toSupplied = options.createdTo !== undefined;
  if (!fromSupplied && !toSupplied) {
    return [];
  }
  const fromYmd = toBerlinYmd(options.createdFrom);
  const toYmd = toBerlinYmd(options.createdTo);

  // A supplied but unparsable bound is ignored (that side treated as absent).
  // Both present but inverted -> omit the whole created predicate.
  if (fromYmd && toYmd && fromYmd > toYmd) {
    return [];
  }
  if (!fromYmd && !toYmd) {
    return [];
  }
  try {
    if (fromYmd && toYmd) {
      const range = berlinInclusiveDateRange(fromYmd, toYmd);
      return [gte(users.createdAt, range.start), lt(users.createdAt, range.end)];
    }
    if (fromYmd) {
      const range = berlinInclusiveDateRange(fromYmd, fromYmd);
      return [gte(users.createdAt, range.start)];
    }
    const range = berlinInclusiveDateRange(toYmd as string, toYmd as string);
    return [lt(users.createdAt, range.end)];
  } catch {
    return [];
  }
}

export type MemberListFilters = Omit<ListMembersOptions, "limit" | "offset" | "sort" | "dir">;

function memberListFilterConditions(options: MemberListFilters): SQL[] {
  const conditions: SQL[] = [isNull(users.deletedAt)];

  const search = memberSearchCondition(options.q);
  if (search) {
    conditions.push(search);
  }
  if (options.role && USER_ROLES.has(options.role)) {
    conditions.push(eq(users.role, options.role));
  }

  if (options.subscription === "NONE") {
    conditions.push(isNull(subscriptions.userId));
  } else if (options.subscription && SUBSCRIPTION_STATUSES.has(options.subscription)) {
    conditions.push(eq(subscriptions.status, options.subscription));
  }

  conditions.push(...rangeConditions(users.credits, options.creditsMin, options.creditsMax));
  conditions.push(...rangeConditions(bookingCountExpr, options.bookingsMin, options.bookingsMax));
  conditions.push(
    ...rangeConditions(eventOpenCountExpr, options.eventOpensMin, options.eventOpensMax),
  );
  conditions.push(...memberCreatedRangeCondition(options));

  return conditions;
}

function memberListOrderBy(sort: MemberSort | undefined, dir: MemberSortDir | undefined): SQL[] {
  const validSort = sort && MEMBER_SORTS.has(sort) ? sort : undefined;
  if (!validSort) {
    return [asc(displayNameExpr), asc(users.email), asc(users.id)];
  }
  const effectiveDir: MemberSortDir =
    dir === "asc" || dir === "desc"
      ? dir
      : validSort === "member" || validSort === "role" || validSort === "subscription"
        ? "asc"
        : "desc";
  const primary = effectiveDir === "desc" ? desc : asc;
  const tiebreak: SQL[] = [asc(displayNameExpr), asc(users.email), asc(users.id)];

  switch (validSort) {
    case "member":
      return [primary(displayNameExpr), asc(users.email), asc(users.id)];
    case "role":
      // Cast to text for alphabetical order (enum ordinal is USER,ADMIN,PARTNER).
      return [primary(sql`${users.role}::text`), ...tiebreak];
    case "subscription":
      // NULL (no subscription) sorts with default null ordering + tiebreak.
      return [primary(sql`${subscriptions.status}::text`), ...tiebreak];
    case "credits":
      return [primary(users.credits), ...tiebreak];
    case "bookings":
      return [primary(bookingCountExpr), ...tiebreak];
    case "eventOpens":
      return [primary(eventOpenCountExpr), ...tiebreak];
    case "created":
      return [primary(users.createdAt), ...tiebreak];
  }
}

export async function listMembers(
  db: Db,
  options: ListMembersOptions = {},
): Promise<MemberListItem[]> {
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;

  const conditions = memberListFilterConditions(options);

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      credits: users.credits,
      profile: users.profile,
      behavior: users.behavior,
      createdAt: users.createdAt,
      subscriptionStatus: subscriptions.status,
      bookingCount: bookingCountExpr,
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(and(...conditions))
    .orderBy(...memberListOrderBy(options.sort, options.dir))
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
    createdAt: row.createdAt,
    profile: row.profile,
    behavior: row.behavior,
  }));
}

export async function countMembers(db: Db, options: MemberListFilters = {}): Promise<number> {
  const conditions = memberListFilterConditions(options);

  const [row] = await db
    .select({ value: count() })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(and(...conditions));

  return row?.value ?? 0;
}
