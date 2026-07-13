import { Alert, Button, Card, Form, Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { Event } from "@unveiled/db";

import TicketCountSelect from "../../islands/TicketCountSelect";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { WaitlistJoinCopy } from "../../lib/waitlist-content";

export type WaitlistJoinView = "form" | "status";

export type WaitlistJoinPageProps = {
  locale: Locale;
  event: Event;
  copy: WaitlistJoinCopy;
  view: WaitlistJoinView;
  defaultTickets?: string;
  errorMessage?: string | null;
  /** Present when view === "status" */
  entryId?: string;
  created?: boolean;
  requestedQty?: number;
  queuePosition?: number | null;
};

export function WaitlistJoinPage({
  locale,
  event,
  copy,
  view,
  defaultTickets = "1",
  errorMessage,
  entryId,
  created = true,
  requestedQty,
  queuePosition,
}: WaitlistJoinPageProps) {
  const eventHref = localizedPath(locale, `events/${event.id}`);
  const action = localizedPath(locale, `events/${event.id}/waitlist`);

  if (view === "status" && entryId) {
    return (
      <Surface
        className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12 sm:px-6"
        variant="transparent"
      >
        <Heading level={1}>{copy.confirmTitle}</Heading>
        <Paragraph>{created ? copy.confirmCreated : copy.confirmExisting}</Paragraph>
        <Card>
          <Card.Content className="flex flex-col gap-3">
            <Paragraph>{event.title}</Paragraph>
            <Paragraph>{copy.statusLabel}</Paragraph>
            {queuePosition != null ? (
              <Paragraph>{copy.positionLabel(queuePosition)}</Paragraph>
            ) : null}
            {requestedQty != null ? <Paragraph>{copy.qtyLabel(requestedQty)}</Paragraph> : null}
          </Card.Content>
        </Card>
        <Surface className="flex flex-col gap-3 sm:flex-row" variant="transparent">
          <Link
            className="button button--secondary button--md"
            href={localizedPath(locale, `waitlist/${entryId}/cancel`)}
          >
            {copy.cancelLink}
          </Link>
          <Link className="button button--primary button--md" href={eventHref}>
            {copy.backToEvent}
          </Link>
        </Surface>
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
        {event.partnerName} · {event.creditPrice}{" "}
        {locale === "de" ? "Credit / Ticket" : "credit / ticket"}
      </Paragraph>

      {errorMessage ? (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Description>{errorMessage}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Card>
        <Card.Content className="flex flex-col gap-6">
          <Form action={action} className="flex flex-col gap-6" method="post">
            <TicketCountSelect
              defaultValue={defaultTickets}
              label={copy.ticketsLabel}
              name="requestedQty"
            />
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
