import type { ReactNode } from "react";
import { useState } from "react";
import type { RouteData } from "../types";
import { RouteItem } from "./RouteItem";

interface Props {
  routes: RouteData[];
  selectedIds: Set<string>;
  highlightedRouteId: string | null;
  colorMap: Map<string, string>;
  onToggle: (id: string) => void;
  onHighlightRoute: (id: string | null) => void;
  onClearAll: () => void;
  enabledModes: Set<string>;
  onToggleMode: (mode: string) => void;
  locationSearch: ReactNode;
  showStops: boolean;
  onToggleShowStops: () => void;
  hasBothEndpoints?: boolean;
  badgeBlink?: "found" | "empty" | null;
}

export function RouteList({
  routes,
  selectedIds,
  highlightedRouteId,
  colorMap,
  onToggle,
  onHighlightRoute,
  onClearAll,
  locationSearch,
  showStops,
  onToggleShowStops,
  hasBothEndpoints = false,
  badgeBlink = null,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"metro" | "bus">("metro");
  const [summaryState, setSummaryState] = useState({
    expanded: true,
    prevSize: 0,
  });
  let { expanded: summaryExpanded } = summaryState;
  if (selectedIds.size !== summaryState.prevSize) {
    if (selectedIds.size === 0) summaryExpanded = true;
    else if (selectedIds.size > 8) summaryExpanded = false;
    setSummaryState({ expanded: summaryExpanded, prevSize: selectedIds.size });
  }
  const setSummaryExpanded = (v: boolean | ((prev: boolean) => boolean)) =>
    setSummaryState((s) => ({
      ...s,
      expanded: typeof v === "function" ? v(s.expanded) : v,
    }));

  const metroRoutes = routes.filter((r) => r.routeType === "metro");
  const busRoutes = routes.filter((r) => r.routeType === "bus");

  const selectedRoutes = routes.filter((r) => selectedIds.has(r.id));
  const selectedMetro = selectedRoutes.filter((r) => r.routeType === "metro");
  const selectedBus = selectedRoutes.filter((r) => r.routeType === "bus");
  const hasBothTypes = selectedMetro.length > 0 && selectedBus.length > 0;

  const q = query.toLowerCase();
  const filteredBus = q
    ? busRoutes.filter(
        (r) =>
          r.routeNumber.toLowerCase().includes(q) ||
          r.direction.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q),
      )
    : busRoutes;

  return (
    <div className="route-list">
      <div className="route-list-header">
        {locationSearch}
        {hasBothEndpoints && selectedIds.size === 0 && (
          <p className="no-connecting-routes">
            No direct routes found between these locations.
          </p>
        )}
      </div>
      <div className="selected-summary">
        <div className="selected-summary-header">
          {selectedIds.size > 0 && (
            <button
              className={`selected-summary-toggle${summaryExpanded ? " selected-summary-toggle--open" : ""}`}
              onClick={() => setSummaryExpanded((v) => !v)}
              aria-label={
                summaryExpanded
                  ? "Collapse selected routes"
                  : "Expand selected routes"
              }
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path
                  d="M3 1l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <span
            className={`selected-summary-count${
              badgeBlink === "found"
                ? " badge-blink-found"
                : badgeBlink === "empty"
                  ? " badge-blink-empty"
                  : ""
            }${selectedIds.size > 0 ? " selected-summary-count--clickable" : ""}`}
            onClick={
              selectedIds.size > 0
                ? () => setSummaryExpanded((v) => !v)
                : undefined
            }
          >
            {hasBothEndpoints
              ? `${selectedIds.size} connecting route${selectedIds.size !== 1 ? "s" : ""}`
              : `${selectedIds.size} route${selectedIds.size !== 1 ? "s" : ""} selected`}
          </span>
          {selectedIds.size > 0 && (
            <button className="route-list-meta-button" onClick={onClearAll}>
              Clear
            </button>
          )}
          {selectedIds.size > 0 && (
            <label className="show-stops-toggle" htmlFor="show-stops">
              <input
                type="checkbox"
                id="show-stops"
                checked={showStops}
                onChange={onToggleShowStops}
              />
              <span className="show-stops-indicator" />
              Show stops
            </label>
          )}
        </div>
        {summaryExpanded && selectedIds.size > 0 && (
          <div className="selected-summary-items">
            {hasBothTypes && (
              <div className="selected-summary-group-label">Metro</div>
            )}
            {selectedMetro.map((route) => (
              <RouteItem
                key={route.id}
                route={route}
                selected
                colorOverride={route.color}
                onToggle={onToggle}
                highlighted={highlightedRouteId === route.id}
                onHighlightRoute={onHighlightRoute}
              />
            ))}
            {hasBothTypes && (
              <div className="selected-summary-group-label">Bus</div>
            )}
            {selectedBus.map((route) => (
              <RouteItem
                key={route.id}
                route={route}
                selected
                colorOverride={colorMap.get(route.id)}
                onToggle={onToggle}
                highlighted={highlightedRouteId === route.id}
                onHighlightRoute={onHighlightRoute}
              />
            ))}
          </div>
        )}
      </div>
      <div className="tab-bar">
        <div className="tab-bar-tabs">
          <button
            className={`tab${activeTab === "metro" ? " tab--active" : ""}`}
            onClick={() => setActiveTab("metro")}
          >
            Metro
          </button>
          <button
            className={`tab${activeTab === "bus" ? " tab--active" : ""}`}
            onClick={() => setActiveTab("bus")}
          >
            Bus
          </button>
        </div>
        {activeTab === "bus" && (
          <div className="tab-search">
            <input
              type="search"
              placeholder="Search routes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="route-list-items">
        {activeTab === "metro" &&
          metroRoutes.map((route) => (
            <RouteItem
              key={route.id}
              route={route}
              selected={selectedIds.has(route.id)}
              colorOverride={
                selectedIds.has(route.id) ? colorMap.get(route.id) : undefined
              }
              onToggle={onToggle}
            />
          ))}
        {activeTab === "bus" && (
          <>
            {filteredBus.length === 0 ? (
              <p className="no-results">
                No routes match &ldquo;{query}&rdquo;
              </p>
            ) : (
              filteredBus.map((route) => (
                <RouteItem
                  key={route.id}
                  route={route}
                  selected={selectedIds.has(route.id)}
                  colorOverride={
                    selectedIds.has(route.id)
                      ? colorMap.get(route.id)
                      : undefined
                  }
                  onToggle={onToggle}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
