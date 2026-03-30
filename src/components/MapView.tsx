import { MapContainer, TileLayer, Polyline, Tooltip } from "react-leaflet";
import type { RouteData } from "../types";

interface Props {
  selectedRoutes: RouteData[];
  colorMap: Map<string, string>;
}

const MONTREAL: [number, number] = [45.5017, -73.5673];

export function MapView({ selectedRoutes, colorMap }: Props) {
  return (
    <MapContainer center={MONTREAL} zoom={12} className="map-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {selectedRoutes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.path}
          pathOptions={{ color: colorMap.get(route.id) ?? route.color, weight: 3, opacity: 0.8 }}
        >
          <Tooltip sticky>
            <strong>{route.routeNumber}</strong>
            {route.direction ? ` – ${route.direction}` : ""}
          </Tooltip>
        </Polyline>
      ))}
    </MapContainer>
  );
}
