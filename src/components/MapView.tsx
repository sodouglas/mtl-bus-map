import { MapContainer, TileLayer, Polyline, Tooltip } from "react-leaflet";
import type { RouteData, SelectedLocation, NearestStop } from "../types";
import { LocationMarker } from "./LocationMarker";
import { NearestStopMarkers } from "./NearestStopMarkers";
import { RouteStopMarkers } from "./RouteStopMarkers";

interface Props {
  selectedRoutes: RouteData[];
  colorMap: Map<string, string>;
  selectedLocation?: SelectedLocation | null;
  nearestStops?: NearestStop[];
  showStops?: boolean;
}

const MONTREAL: [number, number] = [45.5017, -73.5673];

export function MapView({ selectedRoutes, colorMap, selectedLocation, nearestStops = [], showStops }: Props) {
  return (
    <MapContainer center={MONTREAL} zoom={12} className="map-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {selectedRoutes.map((route) => {
        return (
          <Polyline
            key={`${route.id}-outline`}
            positions={route.path}
            pathOptions={{ color: "#222", weight: 7, opacity: 0.6 }}
          />
        );
      })}
      {selectedRoutes.map((route) => {
        const lineColor = colorMap.get(route.id) ?? route.color;
        return (
          <Polyline
            key={route.id}
            positions={route.path}
            pathOptions={{ color: lineColor, weight: 5, opacity: 1 }}
          >
            <Tooltip sticky>
              <strong>{route.routeNumber}</strong>
              {route.direction ? ` – ${route.direction}` : ""}
            </Tooltip>
          </Polyline>
        );
      })}
      {showStops && <RouteStopMarkers selectedRoutes={selectedRoutes} colorMap={colorMap} />}
      {selectedLocation && <LocationMarker location={selectedLocation} />}
      {nearestStops.length > 0 && <NearestStopMarkers stops={nearestStops} />}
    </MapContainer>
  );
}
