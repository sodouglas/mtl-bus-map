# Pin Location Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users drop a center-pin on the map (instead of searching) to select a location and trigger nearby route filtering.

**Architecture:** A `MapCenterPin` component renders as a CSS overlay fixed at the map center inside `map-wrapper`. The user pans the map underneath it, then clicks Confirm. `MapView` captures the Leaflet map instance via `MapContainer`'s `ref` and reads `map.getCenter()` on confirm. `App` owns all pin mode state.

**Tech Stack:** React 18, TypeScript, react-leaflet v5, Leaflet, CSS (no new dependencies)

---

### Task 1: Create the worktree

**Files:** none (git operation)

- [ ] **Step 1: Create and enter the worktree**

  In Claude Code, run the `EnterWorktree` tool with name `feat/pin-location`.

- [ ] **Step 2: Verify working directory**

  ```bash
  pwd
  ```
  Expected: path contains `.claude/worktrees/feat/pin-location`

---

### Task 2: MapCenterPin component + CSS

**Files:**
- Create: `src/components/MapCenterPin.tsx`
- Modify: `src/App.css` (append pin styles)

- [ ] **Step 1: Create `src/components/MapCenterPin.tsx`**

  ```tsx
  interface Props {
    onConfirm: () => void;
    onCancel: () => void;
  }

  export function MapCenterPin({ onConfirm, onCancel }: Props) {
    return (
      <div className="map-center-pin-overlay">
        <div className="map-center-pin-icon">
          <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22s14-12.667 14-22C28 6.268 21.732 0 14 0z" fill="#3A86FF"/>
            <circle cx="14" cy="14" r="5" fill="white"/>
          </svg>
        </div>
        <div className="map-center-pin-controls">
          <button className="map-center-pin-confirm" onClick={onConfirm}>✓ Confirm</button>
          <span className="map-center-pin-sep">|</span>
          <button className="map-center-pin-cancel" onClick={onCancel}>×</button>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Append pin styles to `src/App.css`**

  ```css
  /* ── Map Center Pin ── */
  .map-center-pin-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    z-index: 1000;
    pointer-events: none;
  }

  .map-center-pin-icon {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
  }

  .map-center-pin-controls {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: auto;
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    white-space: nowrap;
    overflow: hidden;
  }

  .map-center-pin-confirm {
    border: none;
    background: none;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 600;
    color: #3a86ff;
    cursor: pointer;
  }

  .map-center-pin-confirm:hover {
    background: #f0f6ff;
  }

  .map-center-pin-sep {
    color: #ddd;
    font-size: 14px;
    user-select: none;
  }

  .map-center-pin-cancel {
    border: none;
    background: none;
    padding: 5px 10px;
    font-size: 14px;
    color: #888;
    cursor: pointer;
    line-height: 1;
  }

  .map-center-pin-cancel:hover {
    background: #f5f5f5;
    color: #333;
  }

  /* ── Pin Location Button (sidebar) ── */
  .pin-location-btn {
    flex-shrink: 0;
    border: 1px solid #ddd;
    background: #f5f5f5;
    color: #666;
    font-size: 13px;
    cursor: pointer;
    padding: 4px 7px;
    border-radius: 5px;
    line-height: 1;
  }

  .pin-location-btn:hover {
    background: #e8e8e8;
    color: #333;
  }

  .pin-location-btn--active {
    background: #f0f6ff;
    border-color: #3a86ff;
    color: #3a86ff;
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/MapCenterPin.tsx src/App.css
  git commit -m "feat: add MapCenterPin overlay component and styles"
  ```

---

### Task 3: Update MapView to capture map ref and render MapCenterPin

**Files:**
- Modify: `src/components/MapView.tsx`

- [ ] **Step 1: Replace `src/components/MapView.tsx` with the updated version**

  ```tsx
  import { useRef } from "react";
  import { MapContainer, TileLayer, Polyline, Tooltip, ZoomControl } from "react-leaflet";
  import L from "leaflet";
  import type { RouteData, SelectedLocation, NearestStop } from "../types";
  import { LocationMarker } from "./LocationMarker";
  import { NearestStopMarkers } from "./NearestStopMarkers";
  import { RouteArrows } from "./RouteArrows";
  import { RouteStopMarkers } from "./RouteStopMarkers";
  import { MapCenterPin } from "./MapCenterPin";

  interface Props {
    selectedRoutes: RouteData[];
    colorMap: Map<string, string>;
    selectedLocation?: SelectedLocation | null;
    locationRadius?: number;
    nearestStops?: NearestStop[];
    showStops?: boolean;
    pinModeActive?: boolean;
    onPinConfirm?: (lat: number, lng: number) => void;
    onPinCancel?: () => void;
  }

  const MONTREAL: [number, number] = [45.5017, -73.5673];

  export function MapView({
    selectedRoutes,
    colorMap,
    selectedLocation,
    locationRadius = 200,
    nearestStops = [],
    showStops,
    pinModeActive = false,
    onPinConfirm,
    onPinCancel,
  }: Props) {
    const mapRef = useRef<L.Map | null>(null);

    function handleConfirm() {
      if (mapRef.current && onPinConfirm) {
        const { lat, lng } = mapRef.current.getCenter();
        onPinConfirm(lat, lng);
      }
    }

    return (
      <>
        <MapContainer
          ref={mapRef as React.Ref<L.Map>}
          center={MONTREAL}
          zoom={12}
          className="map-container"
          zoomControl={false}
        >
          <ZoomControl position="topright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {selectedRoutes.map((route) => {
            const isMetro = route.routeType === "metro";
            return (
              <Polyline
                key={`${route.id}-outline`}
                positions={route.path}
                pathOptions={{ color: "#222", weight: isMetro ? 10 : 7, opacity: 0.6 }}
              />
            );
          })}
          {selectedRoutes.map((route) => {
            const lineColor = colorMap.get(route.id) ?? route.color;
            const isMetro = route.routeType === "metro";
            return (
              <Polyline
                key={route.id}
                positions={route.path}
                pathOptions={{ color: lineColor, weight: isMetro ? 7 : 5, opacity: 1 }}
              >
                <Tooltip sticky>
                  <strong>{route.routeNumber}</strong>
                  {route.direction ? ` – ${route.direction}` : ""}
                </Tooltip>
              </Polyline>
            );
          })}
          <RouteArrows selectedRoutes={selectedRoutes} colorMap={colorMap} />
          {showStops && <RouteStopMarkers selectedRoutes={selectedRoutes} colorMap={colorMap} />}
          {selectedLocation && <LocationMarker location={selectedLocation} radius={locationRadius} />}
          {nearestStops.length > 0 && <NearestStopMarkers stops={nearestStops} />}
        </MapContainer>
        {pinModeActive && (
          <MapCenterPin onConfirm={handleConfirm} onCancel={onPinCancel ?? (() => {})} />
        )}
      </>
    );
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  npm run build 2>&1 | head -30
  ```
  Expected: no errors (warnings about unused vars are OK, errors are not)

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/MapView.tsx
  git commit -m "feat: add map ref capture and MapCenterPin rendering to MapView"
  ```

