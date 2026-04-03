import type { ReactNode } from "react";
import { useState } from "react";
import type { RouteData } from "../types";
import { RouteItem } from "./RouteItem";

interface Props {
  routes: RouteData[];
  selectedIds: Set<string>;
  colorMap: Map<string, string>;
  onToggle: (id: string) => void;
  locationSearch: ReactNode;
  hasBothEndpoints?: boolean;
}

export function RouteList({
  routes,
  selectedIds,
  colorMap,
  onToggle,
  locationSearch,
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
