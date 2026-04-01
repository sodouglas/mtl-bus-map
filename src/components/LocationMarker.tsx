import { Marker, Circle } from "react-leaflet";
import L from "leaflet";
import type { SelectedLocation } from "../types";

const DEFAULT_COLOR = "#3A86FF";

function locationIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

interface Props {
  location: SelectedLocation;
  radius: number;
  color?: string;
}

export function LocationMarker({ location, radius, color = DEFAULT_COLOR }: Props) {
  return (
    <>
      <Marker position={[location.lat, location.lng]} icon={locationIcon(color)} />
      <Circle
        center={[location.lat, location.lng]}
        radius={radius}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 2,
        }}
      />
    </>
  );
}
