import { Card, Link, Paragraph, Surface } from "@heroui/react";
import type { Booking } from "@unveiled/db";

import CopyRedemptionButton from "../../islands/CopyRedemptionButton";
import type { BookConfirmCopy } from "../../lib/booking-content";

export type TicketRedemptionBlockProps = {
  booking: Pick<Booking, "redemptionType" | "redemptionInfo" | "redemptionUrl">;
  copy: Pick<
    BookConfirmCopy,
    "ticketCodeLabel" | "voucherLabel" | "secretDesc" | "copy" | "copied" | "openVoucher"
  >;
};

export function TicketRedemptionBlock({ booking, copy }: TicketRedemptionBlockProps) {
  const code = booking.redemptionInfo?.trim() ?? "";
  const isVoucher = booking.redemptionType === "VOUCHER";
  const codeLabel = isVoucher ? copy.voucherLabel : copy.ticketCodeLabel;

  return (
    <Card>
      <Card.Header>
        <Card.Title>{codeLabel}</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {code ? <Paragraph>{code}</Paragraph> : null}
        <Paragraph>{copy.secretDesc}</Paragraph>
        {code ? (
          <CopyRedemptionButton copiedLabel={copy.copied} copyLabel={copy.copy} value={code} />
        ) : null}
        {isVoucher && booking.redemptionUrl ? (
          <Link
            className="button button--secondary button--md"
            href={booking.redemptionUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {copy.openVoucher}
          </Link>
        ) : null}
      </Card.Content>
    </Card>
  );
}

export type TicketRedemptionBlockCompactProps = TicketRedemptionBlockProps;

/** Compact redemption summary for list cards (same fields, tighter layout). */
export function TicketRedemptionBlockCompact({ booking, copy }: TicketRedemptionBlockCompactProps) {
  const code = booking.redemptionInfo?.trim() ?? "";
  const isVoucher = booking.redemptionType === "VOUCHER";
  const codeLabel = isVoucher ? copy.voucherLabel : copy.ticketCodeLabel;

  if (!code && !(isVoucher && booking.redemptionUrl)) {
    return null;
  }

  return (
    <Surface className="flex flex-col gap-3" variant="transparent">
      <Paragraph size="sm">{codeLabel}</Paragraph>
      {code ? <Paragraph>{code}</Paragraph> : null}
      {code ? (
        <CopyRedemptionButton copiedLabel={copy.copied} copyLabel={copy.copy} value={code} />
      ) : null}
      {isVoucher && booking.redemptionUrl ? (
        <Link
          className="button button--secondary button--md"
          href={booking.redemptionUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {copy.openVoucher}
        </Link>
      ) : null}
    </Surface>
  );
}
