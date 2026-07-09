import type { Context } from "hono";

import { guardMemberAppRoute, type MemberAppGuardResult } from "./member-app-route";

export type {
  MemberAppGuardFail as MemberFeedGuardFail,
  MemberAppGuardOk as MemberFeedGuardOk,
  MemberAppGuardResult as MemberFeedGuardResult,
} from "./member-app-route";

/** @deprecated Prefer `guardMemberAppRoute` — kept as alias for feed call sites. */
export async function guardMemberFeedRoute(c: Context): Promise<MemberAppGuardResult> {
  return guardMemberAppRoute(c);
}
