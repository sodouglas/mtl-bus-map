import { useMemo } from "react";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { RouteData } from "../types";

function makeStopIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div class="route-stop-icon" style="background:${color}"></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });
}

interface Props {
  selectedRoutes: RouteData[];
  colorMap: Map<string, string>;
}

export function RouteStopMarkers({ selectedRoutes, colorMap }: Props) {
  const iconCache = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    for (const route of selectedRoutes) {
      const color = colorMap.get(route.id) ?? route.color;
      if (!cache.has(color)) {
        cache.set(color, makeStopIcon(color));
      }
    }
    return cache;
  }, [selectedRoutes, colorMap]);

  return (
    <>
      {selectedRoutes.map((route) => {
        const color = colorMap.get(route.id) ?? route.color;
        const icon = iconCache.get(color)!;
        return route.stops.map((stop, i) => (
          <Marker
            key={`${route.id}-stop-${i}`}
            position={[stop.lat, stop.lng]}
            icon={icon}
          >
            <Tooltip>
              <strong>{route.routeNumber}</strong> — {stop.name}
              {route.direction ? <br /> : ""}
              {route.direction && <small>{route.direction}</small>}
            </Tooltip>
          </Marker>
        ));
      })}
    </>
  );
}
