import { Marker, Circle } from "react-leaflet";
import L from "leaflet";
import type { SelectedLocation } from "../types";

const locationIcon = L.divIcon({
  className: "location-marker-icon",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface Props {
  location: SelectedLocation;
  radius: number;
}

export function LocationMarker({ location, radius }: Props) {
  return (
    <>
      <Marker position={[location.lat, location.lng]} icon={locationIcon} />
      <Circle
        center={[location.lat, location.lng]}
        radius={radius}
        pathOptions={{
          color: "#3A86FF",
          fillColor: "#3A86FF",
          fillOpacity: 0.12,
          weight: 2,
        }}
      />
    </>
  );
}
