import { Button, Form, Link, Paragraph, Surface } from "@heroui/react";
import type { FeaturedEventRow } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { formatEventDateTime } from "../../lib/admin-event-form";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminFeaturedPath, adminFeaturedRemovePath } from "./AdminPageShell";

type AdminFeaturedRemovePageProps = {
  locale: Locale;
  events: FeaturedEventRow[];
  imageUrls: Record<string, string | undefined>;
  selectedEventIds: string[];
  error?: string | null;
};

export function AdminFeaturedRemovePage({
  locale,
  events,
  imageUrls,
  selectedEventIds,
  error,
}: AdminFeaturedRemovePageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminFeaturedPath(locale);
  const selectedSet = new Set(selectedEventIds);
  const selectedEvents = events.filter((event) => selectedSet.has(event.id));

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.featuredTitle, href: listHref },
        { label: copy.featuredRemoveTitle },
      ]}
      title={copy.featuredRemoveTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.featuredRemoveBody}</Paragraph>

      {selectedEvents.length > 0 ? (
        <Surface className="flex flex-col gap-3" variant="transparent">
          {selectedEvents.map((event) => {
            const thumb = imageUrls[event.id];
            return (
              <Surface className="flex items-center gap-3" key={event.id} variant="transparent">
                {thumb ? (
                  <Surface className="admin-table__logo" variant="transparent">
                    <img alt="" src={thumb} />
                  </Surface>
                ) : (
                  <Surface
                    aria-hidden
                    className="admin-table__logo admin-table__logo--placeholder"
                    variant="transparent"
                  >
                    <Paragraph color="muted" size="sm">
                      {copy.imagePlaceholderLabel}
                    </Paragraph>
                  </Surface>
                )}
                <Surface className="flex flex-col" variant="transparent">
                  <Paragraph>{event.title}</Paragraph>
                  <Paragraph color="muted">{formatEventDateTime(event.dateTime, locale)}</Paragraph>
                </Surface>
              </Surface>
            );
          })}
        </Surface>
      ) : null}

      <Form action={adminFeaturedRemovePath(locale)} className="flex flex-col gap-4" method="post">
        {selectedEventIds.map((eventId) => (
          <input key={eventId} name="eventIds" type="hidden" value={eventId} />
        ))}
        <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
          <Button className="button button--primary button--md" type="submit">
            {copy.featuredRemoveConfirm}
          </Button>
          <Link className="button button--secondary button--md" href={listHref}>
            {copy.cancel}
          </Link>
        </Surface>
      </Form>
    </AdminPageShell>
  );
}
