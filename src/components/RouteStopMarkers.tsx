import { useMemo } from "react";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { RouteData } from "../types";

function makeStopIcon(color: string, isMetro: boolean) {
  const cssClass = isMetro ? "metro-stop-icon" : "route-stop-icon";
  const size = isMetro ? 10 : 8;
  return L.divIcon({
    className: "",
    html: `<div class="${cssClass}" style="background:${color}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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
      const isMetro = route.routeType === "metro";
      const cacheKey = `${color}-${isMetro ? "m" : "b"}`;
      if (!cache.has(cacheKey)) {
        cache.set(cacheKey, makeStopIcon(color, isMetro));
      }
    }
    return cache;
  }, [selectedRoutes, colorMap]);

  return (
    <>
      {selectedRoutes.map((route) => {
        const color = colorMap.get(route.id) ?? route.color;
        const isMetro = route.routeType === "metro";
        const icon = iconCache.get(`${color}-${isMetro ? "m" : "b"}`)!;
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
