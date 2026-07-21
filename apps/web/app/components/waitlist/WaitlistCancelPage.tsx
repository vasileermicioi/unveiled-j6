import { Alert, Button, Card, Form, Link, Paragraph, Surface } from "@heroui/react";

import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { WaitlistCancelCopy } from "../../lib/waitlist-content";
import { PageSectionHeader } from "../marketing/PageSectionHeader";

export type WaitlistCancelView = "confirm" | "success";

export type WaitlistCancelPageProps = {
  locale: Locale;
  copy: WaitlistCancelCopy;
  view: WaitlistCancelView;
  entryId: string;
  eventTitle: string;
  eventId?: string;
  errorMessage?: string | null;
};

export function WaitlistCancelPage({
  locale,
  copy,
  view,
  entryId,
  eventTitle,
  eventId,
  errorMessage,
}: WaitlistCancelPageProps) {
  const action = localizedPath(locale, `waitlist/${entryId}/cancel`);
  const backHref = eventId
    ? localizedPath(locale, `events/${eventId}`)
    : localizedPath(locale, "events");

  if (view === "success") {
    return (
      <Surface
        className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12 sm:px-6"
        variant="transparent"
      >
        <PageSectionHeader eyebrow={copy.successEyebrow} headline={copy.successTitle} />
        <Paragraph>{copy.successBody}</Paragraph>
        <Link className="button button--primary button--md" href={backHref}>
          {copy.back}
        </Link>
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

      {errorMessage ? (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Description>{errorMessage}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Card>
        <Card.Content className="flex flex-col gap-6">
          <Paragraph>{copy.confirmBody}</Paragraph>
          <Form action={action} className="flex flex-col gap-4" method="post">
            <Button className="button button--primary button--md" type="submit">
              {copy.submit}
            </Button>
          </Form>
        </Card.Content>
      </Card>

      <Link className="button button--secondary button--md" href={backHref}>
        {copy.back}
      </Link>
    </Surface>
  );
}
