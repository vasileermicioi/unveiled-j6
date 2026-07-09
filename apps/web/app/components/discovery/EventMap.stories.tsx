import { Alert, Card, Link, Paragraph, Skeleton, Surface } from "@heroui/react";
import type { Story } from "@ladle/react";

import type { EventMapMarker } from "../../islands/EventMap";
import { getEventMapCopy } from "../../lib/event-map-content";
import { localizedPath } from "../../lib/locale";

import { EventMapPage } from "./EventMapPage";

const sampleMarkers: EventMapMarker[] = [
  {
    id: "evt-1",
    title: "Tonight: Stadt ohne Schlaf",
    partnerName: "Volksbühne Berlin",
    address: "Rosa-Luxemburg-Platz, 10178 Berlin",
    lat: 52.5265,
    lng: 13.412,
    href: "/en/events/evt-1",
  },
  {
    id: "evt-2",
    title: "Tartuffe — Molière",
    partnerName: "Deutsches Theater",
    address: "Schumannstraße 13A, 10117 Berlin",
    lat: 52.5248,
    lng: 13.3825,
    href: "/en/events/evt-2",
  },
];

/** Static consent-fallback chrome (no MapLibre / tiles). */
export const ConsentFallback: Story = () => {
  const copy = getEventMapCopy("en");
  return (
    <Surface className="flex flex-col gap-4 p-4" variant="transparent">
      <Alert status="warning">
        <Alert.Content>
          <Alert.Title>{copy.consentTitle}</Alert.Title>
          <Alert.Description>{copy.consentBody}</Alert.Description>
        </Alert.Content>
        <Link className="button button--secondary button--md" href={localizedPath("en", "privacy")}>
          {copy.consentPrivacy}
        </Link>
      </Alert>
      <Surface className="flex flex-col gap-3" variant="transparent">
        {sampleMarkers.map((marker) => (
          <Card key={marker.id}>
            <Card.Header>
              <Card.Title>{marker.title}</Card.Title>
              <Card.Description>{marker.partnerName}</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-2">
              {marker.address ? <Paragraph>{marker.address}</Paragraph> : null}
              <Surface className="flex flex-col gap-2 sm:flex-row" variant="transparent">
                <Link className="button button--secondary button--sm" href={marker.href}>
                  {copy.popupOpen}
                </Link>
                <Link
                  className="button button--secondary button--sm"
                  href={`https://www.openstreetmap.org/?mlat=${marker.lat}&mlon=${marker.lng}#map=16/${marker.lat}/${marker.lng}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {copy.externalMaps}
                </Link>
              </Surface>
            </Card.Content>
          </Card>
        ))}
      </Surface>
    </Surface>
  );
};
ConsentFallback.storyName = "EventMap / Consent fallback";

export const Loading: Story = () => (
  <Surface className="event-map p-4" variant="transparent">
    <Skeleton className="event-map__skeleton" />
  </Surface>
);
Loading.storyName = "EventMap / Loading";

export const ErrorState: Story = () => {
  const copy = getEventMapCopy("en");
  return (
    <Surface className="flex flex-col gap-3 p-4" variant="transparent">
      <Alert status="danger">
        <Alert.Content>
          <Alert.Title>{copy.loadError}</Alert.Title>
        </Alert.Content>
      </Alert>
      <Skeleton className="event-map__skeleton" />
    </Surface>
  );
};
ErrorState.storyName = "EventMap / Error";

export const MarkersPageChrome: Story = () => (
  <EventMapPage
    filteredTotal={2}
    locale="en"
    mapItemCount={2}
    markers={sampleMarkers}
    query={{ category: "Theater", partnerId: undefined, from: undefined, to: undefined }}
  />
);
MarkersPageChrome.storyName = "EventMapPage / Markers (consent-gated island)";

export const EmptyFiltered: Story = () => (
  <EventMapPage
    filteredTotal={0}
    locale="en"
    mapItemCount={0}
    markers={[]}
    query={{
      category: "Kino",
      partnerId: undefined,
      from: "2099-01-01",
      to: "2099-01-02",
    }}
  />
);
EmptyFiltered.storyName = "EventMapPage / Empty filtered";
