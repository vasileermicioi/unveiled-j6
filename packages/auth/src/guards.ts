import type { MiddlewareHandler } from "hono";

import { getSession } from "./session";
import type { AuthOptions, UserRole } from "./types";

export function requireAuth(options: AuthOptions): MiddlewareHandler {
  return async (c, next) => {
    const session = await getSession(c, options);
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("session", session);
    await next();
  };
}

export function requireRole(options: AuthOptions, ...roles: UserRole[]): MiddlewareHandler {
  return async (c, next) => {
    const session = await getSession(c, options);
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!roles.includes(session.user.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    c.set("session", session);
    await next();
  };
}

export function optionalSession(options: AuthOptions): MiddlewareHandler {
  return async (c, next) => {
    const session = await getSession(c, options);
    c.set("session", session);
    await next();
  };
}
