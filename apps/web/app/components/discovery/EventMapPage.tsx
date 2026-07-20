import { Alert, Paragraph, Surface } from "@heroui/react";

import EventMap, { type EventMapMarker } from "../../islands/EventMap";
import type { EventFeedQuery } from "../../lib/event-feed";
import { getEventMapCopy } from "../../lib/event-map-content";
import type { Locale } from "../../lib/locale";
import type { AdminFormSelectOption } from "../admin/AdminFormSelect";

import { EventDiscoveryShell } from "./EventDiscoveryShell";

export type EventMapPageProps = {
  locale: Locale;
  query: EventFeedQuery;
  markers: EventMapMarker[];
  /** Total matching feed filters (before coord filter). */
  filteredTotal: number;
  categoryOptions: AdminFormSelectOption[];
  partnerOptions: AdminFormSelectOption[];
};

export function EventMapPage({
  locale,
  query,
  markers,
  filteredTotal,
  categoryOptions,
  partnerOptions,
}: EventMapPageProps) {
  const copy = getEventMapCopy(locale);
  const showEmptyFiltered = filteredTotal === 0;
  const showEmptyMarkers = filteredTotal > 0 && markers.length === 0;

  return (
    <EventDiscoveryShell
      categoryOptions={categoryOptions}
      locale={locale}
      partnerOptions={partnerOptions}
      query={query}
      total={filteredTotal}
      view="map"
    >
      <Surface className="flex flex-col gap-4" variant="transparent">
        {showEmptyFiltered ? (
          <Alert status="accent">
            <Alert.Content>
              <Alert.Description>{copy.emptyFiltered}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        {showEmptyMarkers ? <Paragraph>{copy.emptyMarkers}</Paragraph> : null}

        {!showEmptyFiltered ? <EventMap locale={locale} markers={markers} /> : null}
      </Surface>
    </EventDiscoveryShell>
  );
}
