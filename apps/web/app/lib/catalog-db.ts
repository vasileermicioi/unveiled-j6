import { createDb, type Db } from "@unveiled/db";

import { getEnvVar } from "./runtime-env";

let catalogDb: Db | null = null;

export function getCatalogDb(): Db | null {
  const connectionString = getEnvVar("DATABASE_URL");
  if (!connectionString) {
    return null;
  }

  if (!catalogDb) {
    catalogDb = createDb(connectionString);
  }

  return catalogDb;
}
