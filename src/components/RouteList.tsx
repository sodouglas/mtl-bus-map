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

function ModeSection({
  label,
  mode,
  enabled,
  onToggleMode,
  defaultExpanded,
  children,
}: {
  label: string;
  mode: string;
  enabled: boolean;
  onToggleMode: (mode: string) => void;
  defaultExpanded: boolean;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mode-section">
      <div className="mode-section-header">
        <button
          className="mode-section-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span className={`mode-section-chevron${expanded ? " mode-section-chevron--open" : ""}`}>
            &#9654;
          </span>
          <span className="mode-section-label">{label}</span>
        </button>
        <input
          type="checkbox"
          checked={enabled}
          onChange={() => onToggleMode(mode)}
          title={`Toggle ${label.toLowerCase()}`}
        />
      </div>
      {expanded && <div className="mode-section-content">{children}</div>}
    </div>
  );
}

export function RouteList({
  routes,
  selectedIds,
  colorMap,
  onToggle,
  onClearAll,
  enabledModes,
  onToggleMode,
  locationSearch,
  showStops,
  onToggleShowStops,
  hasBothEndpoints = false,
}: Props) {
  const [query, setQuery] = useState("");

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
        <h2>STM Routes</h2>
        {locationSearch}
        <div className="route-list-meta">
          <span>
            {hasBothEndpoints
              ? `${selectedIds.size} connecting route${selectedIds.size !== 1 ? "s" : ""}`
              : `${selectedIds.size} selected`}
          </span>
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
        {hasBothEndpoints && selectedIds.size === 0 && (
          <p className="no-connecting-routes">No direct routes found between these locations.</p>
        )}
      </div>
      <div className="route-list-items">
        <ModeSection
          label="Metro"
          mode="metro"
          enabled={enabledModes.has("metro")}
          onToggleMode={onToggleMode}
          defaultExpanded
        >
          {metroRoutes.map((route) => (
            <RouteItem
              key={route.id}
              route={route}
              selected={selectedIds.has(route.id)}
              colorOverride={selectedIds.has(route.id) ? colorMap.get(route.id) : undefined}
              onToggle={onToggle}
            />
          ))}
        </ModeSection>

        <ModeSection
          label="Bus"
          mode="bus"
          enabled={enabledModes.has("bus")}
          onToggleMode={onToggleMode}
          defaultExpanded
        >
          <div className="mode-section-search">
            <input
              type="search"
              placeholder="Search bus routes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {filteredBus.length === 0 ? (
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
              {selectedInOrder.length > 0 && unselectedBus.length > 0 && (
                <div className="route-list-divider">
                  <span>All routes</span>
                </div>
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
        </ModeSection>
      </div>
    </div>
  );
}
