import { Paragraph, Surface } from "@heroui/react";
import { EventCard, type EventCardItem, type EventCardViewerState } from "@unveiled/ui";
import type { ReactNode } from "react";

import type { Locale } from "../../lib/locale";

type AdminEventPreviewCardFrameProps = {
  locale: Locale;
  event: EventCardItem;
  ctaHref: string;
  viewer?: EventCardViewerState;
  note?: string;
  header?: ReactNode;
};

export function AdminEventPreviewCardFrame({
  locale,
  event,
  ctaHref,
  viewer,
  note,
  header,
}: AdminEventPreviewCardFrameProps) {
  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8"
      variant="transparent"
    >
      {header}
      {note ? (
        <Paragraph color="muted" size="sm">
          {note}
        </Paragraph>
      ) : null}
      <Surface
        className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variant="transparent"
      >
        <EventCard ctaHref={ctaHref} event={event} locale={locale} viewer={viewer} />
      </Surface>
    </Surface>
  );
}
