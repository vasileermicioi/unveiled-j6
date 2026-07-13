import { desc, eq } from "drizzle-orm";

import type { Db } from "../index";
import { type Booking, bookings } from "../schema/bookings";
import { type CreditLedgerEntry, creditLedger } from "../schema/credit-ledger";
import { type User, type UserProfile, users } from "../schema/users";

import { GdprError } from "./errors";

export type UserDataExportBooking = {
  id: string;
  eventId: string;
  partnerId: string;
  ticketsCount: number;
  totalCredits: number;
  status: Booking["status"];
  redemptionType: Booking["redemptionType"];
  redemptionInfo: string | null;
  redemptionUrl: string | null;
  createdAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  checkedInAt: string | null;
};

export type UserDataExportLedgerEntry = {
  id: string;
  amount: number;
  balanceAfter: number;
  type: CreditLedgerEntry["type"];
  description: string;
  timestamp: string;
};

export type UserDataExport = {
  exportedAt: string;
  user: {
    id: string;
    email: string;
    role: User["role"];
    credits: number;
    emailVerified: boolean;
    createdAt: string;
    profile: UserProfile;
  };
  bookings: UserDataExportBooking[];
  creditLedger: UserDataExportLedgerEntry[];
};

function toIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

/**
 * Synchronous GDPR data export: profile + bookings + credit ledger.
 * Rejects missing and already-deleted users (typed errors).
 */
export async function buildUserDataExport(db: Db, userId: string): Promise<UserDataExport> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new GdprError("USER_NOT_FOUND", "User not found");
  }
  if (user.deletedAt) {
    throw new GdprError("ALREADY_DELETED", "User account is already deleted");
  }

  const [bookingRows, ledgerRows] = await Promise.all([
    db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt)),
    db
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.userId, userId))
      .orderBy(desc(creditLedger.timestamp)),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      credits: user.credits,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      profile: user.profile,
    },
    bookings: bookingRows.map((row) => ({
      id: row.id,
      eventId: row.eventId,
      partnerId: row.partnerId,
      ticketsCount: row.ticketsCount,
      totalCredits: row.totalCredits,
      status: row.status,
      redemptionType: row.redemptionType,
      redemptionInfo: row.redemptionInfo,
      redemptionUrl: row.redemptionUrl,
      createdAt: row.createdAt.toISOString(),
      cancelledAt: toIso(row.cancelledAt),
      cancellationReason: row.cancellationReason,
      checkedInAt: toIso(row.checkedInAt),
    })),
    creditLedger: ledgerRows.map((row) => ({
      id: row.id,
      amount: row.amount,
      balanceAfter: row.balanceAfter,
      type: row.type,
      description: row.description,
      timestamp: row.timestamp.toISOString(),
    })),
  };
}
