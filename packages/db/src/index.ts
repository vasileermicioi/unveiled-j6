import { neon, Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

/** Neon HTTP client — reads and simple single-statement writes. Not for interactive transactions. */
export function createDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzleHttp(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;

/**
 * WebSocket Pool client — multi-statement transactions and `SELECT … FOR UPDATE`.
 * Prefer this for booking and webhook ledger writes. Create/end the pool per request on Workers.
 */
export function createTxDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  const db = drizzleServerless(pool, { schema });
  return Object.assign(db, { pool });
}

export type TxDb = ReturnType<typeof createTxDb>;

export * from "./admin";
export * from "./booking";
export * from "./catalog";
export * from "./schema";
export * from "./waitlist";
/** Re-export for packages that write against `@unveiled/db` schema without a second drizzle-orm copy. */
export { eq };
