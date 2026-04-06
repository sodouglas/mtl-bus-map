import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./App.css";
import type { RouteData, SelectedLocation, NearestStop } from "./types";
import type { CityConfig } from "./cityConfig";
import { CITY_LIST, DEFAULT_CITY } from "./cityConfig";
import { RouteList } from "./components/RouteList";
import { SelectedIsland } from "./components/SelectedIsland";
import { MapView } from "./components/MapView";
import { LocationSearchPair } from "./components/LocationSearchPair";
import { RadiusControl } from "./components/RadiusControl";
import { distanceToPolyline, findClosestStop } from "./geometry";
import { reverseGeocode } from "./geocoding";
import { WelcomeModal } from "./components/WelcomeModal";
import { WELCOME_DISMISSED_KEY } from "./welcomeSlides";

const DEFAULT_RADIUS = 200;

const SELECTION_PALETTE = [
  "#E63946",
  "#2A9D8F",
  "#7B2FF7",
  "#FF006E",
  "#06D6A0",
  "#3A86FF",
  "#FB5607",
  "#8338EC",
  "#00BBF9",
  "#F72585",
  "#1D3557",
  "#FF4CC3",
];

export default function App() {
  const [city, setCity] = useState<CityConfig>(DEFAULT_CITY);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<SelectedLocation | null>(null);
  const [destination, setDestination] = useState<SelectedLocation | null>(null);
  const [originRadius, setOriginRadius] = useState(DEFAULT_RADIUS);
  const [destinationRadius, setDestinationRadius] = useState(DEFAULT_RADIUS);
  const [showStops, setShowStops] = useState(false);
  const [enabledModes, setEnabledModes] = useState<Set<string>>(
    new Set(city.routeTypes),
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pinModeActive, setPinModeActive] = useState(false);
  const [pinTarget, setPinTarget] = useState<"origin" | "destination">(
    "origin",
  );
  const [highlightedRouteIds, setHighlightedRouteIds] = useState<Set<string>>(
    new Set(),
  );
  const [badgeBlink, setBadgeBlink] = useState<"found" | "empty" | null>(null);
  const [collapsedRadiusOpen, setCollapsedRadiusOpen] = useState(false);
  const [islandOpen, setIslandOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [mapFocus, setMapFocus] = useState<{
    token: number;
    lat: number;
    lng: number;
  } | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const [mobileSidebarStackPx, setMobileSidebarStackPx] = useState<
    number | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}${city.dataFile}`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: RouteData[]) => {
        setRoutes(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [city]);

  useEffect(() => {
    if (loading || error) return;
    queueMicrotask(() => {
      try {
        if (!localStorage.getItem(WELCOME_DISMISSED_KEY)) {
          setWelcomeOpen(true);
        }
      } catch {
        /* private mode */
      }
    });
  }, [loading, error]);

  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);

  function dismissWelcome() {
    try {
      localStorage.setItem(WELCOME_DISMISSED_KEY, "1");
    } catch {
      /* private mode */
    }
    setWelcomeOpen(false);
  }

  function handleCityChange(next: CityConfig) {
    if (next.id === city.id) return;
    setLoading(true);
    setError(null);
    setCity(next);
    setRoutes([]);
    setSelectedIds(new Set());
    setOrigin(null);
    setDestination(null);
    setHighlightedRouteIds(new Set());
    setEnabledModes(new Set(next.routeTypes));
    setPinModeActive(false);
    setShowStops(false);
    setMapFocus(null);
  }

  function requestMapFocus(lat: number, lng: number) {
    setMapFocus((prev) => ({
      token: (prev?.token ?? 0) + 1,
      lat,
      lng,
    }));
  }

  useEffect(() => {
    if (!pinModeActive) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPinModeActive(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pinModeActive]);

  const islandAboveExpandedSheet =
    sidebarOpen && islandOpen && selectedIds.size > 0;

  useLayoutEffect(() => {
    const el = sidebarRef.current;
    const mq = window.matchMedia("(max-width: 767px)");
    const needStack = mq.matches && islandAboveExpandedSheet;

    if (!needStack || !el) {
      setMobileSidebarStackPx(null);
      return;
    }

    const apply = () => setMobileSidebarStackPx(el.offsetHeight);

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);

    const onResize = () => {
      if (!window.matchMedia("(max-width: 767px)").matches) {
        setMobileSidebarStackPx(null);
        return;
      }
      apply();
    };
    window.addEventListener("resize", onResize);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onResize);
    } else {
      mq.addListener(onResize);
    }

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      if (typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", onResize);
      } else {
        mq.removeListener(onResize);
      }
    };
  }, [islandAboveExpandedSheet]);

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
          .filter(
            (r) => distanceToPolyline(orig.lat, orig.lng, r.path) <= origRadius,
          )
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

  function handleClearAll() {
    setSelectedIds(new Set());
    setOrigin(null);
    setDestination(null);
  }

  function handleOriginSelect(location: SelectedLocation) {
    setOrigin(location);
    recomputeSelection(location, destination, originRadius, destinationRadius);
    setPinModeActive(false);
    requestMapFocus(location.lat, location.lng);
  }

  function handleOriginClear() {
    setOrigin(null);
    recomputeSelection(null, destination, originRadius, destinationRadius);
  }

  function handleDestinationSelect(location: SelectedLocation) {
    setDestination(location);
    recomputeSelection(origin, location, originRadius, destinationRadius);
    setPinModeActive(false);
    requestMapFocus(location.lat, location.lng);
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

  function handleLocateRequest() {
    const target = !origin ? "origin" : !destination ? "destination" : "origin";
    setPinTarget(target);
    setPinModeActive(true);
    if (window.innerWidth < 768) setSidebarOpen(false);
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
        <small>
          Run `npm run process-gtfs` first to generate the data file.
        </small>
      </div>
    );
  }

  const visibleRoutes = routes.filter((r) => enabledModes.has(r.routeType));

  const colorMap = new Map<string, string>();
  let paletteIndex = 0;
  for (const id of selectedIds) {
    const route = routes.find((r) => r.id === id);
    if (route?.routeType === "metro") continue;
    colorMap.set(
      id,
      SELECTION_PALETTE[paletteIndex % SELECTION_PALETTE.length],
    );
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
      const idx = findClosestStop(
        destination.lat,
        destination.lng,
        route.stops,
      );
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
      <div
        className={`map-wrapper${pinModeActive ? " map-wrapper--pin-mode" : ""}`}
      >
        <MapView
          key={city.id}
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
          center={city.center}
          defaultZoom={city.defaultZoom}
          onLocate={handleLocateRequest}
          sidebarOpen={sidebarOpen}
          mapFocus={mapFocus}
        />
      </div>
      <aside
        ref={sidebarRef}
        className={`sidebar${sidebarOpen ? "" : " sidebar--minimized"}`}
      >
        <div className="sidebar-header">
          <button
            className="sidebar-toggle"
            onClick={() => {
              setSidebarOpen((v) => !v);
              setCollapsedRadiusOpen(false);
              setIslandOpen(false);
            }}
            aria-label={sidebarOpen ? "Minimize panel" : "Expand panel"}
            title={sidebarOpen ? "Minimize panel" : "Expand panel"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <rect x="1.5" y="1.5" width="15" height="15" rx="3" />
              <line x1="7" y1="1.5" x2="7" y2="16.5" />
            </svg>
          </button>
          <span
            className={`sidebar-badge-count${selectedIds.size > 0 ? " sidebar-badge-count--has-selection" : ""}${badgeBlink === "found" ? " badge-blink-found" : badgeBlink === "empty" ? " badge-blink-empty" : ""}${selectedIds.size > 0 ? " sidebar-badge-count--clickable" : ""}${islandOpen && selectedIds.size > 0 ? " sidebar-badge-count--active" : ""}`}
            onClick={
              selectedIds.size > 0
                ? () => {
                    if (!isMobile) return;
                    if (islandOpen && !sidebarOpen) {
                      setIslandOpen(false);
                    } else {
                      setSidebarOpen(false);
                      setIslandOpen(true);
                    }
                  }
                : undefined
            }
          >
            {`${selectedIds.size} route${selectedIds.size !== 1 ? "s" : ""}`}
          </span>
          <div className="city-switcher">
            {CITY_LIST.map((c) => (
              <button
                key={c.id}
                className={`city-switcher-btn${c.id === city.id ? " city-switcher-btn--active" : ""}`}
                onClick={() => handleCityChange(c)}
              >
                {c.agency}
              </button>
            ))}
          </div>
          {sidebarOpen && (
            <button
              type="button"
              className="sidebar-header-logo-btn"
              onClick={() => setWelcomeOpen(true)}
              title="Open welcome tour"
              aria-label="Open welcome tour"
            >
              <img
                src={`${import.meta.env.BASE_URL}logo_med.svg`}
                alt="Routely"
                className="sidebar-header-logo"
              />
            </button>
          )}
          {!sidebarOpen && (
            <>
              <button
                className={`collapsed-pin-btn${pinModeActive ? " collapsed-pin-btn--active" : ""}`}
                onClick={() => {
                  if (pinModeActive) {
                    setPinModeActive(false);
                  } else {
                    setPinTarget("origin");
                    setPinModeActive(true);
                  }
                }}
                title={pinModeActive ? "Cancel pin" : "Drop a pin"}
                aria-label={
                  pinModeActive ? "Cancel pin" : "Drop a pin on the map"
                }
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </button>
              <div className="collapsed-radius-wrapper">
                <button
                  className={`collapsed-radius-btn${collapsedRadiusOpen ? " collapsed-radius-btn--open" : ""}`}
                  onClick={() => setCollapsedRadiusOpen((v) => !v)}
                  title={`Search radius: ${originRadius}m`}
                  aria-label={`Adjust radius (${originRadius}m)`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <circle cx="7" cy="7" r="5.5" />
                    <circle cx="7" cy="7" r="2" />
                  </svg>
                </button>
                {collapsedRadiusOpen && !islandOpen && (
                  <div className="collapsed-radius-popover">
                    <div className="collapsed-radius-popover-section">
                      <span className="collapsed-radius-popover-label">
                        Origin
                      </span>
                      <RadiusControl
                        radius={originRadius}
                        onChange={handleOriginRadiusChange}
                      />
                    </div>
                    {destination && (
                      <div className="collapsed-radius-popover-section">
                        <span className="collapsed-radius-popover-label">
                          Destination
                        </span>
                        <RadiusControl
                          radius={destinationRadius}
                          onChange={handleDestinationRadiusChange}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="sidebar-body">
          <RouteList
            routes={visibleRoutes}
            selectedIds={selectedIds}
            colorMap={colorMap}
            onToggle={handleToggle}
            hasBothEndpoints={hasBothEndpoints}
            availableModes={city.routeTypes}
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
                bbox={city.bbox}
              />
            }
          />
        </div>
      </aside>
      <div
        className={`selected-island${islandOpen && (!sidebarOpen || selectedIds.size > 0) ? " selected-island--open" : ""}${sidebarOpen && !(islandOpen && selectedIds.size > 0) ? " selected-island--sidebar-open" : ""}${islandAboveExpandedSheet ? " selected-island--above-expanded-sidebar" : ""}`}
        style={
          mobileSidebarStackPx != null && islandAboveExpandedSheet
            ? {
                bottom: `calc(var(--panel-margin) + ${mobileSidebarStackPx}px + 8px)`,
              }
            : undefined
        }
      >
        {collapsedRadiusOpen && islandOpen && (
          <div className="collapsed-radius-popover collapsed-radius-popover--above-island">
            <div className="collapsed-radius-popover-section">
              <span className="collapsed-radius-popover-label">Origin</span>
              <RadiusControl
                radius={originRadius}
                onChange={handleOriginRadiusChange}
              />
            </div>
            {destination && (
              <div className="collapsed-radius-popover-section">
                <span className="collapsed-radius-popover-label">
                  Destination
                </span>
                <RadiusControl
                  radius={destinationRadius}
                  onChange={handleDestinationRadiusChange}
                />
              </div>
            )}
          </div>
        )}
        <SelectedIsland
          routes={visibleRoutes}
          selectedIds={selectedIds}
          highlightedRouteIds={highlightedRouteIds}
          colorMap={colorMap}
          onToggle={handleToggle}
          onHighlightRoute={handleHighlightRoute}
          onClearAll={handleClearAll}
          showStops={showStops}
          onToggleShowStops={() => setShowStops((s) => !s)}
          hasBothEndpoints={hasBothEndpoints}
          badgeBlink={badgeBlink}
          allowHeaderCollapse={!isMobile}
        />
      </div>
      {welcomeOpen ? <WelcomeModal onDismiss={dismissWelcome} /> : null}
    </div>
  );
}
