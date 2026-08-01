"use client";

import { Button, Description, Form, Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { TicketType, TimingMode } from "@unveiled/db";

import PdfVoucherInventoryIsland from "../../islands/PdfVoucherInventoryIsland";
import PromoCodeInventoryIsland from "../../islands/PromoCodeInventoryIsland";
import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { EventAdminDateTimeFields } from "./EventAdminDateFields";

/** Island props must be JSON-serializable — no Date objects. */
export type CloneEventFormSource = {
  id: string;
  title: string;
  partnerName: string;
  ticketType: TicketType;
  timingMode: TimingMode;
  /** Preformatted Europe/Berlin date/time label for the source summary. */
  dateTimeLabel: string;
  imageUrl: string | null;
  eventDate: string;
  eventTime: string;
};

type CloneEventFormProps = {
  locale: Locale;
  action: string;
  cancelHref: string;
  source: CloneEventFormSource;
  defaults?: {
    eventDate?: string;
    eventTime?: string;
  };
  error?: string | null;
};

function ticketTypeLabel(locale: Locale, ticketType: TicketType): string {
  const copy = getAdminCopy(locale);
  if (ticketType === "VOUCHER_PROMO") {
    return copy.ticketTypeVoucher;
  }
  if (ticketType === "VOUCHER_PDF") {
    return copy.ticketTypeVoucherPdf;
  }
  return copy.ticketTypeSecretCode;
}

export function CloneEventForm({
  locale,
  action,
  cancelHref,
  source,
  defaults,
  error = null,
}: CloneEventFormProps) {
  const copy = getAdminCopy(locale);
  const needsInventory =
    source.ticketType === "VOUCHER_PROMO" || source.ticketType === "VOUCHER_PDF";

  return (
    <Form
      action={action}
      className="admin-form flex flex-col gap-6"
      encType="multipart/form-data"
      method="post"
    >
      {error ? <AdminFormError message={error} /> : null}

      <input name="timing_mode" type="hidden" value={source.timingMode} />
      <input name="ticket_type" type="hidden" value={source.ticketType} />

      <Surface className="flex flex-col gap-3" variant="transparent">
        <Heading level={2}>{copy.cloneSourceLabel}</Heading>
        <Surface className="flex flex-col gap-3 sm:flex-row sm:items-start" variant="transparent">
          {source.imageUrl ? (
            <Surface className="admin-table__logo shrink-0" variant="transparent">
              <img alt={copy.cloneSourceImageAlt} src={source.imageUrl} />
            </Surface>
          ) : null}
          <Surface className="flex flex-col gap-1" variant="transparent">
            <Paragraph>{source.title}</Paragraph>
            <Paragraph color="muted" size="sm">
              {source.partnerName}
            </Paragraph>
            <Paragraph color="muted" size="sm">
              {ticketTypeLabel(locale, source.ticketType)} · {source.dateTimeLabel}
            </Paragraph>
          </Surface>
        </Surface>
      </Surface>

      <Surface className="flex flex-col gap-2" variant="transparent">
        <EventAdminDateTimeFields
          eventDate={defaults?.eventDate ?? source.eventDate}
          eventTime={defaults?.eventTime ?? source.eventTime}
          isDateRequired
          locale={locale}
        />
        <Description>{copy.cloneDateTimeHint}</Description>
      </Surface>

      {needsInventory ? (
        <Surface className="flex flex-col gap-3" variant="transparent">
          <Description>{copy.cloneInventoryHint}</Description>
          {source.ticketType === "VOUCHER_PROMO" ? (
            <PromoCodeInventoryIsland isEdit={false} locale={locale} />
          ) : (
            <PdfVoucherInventoryIsland
              eventId={null}
              isEdit={false}
              locale={locale}
              uploadPath={`/${locale}/admin/uploads/voucher-pdf`}
            />
          )}
        </Surface>
      ) : null}

      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        <Button className="button button--primary button--md sm:min-w-40" type="submit">
          {copy.cloneSubmit}
        </Button>
        <Link className="button button--secondary button--md sm:min-w-40" href={cancelHref}>
          {copy.cancel}
        </Link>
      </Surface>
    </Form>
  );
}
