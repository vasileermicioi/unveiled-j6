import type { Db, TicketType, VoucherInventoryCounts, VoucherPdfInventoryItem } from "@unveiled/db";
import {
  applyVoucherInventory,
  assertVoucherInventoryPresent,
  CatalogValidationError,
  getVoucherInventoryCounts,
  normalizePromoCodes,
} from "@unveiled/db";

import type { EventFormValues } from "./admin-event-form";
import { parseOccurrenceCredit } from "./admin-event-form";

export type InventoryPreviewChange = {
  incomingCount: number;
  replaceUnused: boolean;
};

export type VoucherInventoryFormPayload = {
  promoCodes: string[];
  pdfItems: VoucherPdfInventoryItem[];
  replaceUnused: boolean;
};

export function voucherPayloadFromFormValues(values: EventFormValues): VoucherInventoryFormPayload {
  return {
    promoCodes: values.promoCodes,
    pdfItems: values.voucherPdfs,
    replaceUnused: values.replaceUnusedInventory,
  };
}

/**
 * Live and submit inventory count: create = incoming; edit append = available + allocated + incoming;
 * edit replace unused = allocated + incoming; empty incoming on edit = available + allocated.
 * Returns null for SECRET_CODE or when there is no inventory to derive from.
 */
export function voucherInventoryDisplayCount(
  ticketType: TicketType,
  incomingCount: number,
  replaceUnused: boolean,
  existingCounts?: VoucherInventoryCounts | null,
): number | null {
  if (ticketType !== "VOUCHER_PROMO" && ticketType !== "VOUCHER_PDF") {
    return null;
  }

  const bucket = ticketType === "VOUCHER_PROMO" ? existingCounts?.promo : existingCounts?.pdf;
  const allocated = bucket?.allocated ?? 0;
  const available = bucket?.available ?? 0;

  if (incomingCount > 0) {
    if (replaceUnused) {
      return allocated + incomingCount;
    }
    return available + allocated + incomingCount;
  }

  const existingTotal = available + allocated;
  return existingTotal > 0 ? existingTotal : null;
}

export function resolveVoucherDerivedCapacity(
  ticketType: TicketType,
  payload: VoucherInventoryFormPayload,
  existingCounts?: VoucherInventoryCounts | null,
): number | null {
  const incoming =
    ticketType === "VOUCHER_PROMO"
      ? normalizePromoCodes(payload.promoCodes).length
      : payload.pdfItems.length;

  return voucherInventoryDisplayCount(ticketType, incoming, payload.replaceUnused, existingCounts);
}

export function datetimeCapacityTotal(values: EventFormValues): number {
  if ((values.capacityMode ?? "SHARED") !== "PER_OCCURRENCE") {
    return values.totalCapacity;
  }

  return values.dateTimeRows.reduce((sum, row) => {
    if (!row.date.trim()) {
      return sum;
    }
    const parsed = parseOccurrenceCredit(row.capacity ?? "");
    if (parsed === null) {
      return sum;
    }
    return sum + parsed;
  }, 0);
}

export function assertCapacityMatchesInventory(
  values: EventFormValues,
  existingCounts?: VoucherInventoryCounts | null,
): void {
  if (values.ticketType !== "VOUCHER_PROMO" && values.ticketType !== "VOUCHER_PDF") {
    return;
  }

  const derived = resolveVoucherDerivedCapacity(
    values.ticketType,
    voucherPayloadFromFormValues(values),
    existingCounts,
  );
  if (derived == null) {
    return;
  }

  if (derived !== datetimeCapacityTotal(values)) {
    throw new CatalogValidationError(
      "CAPACITY_INVENTORY_MISMATCH",
      "Capacity and inventory do not match",
    );
  }
}

export async function assertVoucherInventoryForForm(
  db: Db,
  options: {
    eventId?: string;
    ticketType: TicketType;
    payload: VoucherInventoryFormPayload;
    mode: "create" | "edit";
  },
): Promise<void> {
  let existingCounts: VoucherInventoryCounts | undefined;
  if (options.mode === "edit" && options.eventId) {
    existingCounts = await getVoucherInventoryCounts(db, options.eventId);
  }

  assertVoucherInventoryPresent(
    options.ticketType,
    { promoCodes: options.payload.promoCodes, pdfItems: options.payload.pdfItems },
    { mode: options.mode, existingCounts },
  );
}

export async function applyVoucherInventoryForEvents(
  db: Db,
  options: {
    eventIds: string[];
    ticketType: TicketType;
    payload: VoucherInventoryFormPayload;
  },
): Promise<void> {
  for (const eventId of options.eventIds) {
    await applyVoucherInventory(
      db,
      eventId,
      options.ticketType,
      {
        promoCodes: options.payload.promoCodes,
        pdfItems: options.payload.pdfItems,
      },
      { replaceUnused: options.payload.replaceUnused },
    );
  }
}
