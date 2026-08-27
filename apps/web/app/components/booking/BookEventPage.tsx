import { Alert, Button, Card, Form, Input, Link, Paragraph, Surface } from "@heroui/react";
import { type Event, resolveEventCopy } from "@unveiled/db";

import BookAlreadyBookedSlotSelect from "../../islands/BookAlreadyBookedSlotSelect";
import BookSlotFields from "../../islands/BookSlotFields";
import {
  alreadyBookedTicketsPath,
  type BookPageCopy,
  getAlreadyBookedCopy,
} from "../../lib/booking-content";
import { BOOK_DATE_TIME_INPUT_ID, type CheckoutOccurrence } from "../../lib/checkout-slot";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { PageSectionHeader } from "../marketing/PageSectionHeader";

export type BookPageView = "form" | "past_due" | "already_booked";

export type BookEventPageProps = {
  locale: Locale;
  event: Event;
  copy: BookPageCopy;
  view: BookPageView;
  idempotencyKey: string;
  errorMessage?: string | null;
  /** When true, show waitlist join CTA (sold-out / insufficient capacity). */
  offerWaitlist?: boolean;
  availableCredits?: number;
  /** Inclusive upper bound for slot bookability (0 or 1). */
  maxQty?: number;
  occurrences?: CheckoutOccurrence[];
  slotDateTimeIso?: string;
};

export function BookEventPage({
  locale,
  event,
  copy,
  view,
  idempotencyKey,
  errorMessage,
  offerWaitlist = false,
  availableCredits,
  maxQty = 1,
  occurrences = [],
  slotDateTimeIso,
}: BookEventPageProps) {
  const eventHref = localizedPath(locale, `events/${event.id}`);
  const action = localizedPath(locale, `events/${event.id}/book`);
  const waitlistHref = localizedPath(locale, `events/${event.id}/waitlist`);
  const eventTitle = resolveEventCopy(event, locale).title;
  const selected = occurrences.find((occurrence) => occurrence.startsAtIso === slotDateTimeIso);
  const unitPrice = selected?.creditPrice ?? occurrences[0]?.creditPrice ?? event.creditPrice;
  const slotIso = selected?.startsAtIso ?? occurrences[0]?.startsAtIso ?? slotDateTimeIso;
  const slotMaxQty = selected?.maxQty ?? occurrences[0]?.maxQty ?? maxQty;

  const fieldsOccurrences: CheckoutOccurrence[] =
    occurrences.length > 0
      ? occurrences
      : [
          {
            startsAtIso: slotIso ?? event.dateTime.toISOString(),
            creditPrice: unitPrice,
            maxQty: slotMaxQty,
          },
        ];

  if (view === "already_booked") {
    const alreadyBooked = getAlreadyBookedCopy(locale);
    const showDatetimeSelect = occurrences.length >= 2;
    return (
      <Surface
        className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12 sm:px-6"
        variant="transparent"
      >
        <PageSectionHeader eyebrow={copy.eyebrow} headline={copy.title} />
        <Paragraph>{copy.subtitle(eventTitle)}</Paragraph>
        {showDatetimeSelect ? (
          <BookAlreadyBookedSlotSelect
            actionPath={action}
            datetimeLabel={copy.datetimeLabel}
            locale={locale}
            occurrences={occurrences}
            selectedIso={slotDateTimeIso}
          />
        ) : null}
        <Paragraph>{alreadyBooked.message}</Paragraph>
        <Surface className="flex flex-col gap-3 sm:flex-row" variant="transparent">
          <Link
            className="button button--primary button--md"
            href={alreadyBookedTicketsPath(locale)}
          >
            {alreadyBooked.myTicketsLabel}
          </Link>
          <Link className="button button--secondary button--md" href={eventHref}>
            {copy.backToEvent}
          </Link>
        </Surface>
      </Surface>
    );
  }

  if (view === "past_due") {
    return (
      <Surface
        className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12 sm:px-6"
        variant="transparent"
      >
        <PageSectionHeader eyebrow={copy.pastDueEyebrow} headline={copy.pastDueTitle} />
        <Paragraph>{copy.pastDueBody}</Paragraph>
        <Surface className="flex flex-col gap-3 sm:flex-row" variant="transparent">
          <Link
            className="button button--primary button--md"
            href={localizedPath(locale, "membership")}
          >
            {copy.membershipCta}
          </Link>
          <Link className="button button--secondary button--md" href={eventHref}>
            {copy.backToEvent}
          </Link>
        </Surface>
        <Paragraph>{copy.support}</Paragraph>
      </Surface>
    );
  }

  return (
    <Surface
      className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12 sm:px-6"
      variant="transparent"
    >
      <PageSectionHeader eyebrow={copy.eyebrow} headline={copy.title} />
      <Paragraph>{copy.subtitle(eventTitle)}</Paragraph>
      <Paragraph>
        {event.partnerName}
        {availableCredits != null
          ? ` · ${availableCredits} ${locale === "de" ? "verfügbar" : "available"}`
          : null}
      </Paragraph>

      {errorMessage ? (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Description>{errorMessage}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {offerWaitlist ? (
        <Link className="button button--primary button--md" href={waitlistHref}>
          {copy.waitlistCta}
        </Link>
      ) : null}

      <Card>
        <Card.Content className="flex flex-col gap-6">
          <Form action={action} className="flex flex-col gap-6" method="post">
            <Input name="idempotencyKey" type="hidden" value={idempotencyKey} />
            <input
              id={BOOK_DATE_TIME_INPUT_ID}
              name="date_time"
              type="hidden"
              value={slotIso ?? fieldsOccurrences[0]?.startsAtIso ?? ""}
            />
            <BookSlotFields
              datetimeLabel={copy.datetimeLabel}
              defaultDateTimeIso={slotIso ?? fieldsOccurrences[0]?.startsAtIso}
              locale={locale}
              occurrences={fieldsOccurrences}
            />
            <Paragraph>{copy.policy}</Paragraph>
            <Button className="button button--primary button--md" type="submit">
              {copy.submit}
            </Button>
          </Form>
        </Card.Content>
      </Card>

      <Link className="button button--secondary button--md" href={eventHref}>
        {copy.backToEvent}
      </Link>
    </Surface>
  );
}
