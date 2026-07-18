export type MaxBookableTicketsViewerKind = "guest" | "signed-in";

export type MaxBookableTicketsInput = {
  creditPrice: number;
  remainingCapacity: number;
  credits: number;
  viewerKind: MaxBookableTicketsViewerKind;
};

/**
 * UX upper bound for ticket quantity controls.
 * Server booking still enforces capacity and credits authoritatively.
 */
export function maxBookableTickets(input: MaxBookableTicketsInput): number {
  if (input.viewerKind === "guest") {
    return 3;
  }

  const capacity = Math.max(0, Math.trunc(input.remainingCapacity));
  if (input.creditPrice <= 0) {
    return capacity;
  }

  const affordable = Math.floor(Math.max(0, input.credits) / input.creditPrice);
  return Math.max(0, Math.min(affordable, capacity));
}
