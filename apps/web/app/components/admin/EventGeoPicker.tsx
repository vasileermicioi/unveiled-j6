"use client";

import { Input, Label, Surface } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

const BERLIN_CENTER = { lat: 52.52, lng: 13.405 };
const DEFAULT_ZOOM = 12;

type EventGeoPickerProps = {
  locale: Locale;
  lat?: string | null;
  lng?: string | null;
  mapZoom?: number | null;
  /** External lat from partner geocode (create/series). */
  externalLat?: string | null;
  /** External lng from partner geocode (create/series). */
  externalLng?: string | null;
  /** Increment when external coords should apply after mount. */
  externalRevision?: number;
};

function parseCoordinate(value: string | null | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function applyExternalCoords(
  map: import("maplibre-gl").Map | null,
  marker: import("maplibre-gl").Marker | null,
  nextLat: number,
  nextLng: number,
  setCoords: (
    updater: (current: { lat: string; lng: string; zoom: number }) => {
      lat: string;
      lng: string;
      zoom: number;
    },
  ) => void,
) {
  if (map && marker) {
    marker.setLngLat([nextLng, nextLat]);
    map.easeTo({ center: [nextLng, nextLat] });
    setCoords((current) => ({
      ...current,
      lat: nextLat.toFixed(6),
      lng: nextLng.toFixed(6),
      zoom: Math.round(map.getZoom()),
    }));
    return;
  }

  setCoords((current) => ({
    ...current,
    lat: nextLat.toFixed(6),
    lng: nextLng.toFixed(6),
  }));
}

export function EventGeoPicker({
  locale,
  lat,
  lng,
  mapZoom,
  externalLat,
  externalLng,
  externalRevision = 0,
}: EventGeoPickerProps) {
  const copy = getAdminCopy(locale);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const pendingExternalRef = useRef<{ lat: number; lng: number } | null>(null);
  const initialLat = parseCoordinate(lat, BERLIN_CENTER.lat);
  const initialLng = parseCoordinate(lng, BERLIN_CENTER.lng);
  const initialZoom = mapZoom ?? DEFAULT_ZOOM;
  const [coords, setCoords] = useState({
    lat: initialLat.toFixed(6),
    lng: initialLng.toFixed(6),
    zoom: initialZoom,
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
        zoom: initialZoom,
      });

      const marker = new maplibregl.Marker({ draggable: true })
        .setLngLat([startLng, startLat])
        .addTo(map);

      mapRef.current = map;
      markerRef.current = marker;

      if (pending) {
        pendingExternalRef.current = null;
        setCoords((current) => ({
          ...current,
          lat: startLat.toFixed(6),
          lng: startLng.toFixed(6),
        }));
      }

      const syncCoords = () => {
        const position = marker.getLngLat();
        setCoords({
          lat: position.lat.toFixed(6),
          lng: position.lng.toFixed(6),
          zoom: Math.round(map.getZoom()),
        });
      };

      marker.on("dragend", syncCoords);
      map.on("click", (event) => {
        marker.setLngLat(event.lngLat);
        syncCoords();
      });
      map.on("moveend", syncCoords);
      map.on("zoomend", syncCoords);
    })();

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      mapRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [initialLat, initialLng, initialZoom]);

  useEffect(() => {
    if (externalRevision < 1) {
      return;
    }

    const nextLat = parseCoordinate(externalLat, Number.NaN);
    const nextLng = parseCoordinate(externalLng, Number.NaN);
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      return;
    }

    if (!mapRef.current || !markerRef.current) {
      pendingExternalRef.current = { lat: nextLat, lng: nextLng };
    }

    applyExternalCoords(mapRef.current, markerRef.current, nextLat, nextLng, setCoords);
  }, [externalLat, externalLng, externalRevision]);

  return (
    <Surface className="flex flex-col gap-2" variant="transparent">
      <Label>{copy.mapLocationLabel}</Label>
      <Surface className="admin-form__geo-map-wrap" variant="transparent">
        <div className="admin-form__geo-map" ref={containerRef} />
      </Surface>
      <Input name="lat" type="hidden" value={coords.lat} />
      <Input name="lng" type="hidden" value={coords.lng} />
      <Input name="map_zoom" type="hidden" value={String(coords.zoom)} />
    </Surface>
  );
}
