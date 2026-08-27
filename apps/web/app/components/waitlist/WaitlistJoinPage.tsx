import { Alert, Button, Card, Form, Link, Paragraph, Surface } from "@heroui/react";
import { type Event, resolveEventCopy } from "@unveiled/db";

import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { WaitlistJoinCopy } from "../../lib/waitlist-content";
import { PageSectionHeader } from "../marketing/PageSectionHeader";

export type WaitlistJoinView = "form" | "status";

export type WaitlistJoinPageProps = {
  locale: Locale;
  event: Event;
  copy: WaitlistJoinCopy;
  view: WaitlistJoinView;
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
  errorMessage,
  entryId,
  created = true,
  requestedQty,
  queuePosition,
}: WaitlistJoinPageProps) {
  const eventHref = localizedPath(locale, `events/${event.id}`);
  const action = localizedPath(locale, `events/${event.id}/waitlist`);
  const eventTitle = resolveEventCopy(event, locale).title;

  if (view === "status" && entryId) {
    return (
      <Surface
        className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12 sm:px-6"
        variant="transparent"
      >
        <PageSectionHeader eyebrow={copy.confirmEyebrow} headline={copy.confirmTitle} />
        <Paragraph>{created ? copy.confirmCreated : copy.confirmExisting}</Paragraph>
        <Card>
          <Card.Content className="flex flex-col gap-3">
            <Paragraph>{eventTitle}</Paragraph>
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
      <PageSectionHeader eyebrow={copy.eyebrow} headline={copy.title} />
      <Paragraph>{copy.subtitle(eventTitle)}</Paragraph>
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