---

### Task 4: Update App.tsx with pin state, handlers, and pin button

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `pinModeActive` state and handlers**

  Add after the `sidebarOpen` state line (line 29):

  ```tsx
  const [pinModeActive, setPinModeActive] = useState(false);
  ```

  Add after `handleClearLocation` function:

  ```tsx
  function handlePinActivate() {
    setPinModeActive(true);
  }

  function handlePinConfirm(lat: number, lng: number) {
    const location: SelectedLocation = { displayName: "Pinned location", lat, lng };
    setSelectedLocation(location);
    selectNearbyRoutes(location, radius);
    setPinModeActive(false);
  }

  function handlePinCancel() {
    setPinModeActive(false);
  }
  ```

- [ ] **Step 2: Add pin button to the location section row**

  In the `locationSearch` JSX (inside the `location-section-row` div), add the pin button between `<LocationSearch>` and the radius button:

  ```tsx
  locationSearch={
    <div className="location-section">
      <div className="location-section-row">
        <LocationSearch
          onSelect={handleLocationSelect}
          onClear={handleClearLocation}
          hasLocation={selectedLocation !== null}
          locationName={selectedLocation?.displayName ?? ""}
        />
        {!selectedLocation && (
          <button
            className={`pin-location-btn${pinModeActive ? " pin-location-btn--active" : ""}`}
            onClick={handlePinActivate}
            title="Pin a location"
            aria-label="Pin a location"
          >
            📍
          </button>
        )}
        <button
          className={`radius-expand-btn${radiusExpanded ? " radius-expand-btn--open" : ""}`}
          onClick={() => setRadiusExpanded((v) => !v)}
          title="Toggle search radius"
          aria-label="Toggle search radius"
        >
          ···
        </button>
      </div>
      {radiusExpanded && <RadiusControl radius={radius} onChange={handleRadiusChange} />}
    </div>
  }
  ```

