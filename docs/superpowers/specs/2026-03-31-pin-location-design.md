# Pin Location Feature Design

## Overview

Allow users to pin a location directly on the map as an alternative to the text search. The pin sits fixed at the center of the map viewport; the user pans the map underneath it to choose a spot, then confirms.

## Interaction Flow

1. User clicks the pin icon button in the sidebar (next to the search input)
2. The map enters **pin mode**: a blue filled pin SVG appears fixed at the center of the map (CSS overlay, not a Leaflet marker)
3. A floating `[ ✓ Confirm  × ]` control appears just below the pin
4. User pans the map until the pin is over their desired location
5. User clicks **Confirm** → `map.getCenter()` captures coordinates → pin mode exits → sidebar shows location pill with display name `"Pinned location"`
6. User clicks **×** → pin mode exits with no location change
7. From this point, behavior is identical to a searched location: radius circle drawn, nearby routes selected, nearest stops shown

## UI Details

### Sidebar pin button
- A pin icon (`📍` or SVG equivalent) sits to the right of the search input, inside `location-section-row`
- While pin mode is active, the button appears pressed/highlighted
- Hidden when a location is already set (search pill is shown instead)

### Map overlay (pin mode active)
- Pin SVG: blue filled (`#3A86FF`), `28×36px`, anchored so its point touches the exact map center
- Floating control: `[ ✓ Confirm  × ]` pill, positioned just below the pin tip, `position: absolute` centered on the map container
- The map container gets a CSS class `map-container--pin-mode` to show a `crosshair` cursor

### Display name
- Pinned locations use `"Pinned location"` as `displayName` — no reverse geocoding

## Architecture

### State changes — `App.tsx`
- Add `pinModeActive: boolean` state
- `handlePinActivate()` — sets `pinModeActive = true`
- `handlePinConfirm(lat, lng)` — sets `selectedLocation`, calls `selectNearbyRoutes`, sets `pinModeActive = false`
- `handlePinCancel()` — sets `pinModeActive = false`
- Pass `pinModeActive`, `onPinConfirm`, `onPinCancel` to `MapView`
- Add pin button to `location-section-row` in the `locationSearch` render prop

### New component — `MapCenterPin.tsx`
- Rendered by `MapView` as a sibling to `MapContainer`, absolutely positioned over the map via CSS
- Does not use `useMap()` — coordinate capture happens in `MapView` via the map ref
- On Confirm: calls `onPinConfirm()` (no args) — `MapView` reads `mapRef.current.getCenter()`
- On ×: calls `onPinCancel()`

### Changes — `MapView.tsx`
- Accept `pinModeActive`, `onPinConfirm(lat, lng)`, `onPinCancel` props
- Capture the Leaflet map instance via `MapContainer`'s `ref` prop into a local `mapRef`
- On `onPinConfirm` from `MapCenterPin`: read `mapRef.current.getCenter()`, pass lat/lng up to App
- Render `<MapCenterPin>` as a sibling overlay when `pinModeActive` is true
- Add `map-container--pin-mode` class to the wrapper when active (crosshair cursor)

### No changes needed
- `LocationSearch.tsx` — unchanged
- `types.ts` — `SelectedLocation` already fits; `displayName` carries `"Pinned location"`
- `LocationMarker.tsx` — unchanged; renders after confirm just as it does after search

## Out of Scope
- Reverse geocoding the pinned coordinates to a street address
- Draggable Leaflet pin marker (the center-pin + pan pattern is used instead)
- Remembering the last pinned location across sessions
