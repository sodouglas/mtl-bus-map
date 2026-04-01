import type { ReactNode } from "react";
import { useState } from "react";
import type { RouteData } from "../types";
import { RouteItem } from "./RouteItem";

interface Props {
  routes: RouteData[];
  selectedIds: Set<string>;
  colorMap: Map<string, string>;
  onToggle: (id: string) => void;
  onClearAll: () => void;
  enabledModes: Set<string>;
  onToggleMode: (mode: string) => void;
  locationSearch: ReactNode;
  showStops: boolean;
  onToggleShowStops: () => void;
  hasBothEndpoints?: boolean;
}

export function RouteList({
  routes,
  selectedIds,
  colorMap,
  onToggle,
  onClearAll,
  locationSearch,
  showStops,
  onToggleShowStops,
  hasBothEndpoints = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"metro" | "bus">("metro");

  const metroRoutes = routes.filter((r) => r.routeType === "metro");
  const busRoutes = routes.filter((r) => r.routeType === "bus");

  const q = query.toLowerCase();
  const filteredBus = q
    ? busRoutes.filter(
        (r) =>
          r.routeNumber.toLowerCase().includes(q) ||
          r.direction.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q),
      )
    : busRoutes;

  const selectedInOrder: RouteData[] = [];
  for (const id of selectedIds) {
    const route = filteredBus.find((r) => r.id === id);
    if (route) selectedInOrder.push(route);
  }
  const unselectedBus = filteredBus.filter((r) => !selectedIds.has(r.id));

  return (
    <div className="route-list">
      <div className="route-list-header">
        {locationSearch}
        <div className="route-list-meta">
          <span>
            {hasBothEndpoints
              ? `${selectedIds.size} connecting route${selectedIds.size !== 1 ? "s" : ""}`
              : `${selectedIds.size} selected`}
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
              Stops
            </label>
          )}
        </div>
        {hasBothEndpoints && selectedIds.size === 0 && (
          <p className="no-connecting-routes">No direct routes found between these locations.</p>
        )}
      </div>
      <div className="tab-bar">
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
            <div className="tab-search">
              <input
                type="search"
                placeholder="Search routes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {filteredBus.length === 0 ? (
              <p className="no-results">No routes match &ldquo;{query}&rdquo;</p>
            ) : (
              <>
                {selectedInOrder.map((route) => (
                  <RouteItem
                    key={route.id}
                    route={route}
                    selected
                    colorOverride={colorMap.get(route.id)}
                    onToggle={onToggle}
                  />
                ))}
                {selectedInOrder.length > 0 && unselectedBus.length > 0 && (
                  <div className="route-list-divider" />
                )}
                {unselectedBus.map((route) => (
                  <RouteItem
                    key={route.id}
                    route={route}
                    selected={false}
                    onToggle={onToggle}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
