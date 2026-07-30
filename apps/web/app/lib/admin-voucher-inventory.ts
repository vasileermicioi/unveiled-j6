import type { Db, TicketType, VoucherInventoryCounts, VoucherPdfInventoryItem } from "@unveiled/db";
import {
  applyVoucherInventory,
  assertVoucherInventoryPresent,
  getVoucherInventoryCounts,
  normalizePromoCodes,
} from "@unveiled/db";

import type { EventFormValues } from "./admin-event-form";

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
 * Capacity for voucher ticket types is inventory-derived (not a separate admin field).
 * Returns null for SECRET_CODE (use form capacity) or when there is no inventory to derive from.
 */
export function resolveVoucherDerivedCapacity(
  ticketType: TicketType,
  payload: VoucherInventoryFormPayload,
  existingCounts?: VoucherInventoryCounts | null,
): number | null {
  if (ticketType !== "VOUCHER_PROMO" && ticketType !== "VOUCHER_PDF") {
    return null;
  }

  const bucket = ticketType === "VOUCHER_PROMO" ? existingCounts?.promo : existingCounts?.pdf;
  const allocated = bucket?.allocated ?? 0;
  const available = bucket?.available ?? 0;
  const incoming =
    ticketType === "VOUCHER_PROMO"
      ? normalizePromoCodes(payload.promoCodes).length
      : payload.pdfItems.length;

  if (incoming > 0) {
    if (payload.replaceUnused) {
      return allocated + incoming;
    }
    return available + allocated + incoming;
  }

  const existingTotal = available + allocated;
  return existingTotal > 0 ? existingTotal : null;
}

/** Overlay inventory-derived totalCapacity for VOUCHER_PROMO / VOUCHER_PDF. */
export function withVoucherCapacityFromInventory(
  values: EventFormValues,
  existingCounts?: VoucherInventoryCounts | null,
): EventFormValues {
  const derived = resolveVoucherDerivedCapacity(
    values.ticketType,
    voucherPayloadFromFormValues(values),
    existingCounts,
  );
  if (derived == null) {
    return values;
  }
  return { ...values, totalCapacity: derived };
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
