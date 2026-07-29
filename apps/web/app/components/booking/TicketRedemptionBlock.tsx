import { Card, Link, Paragraph, Surface } from "@heroui/react";
import type { Booking, BookingTicket } from "@unveiled/db";

import RevealSecretIsland from "../../islands/RevealSecretIsland";
import type { BookConfirmCopy } from "../../lib/booking-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

export type RedemptionBlockCopy = Pick<
  BookConfirmCopy,
  | "ticketCodeLabel"
  | "voucherLabel"
  | "pdfVoucherLabel"
  | "secretDesc"
  | "copy"
  | "copied"
  | "showCode"
  | "hideCode"
  | "downloadPdf"
  | "openVoucher"
  | "ticketOrdinalLabel"
>;

export type TicketRedemptionBlockProps = {
  locale: Locale;
  booking: Pick<
    Booking,
    "id" | "redemptionType" | "redemptionInfo" | "redemptionUrl" | "ticketsCount"
  >;
  tickets: BookingTicket[];
  copy: RedemptionBlockCopy;
};

type RedemptionRow = {
  key: string;
  ticketId: string | null;
  ordinal: number;
  code: string;
  url: string | null;
  hasPdf: boolean;
};

function resolveRows(
  booking: TicketRedemptionBlockProps["booking"],
  tickets: BookingTicket[],
): RedemptionRow[] {
  if (tickets.length > 0) {
    return tickets.map((ticket) => ({
      key: ticket.id,
      ticketId: ticket.id,
      ordinal: ticket.ordinal,
      code: ticket.redemptionCode?.trim() ?? "",
      url: ticket.redemptionUrl?.trim() || booking.redemptionUrl?.trim() || null,
      hasPdf: Boolean(ticket.voucherPdfId),
    }));
  }

  const code = booking.redemptionInfo?.trim() ?? "";
  const url = booking.redemptionUrl?.trim() || null;
  if (!code && !url) {
    return [];
  }

  return [
    {
      key: `${booking.id}-fallback`,
      ticketId: null,
      ordinal: 1,
      code,
      url,
      hasPdf: false,
    },
  ];
}

function blockTitle(redemptionType: Booking["redemptionType"], copy: RedemptionBlockCopy): string {
  if (redemptionType === "VOUCHER_PDF") {
    return copy.pdfVoucherLabel;
  }
  if (redemptionType === "VOUCHER_PROMO") {
    return copy.voucherLabel;
  }
  return copy.ticketCodeLabel;
}

function pdfDownloadHref(locale: Locale, bookingId: string, ticketId: string): string {
  return localizedPath(locale, `bookings/${bookingId}/tickets/${ticketId}/voucher.pdf`);
}

function RedemptionRows({
  locale,
  bookingId,
  redemptionType,
  rows,
  showOrdinalLabels,
  copy,
  compact,
}: {
  locale: Locale;
  bookingId: string;
  redemptionType: Booking["redemptionType"];
  rows: RedemptionRow[];
  showOrdinalLabels: boolean;
  copy: RedemptionBlockCopy;
  compact: boolean;
}) {
  const isPromo = redemptionType === "VOUCHER_PROMO";
  const isPdf = redemptionType === "VOUCHER_PDF";

  return (
    <Surface className="flex flex-col gap-4" variant="transparent">
      {rows.map((row) => {
        const hasCode = Boolean(row.code);
        const showWebsite = isPromo && Boolean(row.url);
        const showPdf = isPdf && row.hasPdf && row.ticketId;
        if (!hasCode && !showWebsite && !showPdf) {
          return null;
        }

        return (
          <Surface className="flex flex-col gap-3" key={row.key} variant="transparent">
            {showOrdinalLabels ? (
              <Paragraph size={compact ? "sm" : undefined}>
                {copy.ticketOrdinalLabel(row.ordinal)}
              </Paragraph>
            ) : null}
            {hasCode ? (
              <RevealSecretIsland
                copiedLabel={copy.copied}
                copyLabel={copy.copy}
                hideLabel={copy.hideCode}
                showLabel={copy.showCode}
                value={row.code}
              />
            ) : null}
            {showPdf && row.ticketId ? (
              <Link
                className="button button--secondary button--md"
                href={pdfDownloadHref(locale, bookingId, row.ticketId)}
              >
                {copy.downloadPdf}
              </Link>
            ) : null}
            {showWebsite && row.url ? (
              <Link
                className="button button--secondary button--md"
                href={row.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {copy.openVoucher}
              </Link>
            ) : null}
          </Surface>
        );
      })}
    </Surface>
  );
}

export function TicketRedemptionBlock({
  locale,
  booking,
  tickets,
  copy,
}: TicketRedemptionBlockProps) {
  const rows = resolveRows(booking, tickets).filter(
    (row) =>
      row.code ||
      (booking.redemptionType === "VOUCHER_PROMO" && row.url) ||
      (booking.redemptionType === "VOUCHER_PDF" && row.hasPdf && row.ticketId),
  );

  if (rows.length === 0) {
    return null;
  }

  const showOrdinalLabels = booking.ticketsCount > 1 || rows.length > 1;
  const showSecretDesc =
    booking.redemptionType === "SECRET_CODE" || booking.redemptionType === "VOUCHER_PROMO";

  return (
    <Card>
      <Card.Header>
        <Card.Title>{blockTitle(booking.redemptionType, copy)}</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <RedemptionRows
          bookingId={booking.id}
          compact={false}
          copy={copy}
          locale={locale}
          redemptionType={booking.redemptionType}
          rows={rows}
          showOrdinalLabels={showOrdinalLabels}
        />
        {showSecretDesc ? <Paragraph>{copy.secretDesc}</Paragraph> : null}
      </Card.Content>
    </Card>
  );
}

export type TicketRedemptionBlockCompactProps = TicketRedemptionBlockProps;

/** Compact redemption summary for list cards (same fields, tighter layout). */
export function TicketRedemptionBlockCompact({
  locale,
  booking,
  tickets,
  copy,
}: TicketRedemptionBlockCompactProps) {
  const rows = resolveRows(booking, tickets).filter(
    (row) =>
      row.code ||
      (booking.redemptionType === "VOUCHER_PROMO" && row.url) ||
      (booking.redemptionType === "VOUCHER_PDF" && row.hasPdf && row.ticketId),
  );

  if (rows.length === 0) {
    return null;
  }

  const showOrdinalLabels = booking.ticketsCount > 1 || rows.length > 1;

  return (
    <Surface className="flex flex-col gap-3" variant="transparent">
      <Paragraph size="sm">{blockTitle(booking.redemptionType, copy)}</Paragraph>
      <RedemptionRows
        bookingId={booking.id}
        compact
        copy={copy}
        locale={locale}
        redemptionType={booking.redemptionType}
        rows={rows}
        showOrdinalLabels={showOrdinalLabels}
      />
    </Surface>
  );
}
