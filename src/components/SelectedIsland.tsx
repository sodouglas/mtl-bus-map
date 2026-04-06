import { useEffect, useState } from "react";
import type { RouteData } from "../types";
import { RouteItem } from "./RouteItem";

interface Props {
  routes: RouteData[];
  selectedIds: Set<string>;
  highlightedRouteIds: Set<string>;
  colorMap: Map<string, string>;
  onToggle: (id: string) => void;
  onHighlightRoute: (id: string | null) => void;
  onClearAll: () => void;
  showStops: boolean;
  onToggleShowStops: () => void;
  hasBothEndpoints?: boolean;
  badgeBlink?: "found" | "empty" | null;
  /** When false (e.g. mobile), list is always expanded; chevron / count do not collapse. */
  allowHeaderCollapse?: boolean;
}

export function SelectedIsland({
  routes,
  selectedIds,
  highlightedRouteIds,
  colorMap,
  onToggle,
  onHighlightRoute,
  onClearAll,
  showStops,
  onToggleShowStops,
  hasBothEndpoints = false,
  badgeBlink = null,
  allowHeaderCollapse = true,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!allowHeaderCollapse) setExpanded(true);
  }, [allowHeaderCollapse]);

  const selectedRoutes = routes.filter((r) => selectedIds.has(r.id));
  const selectedMetro = selectedRoutes.filter((r) => r.routeType === "metro");
  const selectedBus = selectedRoutes.filter((r) => r.routeType === "bus");
  const hasBothTypes = selectedMetro.length > 0 && selectedBus.length > 0;

  if (selectedIds.size === 0) return null;

  const listVisible = allowHeaderCollapse ? expanded : true;
  const contentCollapsed = allowHeaderCollapse && !expanded;

  return (
    <div
      className={`selected-island-content${contentCollapsed ? " selected-island-content--collapsed" : ""}`}
    >
      <div className="selected-island-header">
        {allowHeaderCollapse ? (
          <button
            type="button"
            className={`selected-island-toggle${expanded ? " selected-island-toggle--open" : ""}`}
            onClick={() => setExpanded((v) => !v)}
            aria-label={
              expanded ? "Collapse selected routes" : "Expand selected routes"
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
        ) : null}
        <span
          className={`selected-island-count${
            allowHeaderCollapse ? "" : " selected-island-count--static"
          }${
            badgeBlink === "found"
              ? " badge-blink-found"
              : badgeBlink === "empty"
                ? " badge-blink-empty"
                : ""
          }`}
          onClick={
            allowHeaderCollapse ? () => setExpanded((v) => !v) : undefined
          }
        >
          {hasBothEndpoints
            ? `${selectedIds.size} connecting route${selectedIds.size !== 1 ? "s" : ""}`
            : `${selectedIds.size} route${selectedIds.size !== 1 ? "s" : ""} selected`}
        </span>
        <button className="route-list-meta-button" onClick={onClearAll}>
          Clear
        </button>
        <label className="show-stops-toggle" htmlFor="show-stops-island">
          <input
            type="checkbox"
            id="show-stops-island"
            checked={showStops}
            onChange={onToggleShowStops}
          />
          <span className="show-stops-indicator" />
          Show stops
        </label>
      </div>
      {listVisible && (
        <div className="selected-island-items">
          {hasBothTypes && (
            <div className="selected-island-group-label">Metro</div>
          )}
          {selectedMetro.map((route) => (
            <RouteItem
              key={route.id}
              route={route}
              selected
              colorOverride={route.color}
              onToggle={onToggle}
              highlighted={highlightedRouteIds.has(route.id)}
              onHighlightRoute={onHighlightRoute}
            />
          ))}
          {hasBothTypes && (
            <div className="selected-island-group-label">Bus</div>
          )}
          {selectedBus.map((route) => (
            <RouteItem
              key={route.id}
              route={route}
              selected
              colorOverride={colorMap.get(route.id)}
              onToggle={onToggle}
              highlighted={highlightedRouteIds.has(route.id)}
              onHighlightRoute={onHighlightRoute}
            />
          ))}
        </div>
      )}
    </div>
  );
}
