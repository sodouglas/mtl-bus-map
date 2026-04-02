import { useEffect, useRef, useState } from "react";
import "./App.css";
import type { RouteData, SelectedLocation, NearestStop } from "./types";
import { RouteList } from "./components/RouteList";
import { MapView } from "./components/MapView";
import { LocationSearchPair } from "./components/LocationSearchPair";
import { distanceToPolyline, findClosestStop } from "./geometry";
import { reverseGeocode } from "./geocoding";

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
  const [origin, setOrigin] = useState<SelectedLocation | null>(null);
  const [destination, setDestination] = useState<SelectedLocation | null>(null);
  const [originRadius, setOriginRadius] = useState(DEFAULT_RADIUS);
  const [destinationRadius, setDestinationRadius] = useState(DEFAULT_RADIUS);
  const [showStops, setShowStops] = useState(false);
  const [enabledModes, setEnabledModes] = useState<Set<string>>(new Set(["bus", "metro"]));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pinModeActive, setPinModeActive] = useState(false);
  const [pinTarget, setPinTarget] = useState<"origin" | "destination">("origin");
  const [highlightedRouteIds, setHighlightedRouteIds] = useState<Set<string>>(new Set());
  const [badgeBlink, setBadgeBlink] = useState<"found" | "empty" | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout>>(null);

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

  useEffect(() => {
    if (!pinModeActive) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPinModeActive(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pinModeActive]);

  function recomputeSelection(
    orig: SelectedLocation | null,
    dest: SelectedLocation | null,
    origRadius: number,
    destRadius: number,
  ) {
    if (!orig && !dest) {
      setSelectedIds(new Set());
      return;
    }

    let matchingIds: Set<string>;

    if (orig && dest) {
      const nearOrigin = new Set(
        routes
          .filter((r) => distanceToPolyline(orig.lat, orig.lng, r.path) <= origRadius)
          .map((r) => r.id),
      );
      matchingIds = new Set(
        routes
          .filter(
            (r) =>
              nearOrigin.has(r.id) &&
              distanceToPolyline(dest.lat, dest.lng, r.path) <= destRadius,
          )
          .map((r) => r.id),
      );
    } else {
      const loc = orig ?? dest!;
      const rad = orig ? origRadius : destRadius;
      matchingIds = new Set(
        routes
          .filter((r) => distanceToPolyline(loc.lat, loc.lng, r.path) <= rad)
          .map((r) => r.id),
      );
    }

    setSelectedIds(matchingIds);

    if (blinkTimer.current) clearTimeout(blinkTimer.current);
    setBadgeBlink(matchingIds.size > 0 ? "found" : "empty");
    blinkTimer.current = setTimeout(() => setBadgeBlink(null), 1200);
  }

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

  function handleHighlightRoute(id: string | null) {
    if (id === null) {
      setHighlightedRouteIds(new Set());
    } else {
      setHighlightedRouteIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
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
    setOrigin(null);
    setDestination(null);
  }

  function handleOriginSelect(location: SelectedLocation) {
    setOrigin(location);
    recomputeSelection(location, destination, originRadius, destinationRadius);
    setPinModeActive(false);
  }

  function handleOriginClear() {
    setOrigin(null);
    recomputeSelection(null, destination, originRadius, destinationRadius);
  }

  function handleDestinationSelect(location: SelectedLocation) {
    setDestination(location);
    recomputeSelection(origin, location, originRadius, destinationRadius);
    setPinModeActive(false);
  }

  function handleDestinationClear() {
    setDestination(null);
    recomputeSelection(origin, null, originRadius, destinationRadius);
  }

  function handleOriginRadiusChange(r: number) {
    setOriginRadius(r);
    recomputeSelection(origin, destination, r, destinationRadius);
  }

  function handleDestinationRadiusChange(r: number) {
    setDestinationRadius(r);
    recomputeSelection(origin, destination, originRadius, r);
  }

  async function handlePinConfirm(lat: number, lng: number) {
    const target = pinTarget;
    const name = await reverseGeocode(lat, lng);
    const location: SelectedLocation = { displayName: name, lat, lng };
    if (target === "destination") {
      handleDestinationSelect(location);
    } else {
      handleOriginSelect(location);
    }
  }

  function handlePinCancel() {
    setPinModeActive(false);
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
  const hasBothEndpoints = origin !== null && destination !== null;

  const nearestStops: NearestStop[] = [];
  for (const route of selectedRoutes) {
    if (!route.stops || route.stops.length === 0) continue;
    const routeColor = colorMap.get(route.id) ?? route.color;

    if (origin) {
      const idx = findClosestStop(origin.lat, origin.lng, route.stops);
      const stop = route.stops[idx];
      nearestStops.push({
        routeNumber: route.routeNumber,
        stopName: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        color: routeColor,
        endpoint: "origin",
      });
    }

    if (destination) {
      const idx = findClosestStop(destination.lat, destination.lng, route.stops);
      const stop = route.stops[idx];
      nearestStops.push({
        routeNumber: route.routeNumber,
        stopName: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        color: routeColor,
        endpoint: "destination",
      });
    }
  }

  return (
    <div className="app">
      <div className={`map-wrapper${pinModeActive ? " map-wrapper--pin-mode" : ""}`}>
        <MapView
          selectedRoutes={selectedRoutes}
          colorMap={colorMap}
          highlightedRouteIds={highlightedRouteIds}
          onHighlightRoute={handleHighlightRoute}
          origin={origin}
          destination={destination}
          originRadius={originRadius}
          destinationRadius={destinationRadius}
          nearestStops={nearestStops}
          showStops={showStops}
          pinModeActive={pinModeActive}
          pinStyle={window.innerWidth < 768 ? "center" : "click"}
          onPinConfirm={handlePinConfirm}
          onPinCancel={handlePinCancel}
        />
      </div>
      <aside className={`sidebar${sidebarOpen ? "" : " sidebar--minimized"}`}>
        <div className="sidebar-header">
          <div className="transit-strip" aria-hidden="true">
            <span className="transit-bus">{` ________\n|[]  [] |>\n o      o`}</span>
            <span className="transit-metro">{` ______________\n|[]|[]|[]|[]|=>\n o            o`}</span>
          </div>
          {!sidebarOpen && (
            <span className={`sidebar-badge-count${badgeBlink === "found" ? " badge-blink-found" : badgeBlink === "empty" ? " badge-blink-empty" : ""}`}>
              {`${selectedIds.size} route${selectedIds.size !== 1 ? "s" : ""}`}
            </span>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Minimize panel" : "Expand panel"}
            title={sidebarOpen ? "Minimize panel" : "Expand panel"}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="1.5" y="1.5" width="15" height="15" rx="3" />
              <line x1="7" y1="1.5" x2="7" y2="16.5" />
            </svg>
          </button>
        </div>
        <div className="sidebar-body">
          <RouteList
            routes={visibleRoutes}
            selectedIds={selectedIds}
            highlightedRouteIds={highlightedRouteIds}
            colorMap={colorMap}
            onToggle={handleToggle}
            onHighlightRoute={handleHighlightRoute}
            onClearAll={handleClearAll}
            enabledModes={enabledModes}
            onToggleMode={handleToggleMode}
            showStops={showStops}
            onToggleShowStops={() => setShowStops((s) => !s)}
            hasBothEndpoints={hasBothEndpoints}
            badgeBlink={badgeBlink}
            locationSearch={
              <LocationSearchPair
                origin={origin}
                destination={destination}
                originRadius={originRadius}
                destinationRadius={destinationRadius}
                onOriginSelect={handleOriginSelect}
                onOriginClear={handleOriginClear}
                onDestinationSelect={handleDestinationSelect}
                onDestinationClear={handleDestinationClear}
                onOriginRadiusChange={handleOriginRadiusChange}
                onDestinationRadiusChange={handleDestinationRadiusChange}
                pinModeActive={pinModeActive}
                pinTarget={pinTarget}
                onPinClick={(target) => {
                  if (target === null) {
                    setPinModeActive(false);
                  } else {
                    setPinTarget(target);
                    setPinModeActive(true);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }
                }}
              />
            }
          />
        </div>
      </aside>
    </div>
  );
}
