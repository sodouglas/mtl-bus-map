import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { NearestStop } from "../types";

function stopIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div class="nearest-stop-icon" style="background:${color}"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

interface Props {
  stops: NearestStop[];
}

export function NearestStopMarkers({ stops }: Props) {
  return (
    <>
      {stops.map((stop, i) => (
        <Marker
          key={`${stop.routeNumber}-${stop.lat}-${stop.lng}-${i}`}
          position={[stop.lat, stop.lng]}
          icon={stopIcon(stop.color)}
        >
          <Tooltip>
            <strong>{stop.routeNumber}</strong> — {stop.stopName}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
