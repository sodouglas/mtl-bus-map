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

## Architecture

**Data pipeline:** `scripts/process-gtfs.ts` downloads GTFS data from STM, parses CSV files, simplifies polylines (Douglas-Peucker), and writes `public/routes-data.json` (~1.4MB). This file is gitignored and regenerated during CI deploy.

**App state:** All state lives in `App.tsx` — routes, selected route IDs, user location, search radius, mode toggles (bus/metro). Props are drilled to child components; no state management library.

**Data flow:**
1. App loads `routes-data.json` on mount
2. User searches location via Photon API (geocoding.ts, 300ms debounce)
3. `geometry.ts` filters routes within radius using haversine + point-to-polyline distance
4. Selected routes render on Leaflet map with unique colors from a 12-color palette

**Key modules:**
- `geometry.ts` — haversine distance, point-to-segment/polyline distance, bearing, arrow sampling
- `geocoding.ts` — Photon Komoot API, bounded to Montreal bbox
- `types.ts` — RouteData, StopData, NearestStop, GeocodingResult, SelectedLocation
- `components/MapView.tsx` — Leaflet map centered on Montreal (45.5017, -73.5673)
- `components/RouteList.tsx` — sidebar with Metro/Bus sections, search filter
- `components/LocationSearch.tsx` — autocomplete with AbortController

**Styling:** CSS custom properties in `index.css`, light/dark mode via `prefers-color-scheme`. BEM-like class names in `App.css`.

## CI/CD

Two GitHub Actions workflows:
- `deploy.yml` — on push to main: runs `process-gtfs`, builds, deploys to GitHub Pages
- `refresh-gtfs.yml` — manual trigger: regenerates GTFS data and auto-commits if changed

Vite base path is `/mtl-bus-map/` for GitHub Pages.
