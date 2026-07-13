import { createTxDb, type TxDb } from "@unveiled/db";
import type { Context } from "hono";

import { resolveEnvVarFromContext } from "./runtime-env";

/**
 * Run an admin write that needs interactive transactions (`SELECT … FOR UPDATE`).
 * Ends the Neon pool after the callback settles.
 */
export async function withAdminTxDb<T>(c: Context, fn: (txDb: TxDb) => Promise<T>): Promise<T> {
  const databaseUrl = resolveEnvVarFromContext(c, "DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const txDb = createTxDb(databaseUrl);
  try {
    return await fn(txDb);
  } finally {
    await txDb.pool.end().catch(() => undefined);
  }
}
