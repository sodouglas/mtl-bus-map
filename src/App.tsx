import { useEffect, useState } from "react";
import "./App.css";
import type { RouteData, SelectedLocation, NearestStop } from "./types";
import { RouteList } from "./components/RouteList";
import { MapView } from "./components/MapView";
import { LocationSearch } from "./components/LocationSearch";
import { RadiusControl } from "./components/RadiusControl";
import { distanceToPolyline, haversineDistance } from "./geometry";

const DEFAULT_RADIUS = 200;

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
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [radiusExpanded, setRadiusExpanded] = useState(false);
  const [showStops, setShowStops] = useState(false);
  const [enabledModes, setEnabledModes] = useState<Set<string>>(new Set(["bus", "metro"]));
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);

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

  function handleToggleMode(mode: string) {
    setEnabledModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) {
        next.delete(mode);
      } else {
        next.add(mode);
      }
      return next;
    });
  }

  function handleClearAll() {
    setSelectedIds(new Set());
    setSelectedLocation(null);
  }

  function selectNearbyRoutes(location: SelectedLocation, r: number) {
    const nearbyIds = routes
      .filter((route) => distanceToPolyline(location.lat, location.lng, route.path) <= r)
      .map((route) => route.id);
    setSelectedIds(new Set(nearbyIds));
  }

  function handleLocationSelect(location: SelectedLocation) {
    setSelectedLocation(location);
    selectNearbyRoutes(location, radius);
  }

  function handleClearLocation() {
    setSelectedLocation(null);
  }

  function handleRadiusChange(r: number) {
    setRadius(r);
    if (selectedLocation) {
      selectNearbyRoutes(selectedLocation, r);
    }
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

  const visibleRoutes = routes.filter((r) => enabledModes.has(r.routeType));

  const colorMap = new Map<string, string>();
  let paletteIndex = 0;
  for (const id of selectedIds) {
    const route = routes.find((r) => r.id === id);
    if (route?.routeType === "metro") continue;
    colorMap.set(id, SELECTION_PALETTE[paletteIndex % SELECTION_PALETTE.length]);
    paletteIndex++;
  }

  const selectedRoutes = visibleRoutes.filter((r) => selectedIds.has(r.id));

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
      <div className="map-wrapper">
        <MapView
          selectedRoutes={selectedRoutes}
          colorMap={colorMap}
          selectedLocation={selectedLocation}
          locationRadius={radius}
          nearestStops={nearestStops}
          showStops={showStops}
        />
      </div>
      <aside className={`sidebar${sidebarOpen ? "" : " sidebar--collapsed"}`}>
        <RouteList
          routes={visibleRoutes}
          selectedIds={selectedIds}
          colorMap={colorMap}
          onToggle={handleToggle}
          onClearAll={handleClearAll}
          enabledModes={enabledModes}
          onToggleMode={handleToggleMode}
          showStops={showStops}
          onToggleShowStops={() => setShowStops((s) => !s)}
          locationSearch={
            <div className="location-section">
              <div className="location-section-row">
                <LocationSearch
                  onSelect={handleLocationSelect}
                  onClear={handleClearLocation}
                  hasLocation={selectedLocation !== null}
                  locationName={selectedLocation?.displayName ?? ""}
                />
                <button
                  className={`radius-expand-btn${radiusExpanded ? " radius-expand-btn--open" : ""}`}
                  onClick={() => setRadiusExpanded((v) => !v)}
                  title="Toggle search radius"
                  aria-label="Toggle search radius"
                >
                  ···
                </button>
              </div>
              {radiusExpanded && <RadiusControl radius={radius} onChange={handleRadiusChange} />}
            </div>
          }
        />
      </aside>
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label={sidebarOpen ? "Hide panel" : "Show panel"}
        title={sidebarOpen ? "Hide panel" : "Show panel"}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="1.5" y="1.5" width="15" height="15" rx="3" />
          <line x1="7" y1="1.5" x2="7" y2="16.5" />
        </svg>
      </button>
    </div>
  );
}
