import JSZip from "jszip";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface CityGTFS {
  id: string;
  name: string;
  url: string;
  output: string;
}

const CITIES: CityGTFS[] = [
  {
    id: "stm",
    name: "Montreal STM",
    url: "https://www.stm.info/sites/default/files/gtfs/gtfs_stm.zip",
    output: join(__dirname, "../public/routes-data-stm.json"),
  },
  {
    id: "ttc",
    name: "Toronto TTC",
    url: "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/7795b45e-e65a-4465-81fc-c36b9dfff169/resource/cfb6b2b8-6191-41e3-bda1-b175c51148cb/download/TTC%20Routes%20and%20Schedules%20Data.zip",
    output: join(__dirname, "../public/routes-data-ttc.json"),
  },
];

interface StopData {
  name: string;
  lat: number;
  lng: number;
}

interface RouteData {
  id: string;
  routeNumber: string;
  direction: string;
  directionId: number;
  name: string;
  color: string;
  routeType: "bus" | "metro" | "streetcar";
  path: [number, number][];
  stops: StopData[];
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n").map((l) => l.trimEnd().replace(/\r$/, ""));
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"(.*)"$/, "$1"));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? "").trim().replace(/^"(.*)"$/, "$1");
    }
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) {
    const ex = point[0] - lineStart[0];
    const ey = point[1] - lineStart[1];
    return Math.sqrt(ex * ex + ey * ey);
  }
  return Math.abs(dx * (lineStart[1] - point[1]) - (lineStart[0] - point[0]) * dy) / mag;
}

