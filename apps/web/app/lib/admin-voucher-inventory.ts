import type { Db, TicketType, VoucherInventoryCounts, VoucherPdfInventoryItem } from "@unveiled/db";
import {
  applyVoucherInventory,
  assertVoucherInventoryPresent,
  getVoucherInventoryCounts,
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
