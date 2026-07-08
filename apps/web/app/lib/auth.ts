import {
  type AppSession,
  type AuthOptions,
  optionalSession as optionalSessionMiddleware,
  requireAuth as requireAuthMiddleware,
  requireRole as requireRoleMiddleware,
  getSession as resolveSession,
  type UserRole,
} from "@unveiled/auth";
import { createDb, type Db } from "@unveiled/db";
import type { Context, MiddlewareHandler } from "hono";

import { getEnvVar, resolveEnvVarFromContext, type RuntimeEnv } from "./runtime-env";

let db: Db | null = null;

function getDb(): Db {
  if (!db) {
    const connectionString = getEnvVar("DATABASE_URL");
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    db = createDb(connectionString);
  }
  return db;
}

function getAuthUrl(): string {
  const authUrl = getEnvVar("AUTH_URL");
  if (!authUrl) {
    throw new Error("AUTH_URL is not set");
  }
  return authUrl.replace(/\/$/, "");
}

export function getAuthOptions(): AuthOptions {
  return {
    db: getDb(),
    authUrl: getAuthUrl(),
  };
}

export async function getSession(c: Context): Promise<AppSession | null> {
  return resolveSession(c, getAuthOptions());
}

export async function getSessionIfConfigured(c: Context<{ Bindings: RuntimeEnv }>): Promise<AppSession | null> {
  if (
    !resolveEnvVarFromContext(c, "DATABASE_URL") ||
    !resolveEnvVarFromContext(c, "AUTH_URL")
  ) {
    return null;
  }

  return getSession(c);
}

export function requireAuth(): MiddlewareHandler {
  return requireAuthMiddleware(getAuthOptions());
}

export function requireRole(...roles: UserRole[]): MiddlewareHandler {
  return requireRoleMiddleware(getAuthOptions(), ...roles);
}

export function optionalSession(): MiddlewareHandler {
  return optionalSessionMiddleware(getAuthOptions());
}

export type { AppSession, SessionUser } from "@unveiled/auth";
