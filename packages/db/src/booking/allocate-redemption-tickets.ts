import { and, asc, eq, inArray } from "drizzle-orm";

import type { TxDb } from "../index";
import { type BookingTicket, bookingTickets } from "../schema/booking-tickets";
import { type EventVoucherCode, eventVoucherCodes } from "../schema/event-voucher-codes";
import { type EventVoucherPdf, eventVoucherPdfs } from "../schema/event-voucher-pdfs";
import type { Event } from "../schema/events";

import { BookingError } from "./errors";
import { type RedemptionResult, resolveRedemption } from "./redemption";

type BookingTx = Parameters<Parameters<TxDb["transaction"]>[0]>[0];

export type LockedRedemptionAllocation =
  | {
      kind: "SECRET_CODE";
      summary: RedemptionResult;
    }
  | {
      kind: "VOUCHER_PROMO";
      codes: EventVoucherCode[];
      summary: RedemptionResult;
    }
  | {
      kind: "VOUCHER_PDF";
      pdfs: EventVoucherPdf[];
      summary: RedemptionResult;
    };

export type AllocateRedemptionTicketsResult = {
  tickets: BookingTicket[];
  summary: RedemptionResult;
};

/**
 * Lock voucher inventory (SKIP LOCKED) or resolve secret code before capacity/credit mutations.
 * Does not write booking_tickets — call {@link writeRedemptionTickets} after the booking insert.
 */
export async function lockRedemptionAllocation(
  tx: BookingTx,
  event: Event,
  ticketsCount: number,
): Promise<LockedRedemptionAllocation> {
  if (event.ticketType === "SECRET_CODE") {
    return { kind: "SECRET_CODE", summary: resolveRedemption(event) };
  }

  if (event.ticketType === "VOUCHER_PROMO") {
    const codes = await tx
      .select()
      .from(eventVoucherCodes)
      .where(
        and(eq(eventVoucherCodes.eventId, event.id), eq(eventVoucherCodes.status, "AVAILABLE")),
      )
      .orderBy(asc(eventVoucherCodes.createdAt), asc(eventVoucherCodes.id))
      .limit(ticketsCount)
      .for("update", { skipLocked: true });

    if (codes.length < ticketsCount) {
      throw new BookingError(
        "INSUFFICIENT_VOUCHER_INVENTORY",
        "Not enough available promo codes for this booking",
      );
    }

    const first = codes[0];
    if (!first) {
      throw new BookingError(
        "INSUFFICIENT_VOUCHER_INVENTORY",
        "Not enough available promo codes for this booking",
      );
    }

    return {
      kind: "VOUCHER_PROMO",
      codes,
      summary: {
        redemptionType: "VOUCHER_PROMO",
        redemptionInfo: first.code,
        redemptionUrl: event.eventWebsiteUrl?.trim() || null,
      },
    };
  }

  if (event.ticketType === "VOUCHER_PDF") {
    const pdfs = await tx
      .select()
      .from(eventVoucherPdfs)
      .where(and(eq(eventVoucherPdfs.eventId, event.id), eq(eventVoucherPdfs.status, "AVAILABLE")))
      .orderBy(asc(eventVoucherPdfs.createdAt), asc(eventVoucherPdfs.id))
      .limit(ticketsCount)
      .for("update", { skipLocked: true });

    if (pdfs.length < ticketsCount) {
      throw new BookingError(
        "INSUFFICIENT_VOUCHER_INVENTORY",
        "Not enough available PDF vouchers for this booking",
      );
    }

    const first = pdfs[0];
    if (!first) {
      throw new BookingError(
        "INSUFFICIENT_VOUCHER_INVENTORY",
        "Not enough available PDF vouchers for this booking",
      );
    }

    return {
      kind: "VOUCHER_PDF",
      pdfs,
      summary: {
        redemptionType: "VOUCHER_PDF",
        redemptionInfo: first.pageLabel?.trim() || null,
        redemptionUrl: null,
      },
    };
  }

  throw new BookingError(
    "INVALID_REDEMPTION_CONFIG",
    `Unsupported ticket type for allocation: ${event.ticketType}`,
  );
}

/**
 * Insert N booking_tickets and mark locked voucher inventory ALLOCATED.
 */
