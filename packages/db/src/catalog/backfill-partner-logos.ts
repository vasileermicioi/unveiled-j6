import { eq, isNull } from "drizzle-orm";

import type { Db } from "../index";
import { partners } from "../schema/partners";
import { persistPrebuiltImage } from "./images";

export type BackfillPartnerLogosOptions = {
  skipUpload?: boolean;
  dryRun?: boolean;
};

export type BackfillPartnerLogosResult = {
  found: number;
  updated: number;
  dryRun: boolean;
};

/**
 * Attach solid five-variant WebP placeholders for partners with NULL logo_image_id.
 * Uses dynamic import of `@unveiled/images/offline` — Bun/scripts only; do not call from Workers.
 */
export async function backfillNullPartnerLogos(
  db: Db,
  options: BackfillPartnerLogosOptions = {},
): Promise<BackfillPartnerLogosResult> {
  const nullLogoPartners = await db
    .select({ id: partners.id, name: partners.name })
    .from(partners)
    .where(isNull(partners.logoImageId));

  if (nullLogoPartners.length === 0) {
    return { found: 0, updated: 0, dryRun: Boolean(options.dryRun) };
  }

  if (options.dryRun) {
    return {
      found: nullLogoPartners.length,
      updated: 0,
      dryRun: true,
    };
  }

  const { bufferToPrebuiltVariants, createSolidWebp } = await import("@unveiled/images/offline");
  const solid = createSolidWebp(800, 420, { r: 250, g: 255, b: 134 });
  let updated = 0;

  for (const row of nullLogoPartners) {
    const prebuilt = await bufferToPrebuiltVariants(solid, { source: "UPLOAD" });
    const logoImageId = await persistPrebuiltImage(db, prebuilt, {
      skipUpload: options.skipUpload,
    });
    await db
      .update(partners)
      .set({ logoImageId, updatedAt: new Date() })
      .where(eq(partners.id, row.id));
    updated += 1;
  }

  return { found: nullLogoPartners.length, updated, dryRun: false };
}
