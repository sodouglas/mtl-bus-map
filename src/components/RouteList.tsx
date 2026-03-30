import { useState } from "react";
import type { RouteData } from "../types";
import { RouteItem } from "./RouteItem";

interface Props {
  routes: RouteData[];
  selectedIds: Set<string>;
  colorMap: Map<string, string>;
  onToggle: (id: string) => void;
  onClearAll: () => void;
}

export function RouteList({
  routes,
  selectedIds,
  colorMap,
  onToggle,
  onClearAll,
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
