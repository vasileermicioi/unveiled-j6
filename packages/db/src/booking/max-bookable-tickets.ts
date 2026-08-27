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
 * UX upper bound for whether one ticket can be booked (0 or 1).
 * Server booking still enforces capacity, credits, and inventory authoritatively.
 */
export function maxBookableTickets(input: MaxBookableTicketsInput): number {
  const capacity = Math.max(0, Math.trunc(input.remainingCapacity));
  const inventoryCap =
    input.availableInventory == null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, Math.trunc(input.availableInventory));

  const uncapped =
    input.viewerKind === "guest" || input.creditPrice <= 0
      ? Math.max(0, Math.min(capacity, inventoryCap))
      : Math.max(
          0,
          Math.min(
            Math.floor(Math.max(0, input.credits) / input.creditPrice),
            capacity,
            inventoryCap,
          ),
        );

  return Math.min(1, uncapped);
}
