import { and, count, eq, inArray } from "drizzle-orm";

import type { Db } from "../index";
import { type EventVoucherCode, eventVoucherCodes } from "../schema/event-voucher-codes";
import { type EventVoucherPdf, eventVoucherPdfs } from "../schema/event-voucher-pdfs";
import type { TicketType } from "../schema/events";
import { CatalogValidationError } from "./errors";

export type VoucherInventoryCounts = {
  promo: { available: number; allocated: number };
  pdf: { available: number; allocated: number };
};

export type VoucherPdfInventoryItem = {
  objectKey: string;
  originalFilename?: string | null;
  pageLabel?: string | null;
};

export type VoucherInventoryPayload = {
  promoCodes: string[];
  pdfItems: VoucherPdfInventoryItem[];
};

/**
 * Normalize promo codes: one non-empty trimmed line per code; reject empties and
 * duplicates within the upload.
 */
export function normalizePromoCodes(codes: string[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const raw of codes) {
    const code = raw.trim();
    if (!code) {
      continue;
    }
    if (seen.has(code)) {
      throw new CatalogValidationError(
        "DUPLICATE_VOUCHER_CODE",
        `Duplicate promo code in upload: ${code}`,
      );
    }
    seen.add(code);
    normalized.push(code);
  }

  return normalized;
}

/**
 * Create/series: voucher types require a non-empty inventory payload.
 * Edit: allow empty payload when existing inventory already has rows.
 */
export function assertVoucherInventoryPresent(
  ticketType: TicketType,
  payload: VoucherInventoryPayload,
  options: {
    mode: "create" | "edit";
    existingCounts?: VoucherInventoryCounts;
  },
): void {
  if (ticketType === "SECRET_CODE") {
    return;
  }

  if (ticketType === "VOUCHER_PROMO") {
    const codes = normalizePromoCodes(payload.promoCodes);
    if (codes.length > 0) {
      return;
    }
    if (options.mode === "edit") {
      const existing =
        (options.existingCounts?.promo.available ?? 0) +
        (options.existingCounts?.promo.allocated ?? 0);
      if (existing > 0) {
        return;
      }
    }
    throw new CatalogValidationError(
      "EMPTY_VOUCHER_INVENTORY",
      "promo inventory is required for VOUCHER_PROMO",
    );
  }

  if (ticketType === "VOUCHER_PDF") {
    if (payload.pdfItems.length > 0) {
      return;
    }
    if (options.mode === "edit") {
      const existing =
        (options.existingCounts?.pdf.available ?? 0) + (options.existingCounts?.pdf.allocated ?? 0);
      if (existing > 0) {
        return;
      }
    }
    throw new CatalogValidationError(
      "EMPTY_VOUCHER_INVENTORY",
      "PDF ticket inventory is required for VOUCHER_PDF",
    );
  }
}

export async function getVoucherInventoryCounts(
  db: Db,
  eventId: string,
): Promise<VoucherInventoryCounts> {
  const [promoRows, pdfRows] = await Promise.all([
    db
      .select({
        status: eventVoucherCodes.status,
        total: count(),
      })
      .from(eventVoucherCodes)
      .where(eq(eventVoucherCodes.eventId, eventId))
      .groupBy(eventVoucherCodes.status),
    db
      .select({
        status: eventVoucherPdfs.status,
        total: count(),
      })
      .from(eventVoucherPdfs)
      .where(eq(eventVoucherPdfs.eventId, eventId))
      .groupBy(eventVoucherPdfs.status),
  ]);

  const promo = { available: 0, allocated: 0 };
  for (const row of promoRows) {
    if (row.status === "AVAILABLE") {
      promo.available = Number(row.total);
    } else if (row.status === "ALLOCATED") {
      promo.allocated = Number(row.total);
    }
  }

  const pdf = { available: 0, allocated: 0 };
  for (const row of pdfRows) {
    if (row.status === "AVAILABLE") {
      pdf.available = Number(row.total);
    } else if (row.status === "ALLOCATED") {
      pdf.allocated = Number(row.total);
    }
  }

  return { promo, pdf };
}

export async function appendPromoCodes(
  db: Db,
  eventId: string,
  codes: string[],
): Promise<EventVoucherCode[]> {
  const normalized = normalizePromoCodes(codes);
  if (normalized.length === 0) {
    return [];
  }

  const existing = await db
    .select({ code: eventVoucherCodes.code })
    .from(eventVoucherCodes)
    .where(
      and(eq(eventVoucherCodes.eventId, eventId), inArray(eventVoucherCodes.code, normalized)),
    );
  if (existing.length > 0) {
    throw new CatalogValidationError(
      "DUPLICATE_VOUCHER_CODE",
      `Promo code already exists for this event: ${existing[0]?.code}`,
    );
  }

  const inserted = await db
    .insert(eventVoucherCodes)
    .values(
      normalized.map((code) => ({
        eventId,
        code,
        status: "AVAILABLE" as const,
      })),
    )
    .returning();

  return inserted;
}

