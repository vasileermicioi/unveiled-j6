export type MaxBookableTicketsViewerKind = "guest" | "signed-in";

export type MaxBookableTicketsInput = {
  creditPrice: number;
  remainingCapacity: number;
  credits: number;
  viewerKind: MaxBookableTicketsViewerKind;
  /**
   * When set (voucher-type events), caps selectable qty by available inventory.
   * Omit / null for SECRET_CODE or when inventory count is unknown.
   */
  availableInventory?: number | null;
};

/**
 * UX upper bound for ticket quantity controls.
 * Server booking still enforces capacity, credits, and inventory authoritatively.
 */
export function maxBookableTickets(input: MaxBookableTicketsInput): number {
  if (input.viewerKind === "guest") {
    return 3;
  }

  const capacity = Math.max(0, Math.trunc(input.remainingCapacity));
  const inventoryCap =
    input.availableInventory == null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, Math.trunc(input.availableInventory));

  if (input.creditPrice <= 0) {
    return Math.max(0, Math.min(capacity, inventoryCap));
  }

  const affordable = Math.floor(Math.max(0, input.credits) / input.creditPrice);
  return Math.max(0, Math.min(affordable, capacity, inventoryCap));
}
