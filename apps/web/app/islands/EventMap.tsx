"use client";

import { Alert, Card, Link, Paragraph, Skeleton, Surface } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import { CONSENT_CHANGE_EVENT, getStoredConsent, type StoredConsent } from "../lib/cookie-consent";
import { getEventMapCopy } from "../lib/event-map-content";
import type { Locale } from "../lib/locale";
import { localizedPath } from "../lib/locale";

const BERLIN_CENTER: [number, number] = [13.405, 52.52];
const DEFAULT_ZOOM = 11;
const OSM_TILES = ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"];
const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

export type EventMapMarker = {
  id: string;
  title: string;
  partnerName: string;
  address?: string | null;
  lat: number;
  lng: number;
  href: string;
};

type EventMapProps = {
  locale: Locale;
  markers: EventMapMarker[];
};

type ConsentGate = "pending" | "accepted" | "blocked";

function resolveConsentGate(): ConsentGate {
  const stored = getStoredConsent();
  if (stored?.decision === "accepted") {
    return "accepted";
  }
  return "blocked";
}

function createMarkerElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "event-map__marker";
  el.setAttribute("role", "img");
  return el;
}

function createPopupContent(marker: EventMapMarker, openLabel: string): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "event-map__popup";

  const title = document.createElement("p");
  title.className = "event-map__popup-title";
  title.textContent = marker.title;
  root.appendChild(title);

  const partner = document.createElement("p");
  partner.className = "event-map__popup-partner";
  partner.textContent = marker.partnerName;
  root.appendChild(partner);

  if (marker.address?.trim()) {
    const address = document.createElement("p");
    address.className = "event-map__popup-address";
    address.textContent = marker.address.trim();
    root.appendChild(address);
  }

  const link = document.createElement("a");
  link.className = "event-map__popup-link";
  link.href = marker.href;
  link.textContent = openLabel;
  root.appendChild(link);

  return root;
}

function EventMapFallbackList({
  locale,
  markers,
  showConsentPrompt,
}: {
  locale: Locale;
  markers: EventMapMarker[];
  showConsentPrompt: boolean;
}) {
  const copy = getEventMapCopy(locale);

  return (
    <Surface className="flex flex-col gap-4" variant="transparent">
      {showConsentPrompt ? (
        <Alert status="warning">
          <Alert.Content>
            <Alert.Title>{copy.consentTitle}</Alert.Title>
            <Alert.Description>{copy.consentBody}</Alert.Description>
          </Alert.Content>
          <Link
            className="button button--secondary button--md"
            href={localizedPath(locale, "privacy")}
          >
            {copy.consentPrivacy}
          </Link>
        </Alert>
      ) : null}

      {markers.length === 0 ? (
        <Paragraph>{copy.emptyMarkers}</Paragraph>
      ) : (
        <Surface className="flex flex-col gap-3" variant="transparent">
          {markers.map((marker) => (
            <Card key={marker.id}>
              <Card.Header>
                <Card.Title>{marker.title}</Card.Title>
                <Card.Description>{marker.partnerName}</Card.Description>
              </Card.Header>
              <Card.Content>
                {marker.address?.trim() ? <Paragraph>{marker.address.trim()}</Paragraph> : null}
                <Link className="button button--secondary button--sm" href={marker.href}>
                  {copy.popupOpen}
                </Link>
              </Card.Content>
            </Card>
          ))}
        </Surface>
      )}
    </Surface>
  );
}

export default function EventMap({ locale, markers }: EventMapProps) {
  const copy = getEventMapCopy(locale);
  const containerRef = useRef<HTMLDivElement>(null);
  const [consent, setConsent] = useState<ConsentGate>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setConsent(resolveConsentGate());

    const onConsentChange = (event: Event) => {
      const detail = (event as CustomEvent<StoredConsent>).detail;
      if (detail?.decision === "accepted") {
        setConsent("accepted");
        return;
      }
      setConsent("blocked");
    };

    window.addEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
  }, []);

  useEffect(() => {
    if (consent !== "accepted") {
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    let map: import("maplibre-gl").Map | null = null;
    const markersOnMap: import("maplibre-gl").Marker[] = [];
    const popups: import("maplibre-gl").Popup[] = [];

    setLoading(true);
    setError(false);

    void (async () => {
      try {
        const maplibregl = await import("maplibre-gl");

        if (cancelled || !containerRef.current) {
          return;
        }

        map = new maplibregl.Map({
          attributionControl: {
            compact: true,
            customAttribution: OSM_ATTRIBUTION,
          },
          center: BERLIN_CENTER,
          container: containerRef.current,
          style: {
            layers: [{ id: "osm", source: "osm", type: "raster" }],
            sources: {
              osm: {
                attribution: OSM_ATTRIBUTION,
                tileSize: 256,
                tiles: OSM_TILES,
                type: "raster",
              },
            },
            version: 8,
          },
          zoom: DEFAULT_ZOOM,
        });

        map.on("load", () => {
          if (cancelled || !map) {
            return;
          }

          const bounds = new maplibregl.LngLatBounds();

          for (const marker of markers) {
            const popup = new maplibregl.Popup({
              closeButton: true,
              maxWidth: "280px",
            }).setDOMContent(createPopupContent(marker, copy.popupOpen));
            popups.push(popup);

            const mapMarker = new maplibregl.Marker({ element: createMarkerElement() })
              .setLngLat([marker.lng, marker.lat])
              .setPopup(popup)
              .addTo(map);
            markersOnMap.push(mapMarker);
            bounds.extend([marker.lng, marker.lat]);
          }

          const only = markers[0];
          if (markers.length === 1 && only) {
            map.setCenter([only.lng, only.lat]);
            map.setZoom(13);
          } else if (markers.length > 1 && !bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
          }

          setLoading(false);
        });
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const marker of markersOnMap) {
        marker.remove();
      }
      for (const popup of popups) {
        popup.remove();
      }
      map?.remove();
    };
  }, [consent, markers, copy.popupOpen]);

  if (consent === "pending") {
    return (
      <Surface className="event-map" variant="transparent">
        <Skeleton className="event-map__skeleton" />
      </Surface>
    );
  }

  if (consent === "blocked") {
    return <EventMapFallbackList locale={locale} markers={markers} showConsentPrompt />;
  }

  return (
    <Surface className="event-map flex flex-col gap-3" variant="transparent">
      {error ? (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Title>{copy.loadError}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}

      {loading ? <Skeleton className="event-map__skeleton" /> : null}

      <Surface
        aria-label={copy.mapAriaLabel}
        className="event-map__canvas-wrap"
        role="region"
        variant="transparent"
      >
        <div className="event-map__canvas" ref={containerRef} />
      </Surface>

      <Paragraph className="event-map__attribution">{copy.attribution}</Paragraph>
    </Surface>
  );
}
