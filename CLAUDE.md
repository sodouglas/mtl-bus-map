# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Montreal transit map — a React + TypeScript + Vite app that visualizes STM bus and metro routes on a Leaflet map. Deployed to GitHub Pages. No backend; all geospatial calculations are client-side.

## Commands

```bash
npm run dev              # Dev server at http://localhost:5173
npm run build            # TypeScript check + Vite build → dist/
npm run lint             # ESLint (flat config)
npm run preview          # Preview production build
npm run process-gtfs     # Download STM GTFS zip, process → public/routes-data.json
```

No test suite exists yet.

## Features

**Location search & dual endpoints:**
- Autocomplete location search via Photon Komoot API (300ms debounce, bounded to Montreal bbox)
- Origin + destination mode — expand from single location to dual endpoints
- Map pin mode — click-to-place on desktop, center-pin with confirm/cancel on mobile
- Location pills with clear buttons for each endpoint

**Route discovery:**
- Adjustable search radius per endpoint (100m–1000m, 50m steps) with slider and numeric input
- Routes within radius auto-selected; connecting routes shown when both endpoints set
- Metro/Bus tab switcher with independent mode toggles
- Bus route search filter (by number, direction, or name)
- "Clear all" button and route count display

**Map display:**
- Leaflet map with OpenStreetMap tiles, centered on Montreal (45.5017, -73.5673)
- Two-layer polylines (outline + fill) with unique colors from a 12-color palette
- Direction arrows sampled every 500m along route paths
- Route tooltips on hover (number + direction)
- Click a route to highlight it by dimming all others; click empty map to clear
- Stop markers with tooltips; nearest "board here" / "exit here" labels in dual-endpoint mode
- Origin (blue) and destination (red) markers with semi-transparent radius circles

**Sidebar & layout:**
- Floating panel with Figma UI3 aesthetic (backdrop blur, rounded corners, layered shadows)
- Collapsible sidebar — minimizes to a badge showing selected route count
- Responsive: fixed left panel on desktop (≥768px), bottom floating sheet on mobile (<768px, max 55vh)
- Animated transit strip in header (ASCII bus/metro icons)
- Selected routes listed first with visual divider, scrollable with thin custom scrollbar

**Dark mode:** Automatic via `prefers-color-scheme`, full dark palette with adjusted icons and toggle styling.

## Architecture

**Data pipeline:** `scripts/process-gtfs.ts` downloads GTFS data from STM, parses CSV files, simplifies polylines (Douglas-Peucker), and writes `public/routes-data.json` (~1.4MB). This file is gitignored and regenerated during CI deploy.

**App state:** All state lives in `App.tsx` — routes, selected route IDs, dual locations, search radii, mode toggles (bus/metro), highlight state. Props are drilled to child components; no state management library.

**Data flow:**
1. App loads `routes-data.json` on mount
2. User searches location via Photon API (geocoding.ts, 300ms debounce)
3. `geometry.ts` filters routes within radius using haversine + point-to-polyline distance
4. When both endpoints set, intersects route sets to find connecting routes
5. Selected routes render on Leaflet map with unique colors from a 12-color palette

**Key modules:**
- `geometry.ts` — haversine distance, point-to-segment/polyline distance, bearing, arrow sampling
- `geocoding.ts` — Photon Komoot API, bounded to Montreal bbox
- `types.ts` — RouteData, StopData, NearestStop, GeocodingResult, SelectedLocation
- `components/MapView.tsx` — Leaflet map with polylines, markers, stops, direction arrows
- `components/RouteList.tsx` — sidebar with Metro/Bus tabs, search filter, route selection
- `components/LocationSearch.tsx` — autocomplete with AbortController, dual-endpoint UI

**Styling:** CSS custom properties in `index.css`, light/dark mode via `prefers-color-scheme`. Figtree font with system-ui fallbacks. BEM-like class names in `App.css`. Responsive breakpoint at 767px.

## CI/CD

Two GitHub Actions workflows:
- `deploy.yml` — on push to main: runs `process-gtfs`, builds, deploys to GitHub Pages
- `refresh-gtfs.yml` — manual trigger: regenerates GTFS data and auto-commits if changed

Vite base path is `/mtl-bus-map/` for GitHub Pages.
