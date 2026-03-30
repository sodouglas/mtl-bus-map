import { useMemo } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import type { RouteData } from "../types";
import { sampleArrowPoints } from "../geometry";

interface Props {
  selectedRoutes: RouteData[];
  colorMap: Map<string, string>;
}

export function RouteArrows({ selectedRoutes, colorMap }: Props) {
  const arrowsByRoute = useMemo(
    () =>
      selectedRoutes.map((route) => ({
        id: route.id,
        color: colorMap.get(route.id) ?? route.color,
        points: sampleArrowPoints(route.path, 500),
      })),
    [selectedRoutes, colorMap],
  );

  return (
    <>
      {arrowsByRoute.map(({ id, points }) =>
        points.map((pt, i) => (
          <Marker
            key={`${id}-arrow-${i}`}
            position={[pt.lat, pt.lng]}
            interactive={false}
            icon={L.divIcon({
              className: "route-arrow-icon",
              html: `<div style="transform:rotate(${pt.angle - 90}deg)">&#x25B8;</div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })}
          />
        )),
      )}
    </>
  );
}
