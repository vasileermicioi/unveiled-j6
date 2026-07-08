import { createDb, type Db } from "@unveiled/db";

let catalogDb: Db | null = null;

export function getCatalogDb(): Db | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!catalogDb) {
    catalogDb = createDb(connectionString);
  }

  return catalogDb;
}
