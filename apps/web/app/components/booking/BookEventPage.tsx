import { Alert, Button, Card, Form, Heading, Input, Link, Paragraph, Surface } from "@heroui/react";
import type { Event } from "@unveiled/db";

import TicketCountSelect from "../../islands/TicketCountSelect";
import type { BookPageCopy } from "../../lib/booking-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

export type BookPageView = "form" | "past_due";

export type BookEventPageProps = {
  locale: Locale;
  event: Event;
  copy: BookPageCopy;
  view: BookPageView;
  idempotencyKey: string;
  defaultTickets?: string;
  errorMessage?: string | null;
  /** When true, show waitlist join CTA (sold-out / insufficient capacity). */
  offerWaitlist?: boolean;
  availableCredits?: number;
  /** Inclusive upper bound for ticket Select (credits ∩ capacity). */
  maxQty?: number;
};

export function BookEventPage({
  locale,
  event,
  copy,
  view,
  idempotencyKey,
  defaultTickets = "1",
  errorMessage,
  offerWaitlist = false,
  availableCredits,
  maxQty = 3,
}: BookEventPageProps) {
  const eventHref = localizedPath(locale, `events/${event.id}`);
  const action = localizedPath(locale, `events/${event.id}/book`);
  const waitlistHref = `${localizedPath(locale, `events/${event.id}/waitlist`)}?qty=${encodeURIComponent(defaultTickets)}`;
  const unitPrice = event.creditPrice;

  if (view === "past_due") {
    return (
      <Surface
        className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12 sm:px-6"
        variant="transparent"
      >
        <Heading level={1}>{copy.pastDueTitle}</Heading>
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
      <Heading level={1}>{copy.title}</Heading>
      <Paragraph>{copy.subtitle(event.title)}</Paragraph>
      <Paragraph>
        {event.partnerName} · {unitPrice} {locale === "de" ? "Credit / Ticket" : "credit / ticket"}
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
            <TicketCountSelect
              defaultValue={defaultTickets}
              label={copy.ticketsLabel}
              maxQty={maxQty}
              name="ticketsCount"
            />
            <Paragraph>{copy.policy}</Paragraph>
            <Paragraph>
              {copy.creditCost(unitPrice)} {locale === "de" ? "pro Ticket" : "per ticket"}
            </Paragraph>
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