export async function appendVoucherPdfs(
  db: Db,
  eventId: string,
  items: VoucherPdfInventoryItem[],
): Promise<EventVoucherPdf[]> {
  if (items.length === 0) {
    return [];
  }

  const keys = items.map((item) => item.objectKey.trim()).filter(Boolean);
  if (keys.length !== items.length) {
    throw new CatalogValidationError(
      "INVALID_REDEMPTION_CONFIG",
      "Each PDF inventory item requires an objectKey",
    );
  }

  const keySet = new Set<string>();
  for (const key of keys) {
    if (keySet.has(key)) {
      throw new CatalogValidationError(
        "DUPLICATE_VOUCHER_CODE",
        `Duplicate PDF object key in upload: ${key}`,
      );
    }
    keySet.add(key);
  }

  const existing = await db
    .select({ objectKey: eventVoucherPdfs.objectKey })
    .from(eventVoucherPdfs)
    .where(and(eq(eventVoucherPdfs.eventId, eventId), inArray(eventVoucherPdfs.objectKey, keys)));
  if (existing.length > 0) {
    throw new CatalogValidationError(
      "DUPLICATE_VOUCHER_CODE",
      `PDF object key already exists for this event: ${existing[0]?.objectKey}`,
    );
  }

  const inserted = await db
    .insert(eventVoucherPdfs)
    .values(
      items.map((item) => ({
        eventId,
        objectKey: item.objectKey.trim(),
        originalFilename: item.originalFilename?.trim() || null,
        pageLabel: item.pageLabel?.trim() || null,
        status: "AVAILABLE" as const,
      })),
    )
    .returning();

  return inserted;
}

/** Delete AVAILABLE promo codes only — never ALLOCATED. */
export async function deleteUnusedPromoCodes(db: Db, eventId: string): Promise<number> {
  const deleted = await db
    .delete(eventVoucherCodes)
    .where(and(eq(eventVoucherCodes.eventId, eventId), eq(eventVoucherCodes.status, "AVAILABLE")))
    .returning({ id: eventVoucherCodes.id });
  return deleted.length;
}

/** Delete AVAILABLE PDF rows only — never ALLOCATED. */
export async function deleteUnusedVoucherPdfs(db: Db, eventId: string): Promise<number> {
  const deleted = await db
    .delete(eventVoucherPdfs)
    .where(and(eq(eventVoucherPdfs.eventId, eventId), eq(eventVoucherPdfs.status, "AVAILABLE")))
    .returning({ id: eventVoucherPdfs.id });
  return deleted.length;
}

export async function replaceUnusedPromoCodes(
  db: Db,
  eventId: string,
  codes: string[],
): Promise<EventVoucherCode[]> {
  await deleteUnusedPromoCodes(db, eventId);
  return appendPromoCodes(db, eventId, codes);
}

export async function replaceUnusedVoucherPdfs(
  db: Db,
  eventId: string,
  items: VoucherPdfInventoryItem[],
): Promise<EventVoucherPdf[]> {
  await deleteUnusedVoucherPdfs(db, eventId);
  return appendVoucherPdfs(db, eventId, items);
}

/**
 * Apply inventory after event create/update. No-op when payload is empty on edit.
 * `replaceUnused` only removes AVAILABLE rows before append.
 */
export async function applyVoucherInventory(
  db: Db,
  eventId: string,
  ticketType: TicketType,
  payload: VoucherInventoryPayload,
  options: { replaceUnused?: boolean } = {},
): Promise<void> {
  if (ticketType === "VOUCHER_PROMO") {
    const codes = normalizePromoCodes(payload.promoCodes);
    if (codes.length === 0) {
      return;
    }
    if (options.replaceUnused) {
      await replaceUnusedPromoCodes(db, eventId, codes);
    } else {
      await appendPromoCodes(db, eventId, codes);
    }
    return;
  }

  if (ticketType === "VOUCHER_PDF") {
    if (payload.pdfItems.length === 0) {
      return;
    }
    if (options.replaceUnused) {
      await replaceUnusedVoucherPdfs(db, eventId, payload.pdfItems);
    } else {
      await appendVoucherPdfs(db, eventId, payload.pdfItems);
    }
  }
}

function minimalPdfBytes(): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000068 00000 n 
0000000125 00000 n 
trailer<< /Size 4 /Root 1 0 R >>
startxref
203
%%EOF
`);
}

/**
 * Ensure at least `minAvailable` AVAILABLE inventory rows for voucher events.
 * Used by demo seed recovery / Playwright when prior runs depleted stock.
 * Dynamically imports `@unveiled/images` so client bundles that touch `@unveiled/db`
 * do not pull the S3 client.
 */
export async function ensureVoucherInventoryAvailable(
  db: Db,
  eventId: string,
  ticketType: TicketType,
  minAvailable: number,
  options: { skipUpload?: boolean } = {},
): Promise<void> {
  if (ticketType !== "VOUCHER_PROMO" && ticketType !== "VOUCHER_PDF") {
    return;
  }

  const counts = await getVoucherInventoryCounts(db, eventId);
  const available = ticketType === "VOUCHER_PROMO" ? counts.promo.available : counts.pdf.available;
  const need = Math.max(0, minAvailable - available);
  if (need === 0) {
    return;
  }

  const suffix = crypto.randomUUID().slice(0, 8);
  if (ticketType === "VOUCHER_PROMO") {
    const codes = Array.from({ length: need }, (_, i) => `E2E-PROMO-${suffix}-${i + 1}`);
    await appendPromoCodes(db, eventId, codes);
    return;
  }

  const { uploadObject } = await import("@unveiled/images");
  const pdfBytes = minimalPdfBytes();
  const items: VoucherPdfInventoryItem[] = [];
  for (let i = 1; i <= need; i++) {
    const objectKey = `vouchers/e2e/${eventId}/${suffix}-${i}.pdf`;
    if (!options.skipUpload) {
      await uploadObject({
        objectKey,
        body: pdfBytes,
        contentType: "application/pdf",
      });
    }
    items.push({
      objectKey,
      originalFilename: `e2e-ticket-${i}.pdf`,
      pageLabel: String(i),
    });
  }
  await appendVoucherPdfs(db, eventId, items);
}
