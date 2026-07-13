import { type BookEventResult, bookEvent } from "../booking/book-event";
import type { TxDb } from "../index";

export type CreateCompTicketInput = {
  userId: string;
  eventId: string;
  /** Defaults to 1. */
  ticketsCount?: number;
  idempotencyKey: string;
  /** Trusted admin actor id for call-site audit; not persisted on the booking. */
  adminUserId: string;
};

/**
 * Complimentary confirmed booking via the shared booking transaction.
 * Uses `skipCreditCharge` — capacity and subscription eligibility still apply.
 * BookingError codes (SOLD_OUT, INELIGIBLE_SUBSCRIPTION, …) bubble unchanged.
 */
export async function createCompTicket(
  db: TxDb,
  input: CreateCompTicketInput,
): Promise<BookEventResult> {
  void input.adminUserId;
  return bookEvent(db, {
    userId: input.userId,
    eventId: input.eventId,
    ticketsCount: input.ticketsCount ?? 1,
    idempotencyKey: input.idempotencyKey,
    skipCreditCharge: true,
  });
}
