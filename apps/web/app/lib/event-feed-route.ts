import type { Context } from "hono";

import { guardActiveMemberFeedRoute, type MemberAppGuardResult } from "./member-app-route";

export type {
  MemberAppGuardFail as MemberFeedGuardFail,
  MemberAppGuardOk as MemberFeedGuardOk,
  MemberAppGuardResult as MemberFeedGuardResult,
} from "./member-app-route";

/**
 * Guard for `/events` list and `/events/map` — booking-eligible USER or ADMIN.
 * Guests → login; non-eligible USER → Discover.
 */
export async function guardMemberFeedRoute(c: Context): Promise<MemberAppGuardResult> {
  return guardActiveMemberFeedRoute(c);
}
