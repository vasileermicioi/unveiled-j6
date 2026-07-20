import { Alert, Card, Link, Paragraph, Skeleton, Surface } from "@heroui/react";
import type { Story } from "@ladle/react";

import { type EventMapMarker, EventMapMarkerPinChrome } from "../../islands/EventMap";
import { getEventMapCopy } from "../../lib/event-map-content";
import { localizedPath } from "../../lib/locale";

import { EventMapPage } from "./EventMapPage";

const sampleMarkers: EventMapMarker[] = [
  {
    id: "evt-1",
    title: "Tonight: Der Enkeltrick (Kriminalkomödie von Frank Piotraschke)",
    partnerName: "Berliner Kriminal Theater",
    address: "Palisadenstraße 48, 10243 Berlin",
    lat: 52.5181715,
    lng: 13.4399455,
    href: "/en/events/evt-1",
  },
  {
    id: "evt-2",
    title: "Die Renaissance des Bisexuell-Seins",
    partnerName: "theatre pool",
    address: "Boxhagener Str. 18, 10245 Berlin",
    lat: 52.5128003,
    lng: 13.4550712,
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

/** Pin chrome without MapLibre / tiles (shape + brand colors). */
export const MarkerPinChrome: Story = () => (
  <Surface className="flex flex-col items-start gap-4 p-4" variant="transparent">
    <Paragraph>Map pin marker (static chrome)</Paragraph>
    <Surface className="flex items-end gap-6" variant="transparent">
      {sampleMarkers.map((marker) => (
        <Surface className="flex flex-col items-center gap-2" key={marker.id} variant="transparent">
          <EventMapMarkerPinChrome title={marker.title} />
          <Paragraph>{marker.title}</Paragraph>
        </Surface>
      ))}
    </Surface>
  </Surface>
);
MarkerPinChrome.storyName = "EventMap / Marker pin chrome";

export const Loading: Story = () => (
  <Surface className="event-map flex flex-col gap-3 p-4" variant="transparent">
    <Surface className="event-map__canvas-wrap" variant="transparent">
      <Skeleton className="event-map__skeleton" />
      <div className="event-map__canvas" />
    </Surface>
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

const storyCategoryOptions = [
  { id: "Theater", label: "Theater" },
  { id: "Kino", label: "Kino" },
];
const storyPartnerOptions = [{ id: "partner-1", label: "Sample Partner" }];

export const MarkersPageChrome: Story = () => (
  <EventMapPage
    categoryOptions={storyCategoryOptions}
    filteredTotal={2}
    locale="en"
    markers={sampleMarkers}
    partnerOptions={storyPartnerOptions}
    query={{
      category: "Theater",
      partnerId: undefined,
      from: undefined,
      to: undefined,
      page: 1,
    }}
  />
);
MarkersPageChrome.storyName = "EventMapPage / Markers (consent-gated island)";

export const EmptyFiltered: Story = () => (
  <EventMapPage
    categoryOptions={storyCategoryOptions}
    filteredTotal={0}
    locale="en"
    markers={[]}
    partnerOptions={storyPartnerOptions}
    query={{
      category: "Kino",
      partnerId: undefined,
      from: "2099-01-01",
      to: "2099-01-02",
      page: 1,
    }}
  />
);
EmptyFiltered.storyName = "EventMapPage / Empty filtered";
