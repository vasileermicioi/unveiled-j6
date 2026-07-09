import { createSolidJpeg, readS3Env } from "@unveiled/images";
import { ilike } from "drizzle-orm";

import type { Db } from "../index";
import { events } from "../schema/events";
import { partners } from "../schema/partners";
import { createEvent, deleteEvent } from "./events";
import { createPartner, deletePartner } from "./partners";
import {
  ADMIN_LIST_PAGE_SIZE,
  buildPaginationEventInput,
  buildPaginationPartnerInput,
  DEFAULT_PAGINATION_EVENT_COUNT,
  DEFAULT_PAGINATION_PARTNER_COUNT,
  PAGINATION_EVENT_PREFIX,
  PAGINATION_PARTNER_PREFIX,
  paginationPageCount,
} from "./seed-pagination-data";

export type SeedAdminPaginationOptions = {
  partnerCount?: number;
  eventCount?: number;
  reset?: boolean;
  /** When true, skip R2 uploads (thumbnails will not load in admin lists). */
  skipUpload?: boolean;
};

export type SeedAdminPaginationResult = {
  partnersCreated: number;
  eventsCreated: number;
  partnerPages: number;
  eventPages: number;
  pageSize: number;
  searchTerm: string;
  imagesUploaded: boolean;
};

async function createSeedImageBuffer(index: number): Promise<Buffer> {
  return createSolidJpeg(800, 420, {
    r: 40 + ((index * 17) % 200),
    g: 80 + ((index * 23) % 150),
    b: 100 + ((index * 29) % 120),
  });
}

export function assertPaginationSeedImageEnv(skipUpload: boolean): void {
  if (skipUpload) {
    return;
  }

  readS3Env();
}

export async function resetPaginationSeed(
  db: Db,
  options: { skipBucket?: boolean } = {},
): Promise<{ partners: number; events: number }> {
  const paginationEvents = await db
    .select({ id: events.id })
    .from(events)
    .where(ilike(events.title, `${PAGINATION_EVENT_PREFIX}%`));

  for (const row of paginationEvents) {
    await deleteEvent(db, row.id, { skipBucket: options.skipBucket });
  }

  const paginationPartners = await db
    .select({ id: partners.id })
    .from(partners)
    .where(ilike(partners.name, `${PAGINATION_PARTNER_PREFIX}%`));

  for (const row of paginationPartners) {
    await deletePartner(db, row.id, { skipBucket: options.skipBucket });
  }

  return {
    partners: paginationPartners.length,
    events: paginationEvents.length,
  };
}

export async function runSeedAdminPagination(
  db: Db,
  options: SeedAdminPaginationOptions = {},
): Promise<SeedAdminPaginationResult> {
  const partnerCount = Math.max(0, options.partnerCount ?? DEFAULT_PAGINATION_PARTNER_COUNT);
  const eventCount = Math.max(0, options.eventCount ?? DEFAULT_PAGINATION_EVENT_COUNT);
  const skipUpload = options.skipUpload ?? false;

  assertPaginationSeedImageEnv(skipUpload);

  if (options.reset) {
    await resetPaginationSeed(db, { skipBucket: skipUpload });
  }

  const createdPartners = [];

  for (let index = 1; index <= partnerCount; index += 1) {
    const logoUpload = await createSeedImageBuffer(index);
    const partner = await createPartner(
      db,
      buildPaginationPartnerInput(index, logoUpload, skipUpload),
    );
    createdPartners.push(partner);
  }

  let eventsCreated = 0;
  if (eventCount > 0 && createdPartners.length === 0) {
    throw new Error("Cannot seed pagination events without at least one pagination partner.");
  }

  for (let index = 1; index <= eventCount; index += 1) {
    const partner = createdPartners[(index - 1) % createdPartners.length];
    if (!partner) {
      break;
    }

    const imageUpload = await createSeedImageBuffer(index + partnerCount);
    await createEvent(db, buildPaginationEventInput(partner.id, index, imageUpload, skipUpload));
    eventsCreated += 1;
  }

  return {
    partnersCreated: createdPartners.length,
    eventsCreated,
    partnerPages: paginationPageCount(createdPartners.length),
    eventPages: paginationPageCount(eventsCreated),
    pageSize: ADMIN_LIST_PAGE_SIZE,
    searchTerm: PAGINATION_PARTNER_PREFIX,
    imagesUploaded: !skipUpload,
  };
}

export function parseSeedAdminPaginationArgs(argv: string[]): SeedAdminPaginationOptions {
  const options: SeedAdminPaginationOptions = {};

  for (const arg of argv) {
    if (arg === "--reset") {
      options.reset = true;
      continue;
    }

    if (arg === "--skip-upload") {
      options.skipUpload = true;
      continue;
    }

    const partnersMatch = arg.match(/^--partners=(\d+)$/);
    if (partnersMatch) {
      options.partnerCount = Number.parseInt(partnersMatch[1] ?? "0", 10);
      continue;
    }

    const eventsMatch = arg.match(/^--events=(\d+)$/);
    if (eventsMatch) {
      options.eventCount = Number.parseInt(eventsMatch[1] ?? "0", 10);
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printSeedAdminPaginationHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function printSeedAdminPaginationHelp(): void {
  console.log(`Usage: bun run seed:admin-pagination [-- [options]]

Seeds synthetic partners and events for manual admin list pagination testing.
Rows are prefixed "${PAGINATION_PARTNER_PREFIX}" / "${PAGINATION_EVENT_PREFIX}".
Each row gets a generated logo/event image uploaded to R2 (requires Phase 4 env vars).

Options:
  --partners=N     Number of partners to create (default ${DEFAULT_PAGINATION_PARTNER_COUNT})
  --events=N       Number of events to create (default ${DEFAULT_PAGINATION_EVENT_COUNT})
  --reset          Delete existing pagination seed rows (and R2 objects) before inserting
  --skip-upload    Skip R2 uploads — faster, but admin list thumbnails will not load
  -h, --help       Show this help

Required env (unless --skip-upload): S3_* vars and IMAGE_PUBLIC_BASE_URL (see .env.example).

Admin list page size is fixed at ${ADMIN_LIST_PAGE_SIZE} (see ADMIN_LIST_PAGE_SIZE).
Use --partners=30 (or higher) to get multiple partner list pages.

Examples:
  bun run seed:admin-pagination
  bun run seed:admin-pagination -- --reset --partners=35 --events=40
`);
}
