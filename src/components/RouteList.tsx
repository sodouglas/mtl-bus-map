import type { ReactNode } from "react";
import { useState } from "react";
import type { RouteData } from "../types";
import type { RouteMode } from "../cityConfig";
import { RouteItem } from "./RouteItem";

const TAB_LABELS: Record<RouteMode, string> = {
  metro: "Metro",
  streetcar: "Streetcar",
  bus: "Bus",
};

interface Props {
  routes: RouteData[];
  selectedIds: Set<string>;
  highlightedRouteIds: Set<string>;
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
  availableModes: RouteMode[];
}

export function RouteList({
  routes,
  selectedIds,
  highlightedRouteIds,
  colorMap,
  onToggle,
  onHighlightRoute,
  onClearAll,
  locationSearch,
  showStops,
  onToggleShowStops,
  hasBothEndpoints = false,
  badgeBlink = null,
  availableModes,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeTabRaw, setActiveTab] = useState<RouteMode>(availableModes[0]);
  const activeTab = availableModes.includes(activeTabRaw) ? activeTabRaw : availableModes[0];
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

  const routesByType = new Map<RouteMode, RouteData[]>();
  for (const mode of availableModes) {
    routesByType.set(mode, routes.filter((r) => r.routeType === mode));
  }

  const selectedRoutes = routes.filter((r) => selectedIds.has(r.id));
  const selectedByType = new Map<RouteMode, RouteData[]>();
  for (const mode of availableModes) {
    selectedByType.set(mode, selectedRoutes.filter((r) => r.routeType === mode));
  }
  const typesWithSelected = availableModes.filter((m) => (selectedByType.get(m)?.length ?? 0) > 0);
  const hasMultipleSelectedTypes = typesWithSelected.length > 1;

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
            {availableModes.map((mode) => {
              const items = selectedByType.get(mode) ?? [];
              if (items.length === 0) return null;
              return (
                <div key={mode}>
                  {hasMultipleSelectedTypes && (
                    <div className="selected-summary-group-label">{TAB_LABELS[mode]}</div>
                  )}
                  {items.map((route) => (
                    <RouteItem
                      key={route.id}
                      route={route}
                      selected
                      colorOverride={mode === "metro" ? route.color : colorMap.get(route.id)}
                      onToggle={onToggle}
                      highlighted={highlightedRouteIds.has(route.id)}
                      onHighlightRoute={onHighlightRoute}
                    />
                  ))}
                </div>
              );
            })}
          </div>
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
            />
          ));
        })()}
      </div>
    </div>
  );
}
