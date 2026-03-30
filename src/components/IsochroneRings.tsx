import { Polygon, Tooltip } from "react-leaflet";
import type { IsochroneRing } from "../types";

interface Props {
  rings: IsochroneRing[];
}

// Spectrum from inner (close/green) to outer (far/red)
const BAND_COLORS = [
  "#22c55e", // 5 min  — green
  "#84cc16", // 10 min — lime
  "#eab308", // 15 min — yellow
  "#f97316", // 20 min — orange
  "#ef4444", // 25 min — red
  "#a855f7", // 30 min — purple
];

export function IsochroneRings({ rings }: Props) {
  // Sort by band ascending to get stable color indices
  const byMinutes = [...rings].sort((a, b) => a.maxMinutes - b.maxMinutes);

  // Render largest-first so outer bands sit behind inner ones
  const renderOrder = [...byMinutes].reverse();

  return (
    <>
      {renderOrder.map((ring) => {
        const bandIndex = byMinutes.findIndex((r) => r.maxMinutes === ring.maxMinutes);
        const color = BAND_COLORS[bandIndex % BAND_COLORS.length];

        // Wrap each polygon in an extra array for Leaflet multi-polygon format:
        // LatLng[][][] → renders as one shape, no stacking opacity on overlaps
        const multiPolygon = ring.polygons.map((poly) => [poly]);

        return (
          <Polygon
            key={ring.maxMinutes}
            positions={multiPolygon}
            pathOptions={{
              color,
              weight: 1.5,
              fillColor: color,
              fillOpacity: 0.2,
              opacity: 0.6,
            }}
          >
            <Tooltip sticky>{ring.maxMinutes} min</Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
