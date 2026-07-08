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
};

function parseCoordinate(value: string | null | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function EventGeoPicker({ locale, lat, lng, mapZoom }: EventGeoPickerProps) {
  const copy = getAdminCopy(locale);
  const containerRef = useRef<HTMLDivElement>(null);
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
    let map: import("maplibre-gl").Map | null = null;
    let marker: import("maplibre-gl").Marker | null = null;

    void (async () => {
      const maplibregl = await import("maplibre-gl");

      if (cancelled || !containerRef.current) {
        return;
      }

      map = new maplibregl.Map({
        attributionControl: false,
        center: [initialLng, initialLat],
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

      marker = new maplibregl.Marker({ draggable: true })
        .setLngLat([initialLng, initialLat])
        .addTo(map);

      const syncCoords = () => {
        const position = marker?.getLngLat();
        if (!position || !map) {
          return;
        }

        setCoords({
          lat: position.lat.toFixed(6),
          lng: position.lng.toFixed(6),
          zoom: Math.round(map.getZoom()),
        });
      };

      marker.on("dragend", syncCoords);
      map.on("click", (event) => {
        marker?.setLngLat(event.lngLat);
        syncCoords();
      });
      map.on("moveend", syncCoords);
      map.on("zoomend", syncCoords);
    })();

    return () => {
      cancelled = true;
      marker?.remove();
      map?.remove();
    };
  }, [initialLat, initialLng, initialZoom]);

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
