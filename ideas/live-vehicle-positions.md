# Live Vehicle Positions via STM GTFS-RT

## What This Adds

Real-time bus and metro vehicle positions on the map — animated dots showing where vehicles are right now, updated every 15–30 seconds.

## Data Source

STM provides GTFS-Realtime feeds (Protocol Buffers format) gated behind a developer portal:

- Register at `https://portail.developpeurs.stm.info/apihub/`
- Agree to Terms of Use → get API key
- Contact: `dev@stm.info`

Three available feeds:
1. **Vehicle Positions** — GPS lat/lon per vehicle, with trip/route association
2. **Trip Updates** — Arrival/departure delay predictions per stop
3. **Service Alerts** — Closures, disruptions, major delays

Phase 1 targets Vehicle Positions only.

## Architecture

The app deploys to GitHub Pages (static hosting) and has no backend. The API key cannot live in frontend code. A thin proxy is needed.

### Proxy: Cloudflare Worker (recommended)

- Free tier: 100k requests/day — more than enough for polling
- Deployed separately from the main app
- Holds the STM API key in a Worker Secret
- Returns the decoded GTFS-RT payload as JSON

```
Browser → Cloudflare Worker → STM GTFS-RT API
                ↓
         Cache (15s TTL)
```

The Worker caches responses so 100 concurrent users only generate one upstream request per polling interval.

### Alternative: Vercel Edge Function

Same concept, works if the project ever moves off GitHub Pages.

## Implementation Plan

### Step 1: Get API Access

1. Register at the STM developer portal
2. Note the Vehicle Positions endpoint URL and auth header format
3. Test with `curl` to confirm response format (protobuf binary)

### Step 2: Build the Cloudflare Worker

```
workers/
  gtfs-rt-proxy/
    src/
      index.ts       # Worker entrypoint
    wrangler.toml    # Config (no secrets here)
    package.json
```

Worker logic:
- Accept `GET /vehicle-positions`
- Forward to STM endpoint with API key from env secret
- Cache response for 15 seconds (KV or Cache API)
- Decode protobuf → return JSON array of `{ vehicleId, routeId, lat, lon, bearing, timestamp }`

Dependencies: `gtfs-realtime-bindings` for protobuf decoding, or decode server-side and return plain JSON (simpler for the client).

### Step 3: Add to the Frontend

New module: `src/livePositions.ts`

```ts
interface VehiclePosition {
  vehicleId: string
  routeId: string
  lat: number
  lon: number
  bearing?: number
  timestamp: number
}

// Polls the Worker every 20s, returns positions for currently-selected routes
function useLivePositions(selectedRouteIds: Set<string>): VehiclePosition[]
```

Polling via `setInterval` + `AbortController`, cleaned up on unmount. Only fetches when the tab is visible (`document.visibilityState`).

### Step 4: Render on the Map

In `MapView.tsx`, render a `CircleMarker` per vehicle using React-Leaflet. Style by route color (already computed). Show route number + vehicle ID in tooltip on hover.

Vehicles not on a currently-selected route are filtered client-side — no extra requests needed.

### Step 5: Polish

- Fade out markers older than 2 polling intervals (stale data)
- Smooth position interpolation between polls (optional)
- Toggle: "Show live vehicles" checkbox in sidebar

## File Changes Summary

| File | Change |
|------|--------|
| `workers/gtfs-rt-proxy/` | New — Cloudflare Worker |
| `src/livePositions.ts` | New — polling hook |
| `src/components/MapView.tsx` | Add vehicle markers layer |
| `src/components/RouteList.tsx` | Add live toggle UI |
| `src/types.ts` | Add `VehiclePosition` type |
| `src/App.tsx` | Wire up `useLivePositions` |

## Open Questions

1. **STM API rate limits** — portal documentation needed; shapes polling interval choice
2. **Metro positions** — STM may not expose metro vehicle positions via GTFS-RT (underground GPS is unreliable); confirm before building
3. **CORS on the Worker** — set `Access-Control-Allow-Origin: https://sodouglas.github.io` (not `*`)
4. **Worker domain** — needs a `workers.dev` subdomain or custom domain; update frontend env var per environment

## Non-Goals (for now)

- Trip updates / ETA predictions (more complex, per-stop data)
- Service alerts UI
- Historical playback
