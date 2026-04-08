import type { ReactNode } from "react";
import { useState } from "react";
import type { RouteData } from "../types";
import type { RouteMode } from "../cityConfig";
import { RouteItem } from "./RouteItem";

const TAB_LABELS: Record<RouteMode, string> = {
  metro: "Metro",
  streetcar: "Streetcar",
  bus: "Bus",
  train: "Train",
};

interface Props {
  routes: RouteData[];
  selectedIds: Set<string>;
  colorMap: Map<string, string>;
  onToggle: (id: string) => void;
  locationSearch: ReactNode;
  hasBothEndpoints?: boolean;
  availableModes: RouteMode[];
}

export function RouteList({
  routes,
  selectedIds,
  colorMap,
  onToggle,
  locationSearch,
  hasBothEndpoints = false,
  availableModes,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeTabRaw, setActiveTab] = useState<RouteMode>(availableModes[0]);
  const activeTab = availableModes.includes(activeTabRaw) ? activeTabRaw : availableModes[0];

  const routesByType = new Map<RouteMode, RouteData[]>();
  for (const mode of availableModes) {
    routesByType.set(mode, routes.filter((r) => r.routeType === mode));
  }

  const agencies = new Set(routes.map((r) => r.agency).filter(Boolean));
  const showAgency = agencies.size > 1;

  const searchableTabs = new Set<RouteMode>(["bus", "streetcar"]);
  const q = query.toLowerCase();

  function filterRoutes(list: RouteData[]) {
    if (!q) return list;
    return list.filter(
      (r) =>
        r.routeNumber.toLowerCase().includes(q) ||
        r.direction.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q),
    );
  }

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
          {availableModes.map((mode) => (
            <button
              key={mode}
              className={`tab${activeTab === mode ? " tab--active" : ""}`}
              onClick={() => { setActiveTab(mode); setQuery(""); }}
            >
              {TAB_LABELS[mode]}
            </button>
          ))}
        </div>
        {searchableTabs.has(activeTab) && (
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
        {(() => {
          const tabRoutes = routesByType.get(activeTab) ?? [];
          const filtered = searchableTabs.has(activeTab) ? filterRoutes(tabRoutes) : tabRoutes;

          if (searchableTabs.has(activeTab) && q && filtered.length === 0) {
            return (
              <p className="no-results">
                No routes match &ldquo;{query}&rdquo;
              </p>
            );
          }

          return filtered.map((route) => (
            <RouteItem
              key={route.id}
              route={route}
              selected={selectedIds.has(route.id)}
              colorOverride={
                selectedIds.has(route.id) ? colorMap.get(route.id) : undefined
              }
              onToggle={onToggle}
              showAgency={showAgency}
            />
          ));
        })()}
      </div>
    </div>
  );
}
