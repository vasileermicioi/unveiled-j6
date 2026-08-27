import { Input, Label, Surface } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

const BERLIN_CENTER = { lat: 52.52, lng: 13.405 };
const DEFAULT_ZOOM = 12;

type EventGeoPickerProps = {
  locale: Locale;
  /** Preserved derived coords from an existing event (edit). */
  lat?: string | null;
  lng?: string | null;
  /** External lat from address geocode (partner prefill / address blur). */
  externalLat?: string | null;
  /** External lng from address geocode (partner prefill / address blur). */
  externalLng?: string | null;
  /**
   * Increment when external coords should apply after mount.
   * Null/invalid external lat+lng with revision ≥ 1 clears resolved coords (soft-fail).
   */
  externalRevision?: number;
};

function parseCoordinate(value: string | null | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasResolvedCoords(lat?: string | null, lng?: string | null): boolean {
  if (!lat?.trim() || !lng?.trim()) {
    return false;
  }
  const latN = Number.parseFloat(lat);
  const lngN = Number.parseFloat(lng);
  return Number.isFinite(latN) && Number.isFinite(lngN);
}

function applyPreviewCoords(
  map: import("maplibre-gl").Map | null,
  marker: import("maplibre-gl").Marker | null,
  nextLat: number,
  nextLng: number,
) {
  if (map && marker) {
    marker.setLngLat([nextLng, nextLat]);
    map.easeTo({ center: [nextLng, nextLat], zoom: DEFAULT_ZOOM });
  }
}

export function EventGeoPicker({
  locale,
  lat,
  lng,
  externalLat,
  externalLng,
  externalRevision = 0,
}: EventGeoPickerProps) {
  const copy = getAdminCopy(locale);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const pendingExternalRef = useRef<{ lat: number; lng: number } | null>(null);
  const initialResolved = hasResolvedCoords(lat, lng);
  const initialLat = parseCoordinate(lat, BERLIN_CENTER.lat);
  const initialLng = parseCoordinate(lng, BERLIN_CENTER.lng);
  const [resolved, setResolved] = useState(initialResolved);
  const [coords, setCoords] = useState({
    lat: initialResolved ? initialLat.toFixed(6) : "",
    lng: initialResolved ? initialLng.toFixed(6) : "",
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const maplibregl = await import("maplibre-gl");

      if (cancelled || !containerRef.current) {
        return;
      }

      const pending = pendingExternalRef.current;
      const startLat = pending?.lat ?? initialLat;
      const startLng = pending?.lng ?? initialLng;

      const map = new maplibregl.Map({
        attributionControl: false,
        center: [startLng, startLat],
        container: containerRef.current,
        style: {
          layers: [{ id: "osm", source: "osm", type: "raster" }],
          sources: {
            osm: {
              attribution: "© OpenStreetMap contributors",
              tileSize: 256,
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              type: "raster",
            },
          },
          version: 8,
        },
        zoom: DEFAULT_ZOOM,
      });

      const marker = new maplibregl.Marker({ draggable: false })
        .setLngLat([startLng, startLat])
        .addTo(map);

      mapRef.current = map;
      markerRef.current = marker;

      if (pending) {
        pendingExternalRef.current = null;
        setResolved(true);
        setCoords({
          lat: startLat.toFixed(6),
          lng: startLng.toFixed(6),
        });
      }
    })();

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      mapRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (externalRevision < 1) {
      return;
    }

    const nextLat = parseCoordinate(externalLat, Number.NaN);
    const nextLng = parseCoordinate(externalLng, Number.NaN);
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      setResolved(false);
      setCoords({ lat: "", lng: "" });
      return;
    }

    if (!mapRef.current || !markerRef.current) {
      pendingExternalRef.current = { lat: nextLat, lng: nextLng };
    }

    applyPreviewCoords(mapRef.current, markerRef.current, nextLat, nextLng);
    setResolved(true);
    setCoords({
      lat: nextLat.toFixed(6),
      lng: nextLng.toFixed(6),
    });
  }, [externalLat, externalLng, externalRevision]);

  return (
    <Surface className="flex flex-col gap-2" variant="transparent">
      <Label>{copy.mapLocationLabel}</Label>
      <Surface className="admin-form__geo-map-wrap" variant="transparent">
        <div className="admin-form__geo-map" ref={containerRef} />
      </Surface>
      <Input name="lat" type="hidden" value={resolved ? coords.lat : ""} />
      <Input name="lng" type="hidden" value={resolved ? coords.lng : ""} />
    </Surface>
  );
}
