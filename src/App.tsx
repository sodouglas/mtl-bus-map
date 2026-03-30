import { useEffect, useState } from "react";
import "./App.css";
import type { RouteData, SelectedLocation, NearestStop } from "./types";
import { RouteList } from "./components/RouteList";
import { MapView } from "./components/MapView";
import { LocationSearch } from "./components/LocationSearch";
import { distanceToPolyline, haversineDistance } from "./geometry";

const SELECTION_PALETTE = [
  "#E63946", "#2A9D8F", "#7B2FF7", "#FF006E",
  "#06D6A0", "#3A86FF", "#FB5607", "#8338EC",
  "#00BBF9", "#F72585", "#1D3557", "#FF4CC3",
];

export default function App() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [showStops, setShowStops] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}routes-data.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: RouteData[]) => {
        setRoutes(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function handleToggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleClearAll() {
    setSelectedIds(new Set());
    setSelectedLocation(null);
  }

  function handleLocationSelect(location: SelectedLocation) {
    setSelectedLocation(location);
    const nearbyIds: string[] = [];
    for (const route of routes) {
      if (distanceToPolyline(location.lat, location.lng, route.path) <= 200) {
        nearbyIds.push(route.id);
      }
    }
    if (nearbyIds.length > 0) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of nearbyIds) next.add(id);
        return next;
      });
    }
  }

  function handleClearLocation() {
    setSelectedLocation(null);
  }

  if (loading) {
    return <div className="loading-overlay">Loading route data…</div>;
  }

  if (error) {
    return (
      <div className="error-overlay">
        Failed to load routes: {error}
        <br />
        <small>Run `npm run process-gtfs` first to generate the data file.</small>
      </div>
    );
  }

  const colorMap = new Map<string, string>();
  let paletteIndex = 0;
  for (const id of selectedIds) {
    colorMap.set(id, SELECTION_PALETTE[paletteIndex % SELECTION_PALETTE.length]);
    paletteIndex++;
  }

  const selectedRoutes = routes.filter((r) => selectedIds.has(r.id));

  // For each nearby route, find the closest bus stop to the selected location
  const nearestStops: NearestStop[] = [];
  if (selectedLocation) {
    for (const route of selectedRoutes) {
      if (!route.stops || route.stops.length === 0) continue;
      let bestDist = Infinity;
      let bestStop = route.stops[0];
      for (const stop of route.stops) {
        const d = haversineDistance(
          selectedLocation.lat,
          selectedLocation.lng,
          stop.lat,
          stop.lng,
        );
        if (d < bestDist) {
          bestDist = d;
          bestStop = stop;
        }
      }
      nearestStops.push({
        routeNumber: route.routeNumber,
        stopName: bestStop.name,
        lat: bestStop.lat,
        lng: bestStop.lng,
        color: colorMap.get(route.id) ?? route.color,
      });
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <RouteList
          routes={routes}
          selectedIds={selectedIds}
          colorMap={colorMap}
          onToggle={handleToggle}
          onClearAll={handleClearAll}
          showStops={showStops}
          onToggleShowStops={() => setShowStops((s) => !s)}
          locationSearch={
            <LocationSearch
              onSelect={handleLocationSelect}
              onClear={handleClearLocation}
              hasLocation={selectedLocation !== null}
              locationName={selectedLocation?.displayName ?? ""}
            />
          }
        />
      </aside>
      <div className="map-wrapper">
        <MapView
          selectedRoutes={selectedRoutes}
          colorMap={colorMap}
          selectedLocation={selectedLocation}
          nearestStops={nearestStops}
          showStops={showStops}
        />
      </div>
    </div>
  );
}
