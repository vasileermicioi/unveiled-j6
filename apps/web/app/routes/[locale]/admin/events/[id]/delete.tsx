import { Button, Form, Link, Paragraph, Surface } from "@heroui/react";
import { deleteEvent, getEventById } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminFormError } from "../../../../../components/admin/AdminFormError";
import { AdminPageShell, adminEventsPath } from "../../../../../components/admin/AdminPageShell";
import { eventListPath } from "../../../../../components/admin/EventAdminForm";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import {
  formatEventDateTime,
  guardAdminRoute,
  mapCatalogError,
} from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";

function renderDeletePage(
  c: Context,
  options: {
    locale: Locale;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    error?: string | null;
  },
) {
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.eventsTitle, href: adminEventsPath(options.locale) },
        { label: copy.deleteEventTitle },
      ]}
      title={copy.deleteEventTitle}
    >
      {options.error ? <AdminFormError message={options.error} /> : null}
      <Paragraph>{copy.deleteEventBody(options.eventTitle, options.eventDate)}</Paragraph>
      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        <Form action={`/${options.locale}/admin/events/${options.eventId}/delete`} method="post">
          <Button className="button button--primary button--md" type="submit">
            {copy.deleteConfirm}
          </Button>
        </Form>
        <Link className="button button--secondary button--md" href={eventListPath(options.locale)}>
          {copy.cancel}
        </Link>
      </Surface>
    </AdminPageShell>,
    {
      locale: options.locale,
      title: copy.deleteEventTitle,
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const eventId = c.req.param("id");
  if (!eventId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const { db } = getAuthOptions();
  const existing = await getEventById(db, eventId);
  if (!existing) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  try {
    await deleteEvent(db, eventId);
    return c.redirect(eventListPath(guard.locale), 302);
  } catch (error) {
    return renderDeletePage(c, {
      locale: guard.locale,
      eventId,
      eventTitle: existing.title,
      eventDate: formatEventDateTime(existing.dateTime, guard.locale),
      error: mapCatalogError(error, guard.locale),
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const eventId = c.req.param("id");
  if (!eventId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const { db } = getAuthOptions();
  const event = await getEventById(db, eventId);
  if (!event) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  return renderDeletePage(c, {
    locale: guard.locale,
    eventId,
    eventTitle: event.title,
    eventDate: formatEventDateTime(event.dateTime, guard.locale),
  });
});
