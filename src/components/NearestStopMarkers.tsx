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
  const hasBothEndpoints =
    stops.some((s) => s.endpoint === "origin") &&
    stops.some((s) => s.endpoint === "destination");

  return (
    <>
      {stops.map((stop, i) => {
        const hint = hasBothEndpoints
          ? stop.endpoint === "origin"
            ? " (board here)"
            : " (exit here)"
          : "";
        return (
          <Marker
            key={`${stop.routeNumber}-${stop.endpoint}-${stop.lat}-${stop.lng}-${i}`}
            position={[stop.lat, stop.lng]}
            icon={stopIcon(stop.color)}
          >
            <Tooltip direction="top" className="stop-tooltip">
              <strong>{stop.routeNumber}</strong> — {stop.stopName}
              {hint}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
