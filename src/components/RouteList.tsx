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
  locationSearch: ReactNode;
  showStops: boolean;
  onToggleShowStops: () => void;
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
}: Props) {
  const [query, setQuery] = useState("");

  const q = query.toLowerCase();
  const filtered = q
    ? routes.filter(
        (r) =>
          r.routeNumber.toLowerCase().includes(q) ||
          r.direction.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q),
      )
    : routes;

  const selectedInOrder: RouteData[] = [];
  for (const id of selectedIds) {
    const route = filtered.find((r) => r.id === id);
    if (route) selectedInOrder.push(route);
  }
  const unselected = filtered.filter((r) => !selectedIds.has(r.id));

  return (
    <div className="route-list">
      <div className="route-list-header">
        <h2>STM Bus Routes</h2>
        {locationSearch}
        <div className="route-list-controls">
          <input
            type="search"
            placeholder="Search routes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="route-list-meta">
            <span>{selectedIds.size} selected</span>
            {selectedIds.size > 0 && (
              <button className="route-list-meta-button" onClick={onClearAll}>
                Clear all
              </button>
            )}
            {selectedIds.size > 0 && (
              <span className="show-stops-toggle">
                <input
                  type="checkbox"
                  id="show-stops"
                  checked={showStops}
                  onChange={onToggleShowStops}
                />
                <label htmlFor="show-stops">Show stops</label>
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="route-list-items">
        {filtered.length === 0 ? (
          <p className="no-results">No routes match "{query}"</p>
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
            {selectedInOrder.length > 0 && unselected.length > 0 && (
              <div className="route-list-divider">
                <span>All routes</span>
              </div>
            )}
            {unselected.map((route) => (
              <RouteItem
                key={route.id}
                route={route}
                selected={false}
                onToggle={onToggle}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
