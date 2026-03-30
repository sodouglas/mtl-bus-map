const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS = 6_371_000; // meters

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(a));
}

export function distanceToSegment(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const cosLat = Math.cos(pLat * DEG_TO_RAD);
  const px = pLng * cosLat;
  const py = pLat;
  const ax = aLng * cosLat;
  const ay = aLat;
  const bx = bLng * cosLat;
  const by = bLat;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  let t = 0;
  if (lenSq > 0) {
    t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  }

  const projLat = aLat + t * (bLat - aLat);
  const projLng = aLng + t * (bLng - aLng);
  return haversineDistance(pLat, pLng, projLat, projLng);
}

export function distanceToPolyline(
  lat: number,
  lng: number,
  path: [number, number][],
): number {
  let min = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const d = distanceToSegment(
      lat,
      lng,
      path[i][0],
      path[i][1],
      path[i + 1][0],
      path[i + 1][1],
    );
    if (d === 0) return 0;
    if (d < min) min = d;
  }
  return min;
}