export async function writeRedemptionTickets(
  tx: BookingTx,
  input: {
    bookingId: string;
    event: Event;
    ticketsCount: number;
    allocation: LockedRedemptionAllocation;
  },
): Promise<AllocateRedemptionTicketsResult> {
  const now = new Date();
  const { bookingId, event, ticketsCount, allocation } = input;

  if (allocation.kind === "SECRET_CODE") {
    const code = allocation.summary.redemptionInfo;
    if (!code) {
      throw new BookingError(
        "INVALID_REDEMPTION_CONFIG",
        "Secret-code events require a configured secretCode",
      );
    }

    const tickets = await tx
      .insert(bookingTickets)
      .values(
        Array.from({ length: ticketsCount }, (_, index) => ({
          bookingId,
          ordinal: index + 1,
          redemptionCode: code,
          redemptionUrl: null,
          voucherPdfId: null,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .returning();

    return { tickets, summary: allocation.summary };
  }

  if (allocation.kind === "VOUCHER_PROMO") {
    const redemptionUrl = event.eventWebsiteUrl?.trim() || null;
    const tickets: BookingTicket[] = [];

    for (let index = 0; index < ticketsCount; index++) {
      const inventory = allocation.codes[index];
      if (!inventory) {
        throw new BookingError(
          "INSUFFICIENT_VOUCHER_INVENTORY",
          "Not enough available promo codes for this booking",
        );
      }

      const [ticket] = await tx
        .insert(bookingTickets)
        .values({
          bookingId,
          ordinal: index + 1,
          redemptionCode: inventory.code,
          redemptionUrl,
          voucherPdfId: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!ticket) {
        throw new BookingError("EVENT_NOT_FOUND", "Failed to insert booking ticket");
      }

      await tx
        .update(eventVoucherCodes)
        .set({
          status: "ALLOCATED",
          bookingTicketId: ticket.id,
          updatedAt: now,
        })
        .where(eq(eventVoucherCodes.id, inventory.id));

      tickets.push(ticket);
    }

    return { tickets, summary: allocation.summary };
  }

  const tickets: BookingTicket[] = [];
  for (let index = 0; index < ticketsCount; index++) {
    const inventory = allocation.pdfs[index];
    if (!inventory) {
      throw new BookingError(
        "INSUFFICIENT_VOUCHER_INVENTORY",
        "Not enough available PDF vouchers for this booking",
      );
    }

    const [ticket] = await tx
      .insert(bookingTickets)
      .values({
        bookingId,
        ordinal: index + 1,
        redemptionCode: null,
        redemptionUrl: null,
        voucherPdfId: inventory.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!ticket) {
      throw new BookingError("EVENT_NOT_FOUND", "Failed to insert booking ticket");
    }

    await tx
      .update(eventVoucherPdfs)
      .set({
        status: "ALLOCATED",
        bookingTicketId: ticket.id,
        updatedAt: now,
      })
      .where(eq(eventVoucherPdfs.id, inventory.id));

    tickets.push(ticket);
  }

  return { tickets, summary: allocation.summary };
}

/**
 * Lock + write in one step when the booking id is already known (tests / helpers).
 */
export async function allocateRedemptionTickets(
  tx: BookingTx,
  input: {
    event: Event;
    bookingId: string;
    ticketsCount: number;
  },
): Promise<AllocateRedemptionTicketsResult> {
  const allocation = await lockRedemptionAllocation(tx, input.event, input.ticketsCount);
  return writeRedemptionTickets(tx, {
    bookingId: input.bookingId,
    event: input.event,
    ticketsCount: input.ticketsCount,
    allocation,
  });
}

/** Return allocated voucher inventory to AVAILABLE and clear ticket redemption payloads. */
export async function restockBookingInventory(tx: BookingTx, bookingId: string): Promise<void> {
  const tickets = await tx
    .select()
    .from(bookingTickets)
    .where(eq(bookingTickets.bookingId, bookingId));

  if (tickets.length === 0) {
    return;
  }

  const ticketIds = tickets.map((ticket) => ticket.id);
  const now = new Date();

  await tx
    .update(eventVoucherCodes)
    .set({
      status: "AVAILABLE",
      bookingTicketId: null,
      updatedAt: now,
    })
    .where(inArray(eventVoucherCodes.bookingTicketId, ticketIds));

  await tx
    .update(eventVoucherPdfs)
    .set({
      status: "AVAILABLE",
      bookingTicketId: null,
      updatedAt: now,
    })
    .where(inArray(eventVoucherPdfs.bookingTicketId, ticketIds));

  await tx
    .update(bookingTickets)
    .set({
      redemptionCode: null,
      redemptionUrl: null,
      voucherPdfId: null,
      updatedAt: now,
    })
    .where(eq(bookingTickets.bookingId, bookingId));
}
