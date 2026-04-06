import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

const icon = L.divIcon({
  className: "user-location-leaflet-icon",
  html: '<div class="user-location-marker__dot"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface Props {
  lat: number;
  lng: number;
}

export function UserLocationDot({ lat, lng }: Props) {
  return (
    <Marker position={[lat, lng]} icon={icon} zIndexOffset={800}>
      <Tooltip direction="top" offset={[0, -8]} opacity={1} className="user-location-tooltip">
        Your location
      </Tooltip>
    </Marker>
  );
}
