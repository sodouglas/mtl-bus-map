import { useEffect, useState } from "react";
import "./App.css";
import type { RouteData } from "./types";
import { RouteList } from "./components/RouteList";
import { MapView } from "./components/MapView";

const SELECTION_PALETTE = [
  "#E63946", "#2A9D8F", "#7B2FF7", "#FF006E",
  "#06D6A0", "#3A86FF", "#FB5607", "#8338EC",
  "#00BBF9", "#F72585", "#1D3557", "#FF4CC3",
];

export default function App() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}routes-data.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: RouteData[]) => {
        setRoutes(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

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

  function handleClearAll() {
    setSelectedIds(new Set());
  }

  if (loading) {
    return <div className="loading-overlay">Loading route data…</div>;
  }

  if (error) {
    return (
      <div className="error-overlay">
        Failed to load routes: {error}
        <br />
        <small>Run `npm run process-gtfs` first to generate the data file.</small>
      </div>
    );
  }

  const colorMap = new Map<string, string>();
  let paletteIndex = 0;
  for (const id of selectedIds) {
    colorMap.set(id, SELECTION_PALETTE[paletteIndex % SELECTION_PALETTE.length]);
    paletteIndex++;
  }

  const selectedRoutes = routes.filter((r) => selectedIds.has(r.id));

  return (
    <div className="app">
      <aside className="sidebar">
        <RouteList
          routes={routes}
          selectedIds={selectedIds}
          colorMap={colorMap}
          onToggle={handleToggle}
          onClearAll={handleClearAll}
        />
      </aside>
      <div className="map-wrapper">
        <MapView selectedRoutes={selectedRoutes} colorMap={colorMap} />
      </div>
    </div>
  );
}
