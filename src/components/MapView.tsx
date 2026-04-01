import { useRef } from "react";
import { MapContainer, TileLayer, Polyline, Tooltip, ZoomControl } from "react-leaflet";
import L from "leaflet";
import type { RouteData, SelectedLocation, NearestStop } from "../types";
import { LocationMarker } from "./LocationMarker";
import { NearestStopMarkers } from "./NearestStopMarkers";
import { RouteArrows } from "./RouteArrows";
import { RouteStopMarkers } from "./RouteStopMarkers";
import { MapCenterPin } from "./MapCenterPin";
import { MapClickHandler } from "./MapClickHandler";

interface Props {
  selectedRoutes: RouteData[];
  colorMap: Map<string, string>;
  origin?: SelectedLocation | null;
  destination?: SelectedLocation | null;
  originRadius?: number;
  destinationRadius?: number;
  nearestStops?: NearestStop[];
  showStops?: boolean;
  pinModeActive?: boolean;
  pinStyle?: "center" | "click";
  onPinConfirm?: (lat: number, lng: number) => void;
  onPinCancel?: () => void;
}

const MONTREAL: [number, number] = [45.5017, -73.5673];
const ORIGIN_COLOR = "#3A86FF";
const DESTINATION_COLOR = "#E63946";

export function MapView({
  selectedRoutes,
  colorMap,
  origin,
  destination,
  originRadius = 200,
  destinationRadius = 200,
  nearestStops = [],
  showStops,
  pinModeActive = false,
  pinStyle = "center",
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
        {origin && <LocationMarker location={origin} radius={originRadius} color={ORIGIN_COLOR} />}
        {destination && <LocationMarker location={destination} radius={destinationRadius} color={DESTINATION_COLOR} />}
        {nearestStops.length > 0 && <NearestStopMarkers stops={nearestStops} />}
        {pinModeActive && pinStyle === "click" && onPinConfirm && (
          <MapClickHandler onPin={onPinConfirm} />
        )}
      </MapContainer>
      {pinModeActive && pinStyle === "center" && onPinConfirm && onPinCancel && (
        <MapCenterPin onConfirm={handleConfirm} onCancel={onPinCancel} />
      )}
    </>
  );
}