- [ ] **Step 3: Wire pin props into MapView**

  Update the `<MapView>` call to pass pin props:

  ```tsx
  <MapView
    selectedRoutes={selectedRoutes}
    colorMap={colorMap}
    selectedLocation={selectedLocation}
    locationRadius={radius}
    nearestStops={nearestStops}
    showStops={showStops}
    pinModeActive={pinModeActive}
    onPinConfirm={handlePinConfirm}
    onPinCancel={handlePinCancel}
  />
  ```

- [ ] **Step 4: Verify TypeScript compiles**

  ```bash
  npm run build 2>&1 | head -30
  ```
  Expected: no errors

- [ ] **Step 5: Smoke test in browser**

  ```bash
  npm run dev
  ```

  Open http://localhost:5173 and verify:
  1. 📍 pin button appears next to the search input
  2. Clicking 📍 shows the blue center pin + `[ ✓ Confirm | × ]` floating below it
  3. Panning the map moves the map under the fixed pin
  4. Clicking `×` dismisses the pin with no location set
  5. Clicking 📍 again, panning, then `✓ Confirm` sets "Pinned location" pill in sidebar, draws the radius circle, and selects nearby routes
  6. Pin button is hidden while the location pill is shown
  7. Clearing the location (× on pill) hides the pill and restores the pin button

- [ ] **Step 6: Commit**

  ```bash
  git add src/App.tsx
  git commit -m "feat: add pin location mode to App — state, handlers, sidebar button"
  ```

---

### Task 5: Push branch and open PR

- [ ] **Step 1: Push the branch**

  ```bash
  git push -u origin feat/pin-location
  ```

- [ ] **Step 2: Open a draft PR**

  ```bash
  gh pr create --draft --title "feat: pin location on map" --body "$(cat <<'EOF'
  > [!NOTE]
  > 🤖 Generated with [Claude Code](https://claude.ai/code)

  ## Summary

  Adds a center-pin interaction as an alternative to text search for selecting a location.

  ## Changes

  * New `MapCenterPin` component: CSS overlay fixed at map center with Confirm/Cancel controls
  * `MapView` captures Leaflet map ref; renders `MapCenterPin` when pin mode is active
  * `App` gains `pinModeActive` state with activate/confirm/cancel handlers
  * Pin button (📍) added to sidebar location row; hidden when a location is already set

  ## How to test

  1. Open the app
  2. Click 📍 next to the search bar
  3. Pan the map to your target location
  4. Click ✓ Confirm — nearby routes are selected
  5. Click × to cancel without setting a location
  EOF
  )"
  ```
