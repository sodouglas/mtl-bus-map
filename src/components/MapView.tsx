import { useRef } from "react";
import { MapContainer, TileLayer, Polyline, Tooltip, ZoomControl } from "react-leaflet";
import L from "leaflet";
import type { RouteData, SelectedLocation, NearestStop } from "../types";
import { LocationMarker } from "./LocationMarker";
import { NearestStopMarkers } from "./NearestStopMarkers";
import { RouteArrows } from "./RouteArrows";
import { RouteStopMarkers } from "./RouteStopMarkers";
import { MapCenterPin } from "./MapCenterPin";

interface Props {
  selectedRoutes: RouteData[];
  colorMap: Map<string, string>;
  selectedLocation?: SelectedLocation | null;
  locationRadius?: number;
  nearestStops?: NearestStop[];
  showStops?: boolean;
  pinModeActive?: boolean;
  onPinConfirm?: (lat: number, lng: number) => void;
  onPinCancel?: () => void;
}

const MONTREAL: [number, number] = [45.5017, -73.5673];

export function MapView({
  selectedRoutes,
  colorMap,
  selectedLocation,
  locationRadius = 200,
  nearestStops = [],
  showStops,
  pinModeActive = false,
  onPinConfirm,
  onPinCancel,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);

  function handleConfirm() {
    if (mapRef.current && onPinConfirm) {
      const { lat, lng } = mapRef.current.getCenter();
      onPinConfirm(lat, lng);
    }
  }

  return (
    <>
      <MapContainer
        ref={mapRef}
        center={MONTREAL}
        zoom={12}
        className="map-container"
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {selectedRoutes.map((route) => {
          const isMetro = route.routeType === "metro";
          return (
            <Polyline
              key={`${route.id}-outline`}
              positions={route.path}
              pathOptions={{ color: "#222", weight: isMetro ? 10 : 7, opacity: 0.6 }}
            />
          );
        })}
        {selectedRoutes.map((route) => {
          const lineColor = colorMap.get(route.id) ?? route.color;
          const isMetro = route.routeType === "metro";
          return (
            <Polyline
              key={route.id}
              positions={route.path}
              pathOptions={{ color: lineColor, weight: isMetro ? 7 : 5, opacity: 1 }}
            >
              <Tooltip sticky>
                <strong>{route.routeNumber}</strong>
                {route.direction ? ` – ${route.direction}` : ""}
              </Tooltip>
            </Polyline>
          );
        })}
        <RouteArrows selectedRoutes={selectedRoutes} colorMap={colorMap} />
        {showStops && <RouteStopMarkers selectedRoutes={selectedRoutes} colorMap={colorMap} />}
        {selectedLocation && <LocationMarker location={selectedLocation} radius={locationRadius} />}
        {nearestStops.length > 0 && <NearestStopMarkers stops={nearestStops} />}
      </MapContainer>
      {pinModeActive && onPinConfirm && onPinCancel && (
        <MapCenterPin onConfirm={handleConfirm} onCancel={onPinCancel} />
      )}
    </>
  );
}
