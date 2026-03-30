import type { RouteData, IsochroneRing } from "./types";
import { haversineDistance, destinationPoint } from "./geometry";
import { convexHull } from "./convexHull";

const WALK_SPEED_MPS = 1.33; // meters per second (~80m/min)
const DEFAULT_TIME_BANDS = [5, 10, 15, 20, 25, 30];

interface ReachedPoint {
  lat: number;
  lng: number;
  minutes: number;
  routeId: string;
}

function generateCircle(
  lat: number,
  lng: number,
  radiusMeters: number,
  stepDegrees: number = 11.25,
): [number, number][] {
  const pts: [number, number][] = [];
  for (let angle = 0; angle < 360; angle += stepDegrees) {
    pts.push(destinationPoint(lat, lng, angle, radiusMeters));
  }
  return pts;
}

export function computeReachability(
  location: { lat: number; lng: number },
  routes: RouteData[],
  walkRadius: number = 800,
  timeBands: number[] = DEFAULT_TIME_BANDS,
): IsochroneRing[] {
  const maxMinutes = Math.max(...timeBands);
  const reached: ReachedPoint[] = [];

  for (const route of routes) {
    if (!route.stops || route.stops.length === 0) continue;

    for (let boardIdx = 0; boardIdx < route.stops.length; boardIdx++) {
      const boardStop = route.stops[boardIdx];
      const walkDist = haversineDistance(location.lat, location.lng, boardStop.lat, boardStop.lng);
      if (walkDist > walkRadius) continue;

      const walkMinutes = walkDist / WALK_SPEED_MPS / 60;

      for (let i = boardIdx; i < route.stops.length; i++) {
        const stop = route.stops[i];
        const transitSeconds = stop.travelTimeFromStart - boardStop.travelTimeFromStart;
        if (transitSeconds < 0) continue;

        const totalMinutes = walkMinutes + transitSeconds / 60;
        if (totalMinutes > maxMinutes) break;

        reached.push({ lat: stop.lat, lng: stop.lng, minutes: totalMinutes, routeId: route.id });
      }
    }
  }

  // Group reached points by routeId
  const byRoute = new Map<string, ReachedPoint[]>();
  for (const rp of reached) {
    let list = byRoute.get(rp.routeId);
    if (!list) {
      list = [];
      byRoute.set(rp.routeId, list);
    }
    list.push(rp);
  }

  const rings: IsochroneRing[] = [];

  for (const band of timeBands.sort((a, b) => a - b)) {
    const polygons: [number, number][][] = [];

    // Walking-only circle from origin
    const walkCircleRadius = Math.min(band * 60 * WALK_SPEED_MPS, walkRadius);
    const walkCircle = generateCircle(location.lat, location.lng, walkCircleRadius);
    if (walkCircle.length >= 3) {
      polygons.push(walkCircle);
    }

    // Per-route corridor hulls
    for (const [, points] of byRoute) {
      const routePoints: [number, number][] = [];

      for (const rp of points) {
        if (rp.minutes > band) continue;

        routePoints.push([rp.lat, rp.lng]);

        const remainingMinutes = band - rp.minutes;
        const bufferMeters = Math.min(remainingMinutes * 60 * WALK_SPEED_MPS, walkRadius);
        if (bufferMeters > 50) {
          for (let angle = 0; angle < 360; angle += 45) {
            routePoints.push(destinationPoint(rp.lat, rp.lng, angle, bufferMeters));
          }
        }
      }

      if (routePoints.length < 3) continue;

      const hull = convexHull(routePoints);
      if (hull.length >= 3) {
        polygons.push(hull);
      }
    }

    if (polygons.length > 0) {
      rings.push({ maxMinutes: band, polygons });
    }
  }

  return rings;
}