function douglasPeucker(points: [number, number][], epsilon: number): [number, number][] {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let maxIndex = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

function roundCoord(n: number): number {
  return Math.round(n * 100000) / 100000;
}

function routeTypeFromGtfs(type: string): "bus" | "metro" | "streetcar" | null {
  switch (type) {
    case "0": return "streetcar";
    case "1": return "metro";
    case "3": return "bus";
    default: return null;
  }
}

async function findGtfsFile(zip: JSZip, name: string): Promise<string> {
  const direct = zip.file(name);
  if (direct) return direct.async("string");

  for (const [path, file] of Object.entries(zip.files)) {
    if (!file.dir && path.endsWith(`/${name}`)) {
      return file.async("string");
    }
  }
  throw new Error(`${name} not found in zip (checked root and subdirectories)`);
}

async function processCity(city: CityGTFS) {
  console.log(`\n=== Processing ${city.name} ===`);

  console.log("Downloading GTFS zip...");
  const response = await fetch(city.url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${city.name}`);
  const buffer = await response.arrayBuffer();

  console.log("Extracting zip...");
  const zip = await JSZip.loadAsync(buffer);

  console.log("Parsing routes.txt...");
  const routesRaw = parseCSV(await findGtfsFile(zip, "routes.txt"));
  const transitRoutes = routesRaw.filter(
    (r) => r.route_type === "0" || r.route_type === "1" || r.route_type === "3"
  );
  const routeMap = new Map(transitRoutes.map((r) => [r.route_id, r]));

  console.log(`Found ${transitRoutes.length} transit routes`);

  console.log("Parsing trips.txt...");
  const tripsRaw = parseCSV(await findGtfsFile(zip, "trips.txt"));
  const tripsByRouteDir = new Map<string, { shapeId: string; headsign: string }[]>();
  for (const trip of tripsRaw) {
    if (!routeMap.has(trip.route_id)) continue;
    const key = `${trip.route_id}|${trip.direction_id}`;
    if (!tripsByRouteDir.has(key)) tripsByRouteDir.set(key, []);
    tripsByRouteDir.get(key)!.push({
      shapeId: trip.shape_id,
      headsign: trip.trip_headsign ?? "",
    });
  }

  console.log("Parsing shapes.txt...");
  const shapesRaw = parseCSV(await findGtfsFile(zip, "shapes.txt"));
  const shapePointsSeq = new Map<string, { seq: number; lat: number; lng: number }[]>();
  for (const s of shapesRaw) {
    const id = s.shape_id;
    if (!shapePointsSeq.has(id)) shapePointsSeq.set(id, []);
    shapePointsSeq.get(id)!.push({
      seq: parseInt(s.shape_pt_sequence),
      lat: parseFloat(s.shape_pt_lat),
      lng: parseFloat(s.shape_pt_lon),
    });
  }
  const shapesSorted = new Map<string, [number, number][]>();
  for (const [id, pts] of shapePointsSeq) {
    pts.sort((a, b) => a.seq - b.seq);
    shapesSorted.set(id, pts.map((p) => [p.lat, p.lng]));
  }

  console.log("Parsing stops.txt...");
  const stopsRaw = parseCSV(await findGtfsFile(zip, "stops.txt"));
  const stopsMap = new Map<string, { name: string; lat: number; lng: number }>();
  for (const s of stopsRaw) {
    stopsMap.set(s.stop_id, {
      name: s.stop_name,
      lat: parseFloat(s.stop_lat),
      lng: parseFloat(s.stop_lon),
    });
  }
  console.log(`Found ${stopsMap.size} stops`);

  console.log("Parsing stop_times.txt...");
  const stopTimesRaw = parseCSV(await findGtfsFile(zip, "stop_times.txt"));
  const stopsByTrip = new Map<string, { seq: number; stopId: string }[]>();
  for (const st of stopTimesRaw) {
    const tripId = st.trip_id;
    if (!stopsByTrip.has(tripId)) stopsByTrip.set(tripId, []);
    stopsByTrip.get(tripId)!.push({
      seq: parseInt(st.stop_sequence),
      stopId: st.stop_id,
    });
  }
  for (const [, entries] of stopsByTrip) {
    entries.sort((a, b) => a.seq - b.seq);
  }

  console.log("Building route data...");
  const DEFAULT_COLORS = [
    "#009EE0", "#E31837", "#00A550", "#F7A600", "#6D2077",
    "#00B5E2", "#FF6720", "#005DA8", "#8DC63F", "#C8102E",
  ];

  const metroTerminals = new Map<string, Set<string>>();
  for (const [key, trips] of tripsByRouteDir) {
    const [routeId] = key.split("|");
    const route = routeMap.get(routeId);
    if (!route || route.route_type !== "1") continue;
    if (!metroTerminals.has(routeId)) metroTerminals.set(routeId, new Set());
    for (const t of trips) {
      if (t.headsign) metroTerminals.get(routeId)!.add(t.headsign);
    }
  }

  const results: RouteData[] = [];
  let colorIdx = 0;

  const processedSingleDirRoutes = new Set<string>();

  for (const [key, trips] of tripsByRouteDir) {
    const [routeId, directionIdStr] = key.split("|");
    const route = routeMap.get(routeId);
    if (!route) continue;
    const directionId = parseInt(directionIdStr);
    const rType = routeTypeFromGtfs(route.route_type);
    if (!rType) continue;
    const isSingleDir = rType === "metro";

    if (isSingleDir) {
      if (processedSingleDirRoutes.has(routeId)) continue;
      processedSingleDirRoutes.add(routeId);
    }

    const shapeCounts = new Map<string, number>();
    for (const t of trips) {
      shapeCounts.set(t.shapeId, (shapeCounts.get(t.shapeId) ?? 0) + 1);
    }
    let bestShapeId = "";
    let bestPoints = 0;
    for (const [shapeId] of shapeCounts) {
      const pts = shapesSorted.get(shapeId)?.length ?? 0;
      if (pts > bestPoints) {
        bestPoints = pts;
        bestShapeId = shapeId;
      }
    }
    if (!bestShapeId || bestPoints === 0) continue;

    const rawPath = shapesSorted.get(bestShapeId)!;
    const simplified = douglasPeucker(rawPath, 0.0001);
    const path = simplified.map(([lat, lng]) => [roundCoord(lat), roundCoord(lng)] as [number, number]);

    const headsign = trips.find((t) => t.shapeId === bestShapeId)?.headsign ?? directionIdStr;

    let stops: StopData[] = [];
    for (const trip of tripsRaw) {
      if (
        trip.route_id === routeId &&
        trip.direction_id === directionIdStr &&
        trip.shape_id === bestShapeId &&
        stopsByTrip.has(trip.trip_id)
      ) {
        const tripStops = stopsByTrip.get(trip.trip_id)!;
        stops = tripStops
          .map((ts) => {
            const stop = stopsMap.get(ts.stopId);
            if (!stop) return null;
            return { name: stop.name, lat: roundCoord(stop.lat), lng: roundCoord(stop.lng) };
          })
          .filter((s): s is StopData => s !== null);
        break;
      }
    }

    const routeNumber = route.route_short_name ?? routeId;
    const rawColor = route.route_color ? `#${route.route_color}` : null;
    const color = rawColor && rawColor !== "#" ? rawColor : DEFAULT_COLORS[colorIdx % DEFAULT_COLORS.length];
    if (!isSingleDir) colorIdx++;

    results.push({
      id: isSingleDir ? routeId : `${routeId}-${directionId}`,
      routeNumber,
      direction: isSingleDir
        ? stops.length >= 2
          ? [stops[0].name, stops[stops.length - 1].name]
              .map((n) => n.replace(/^Station\s+/i, "").replace(/\s+-Zone\s+\w+$/i, ""))
              .join(" / ")
          : [...(metroTerminals.get(routeId) ?? [])]
              .map((h) => h.replace(/^Station\s+/i, "").replace(/\s+-Zone\s+\w+$/i, ""))
              .join(" / ")
        : headsign,
      directionId: isSingleDir ? 0 : directionId,
      name: route.route_long_name ?? "",
      color,
      routeType: rType,
      path,
      stops,
    });
  }

  results.sort((a, b) => {
    const typeOrder = { metro: 0, streetcar: 1, bus: 2 };
    if (a.routeType !== b.routeType) return typeOrder[a.routeType] - typeOrder[b.routeType];
    const na = parseInt(a.routeNumber) || 0;
    const nb = parseInt(b.routeNumber) || 0;
    if (na !== nb) return na - nb;
    return a.directionId - b.directionId;
  });

  console.log(`Writing ${results.length} route directions to ${city.output}`);
  writeFileSync(city.output, JSON.stringify(results));
  console.log(`Done with ${city.name}.`);
}

async function main() {
  const cityArg = process.argv.find((a) => a.startsWith("--city="))?.split("=")[1];
  const citiesToProcess = cityArg
    ? CITIES.filter((c) => c.id === cityArg)
    : CITIES;

  if (citiesToProcess.length === 0) {
    console.error(`Unknown city: ${cityArg}. Available: ${CITIES.map((c) => c.id).join(", ")}`);
    process.exit(1);
  }

  for (const city of citiesToProcess) {
    await processCity(city);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
