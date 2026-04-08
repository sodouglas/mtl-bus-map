import JSZip from "jszip";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, ".gtfs-cache");
const ETAG_FILE = join(CACHE_DIR, "etags.json");

interface AgencySource {
  agencyId: string;
  agencyName: string;
  url: string;
}

interface CityGTFS {
  id: string;
  name: string;
  sources: AgencySource[];
  output: string;
}

const CITIES: CityGTFS[] = [
  {
    id: "stm",
    name: "Montreal (Greater)",
    sources: [
      {
        agencyId: "stm",
        agencyName: "STM",
        url: "https://www.stm.info/sites/default/files/gtfs/gtfs_stm.zip",
      },
      {
        agencyId: "rtl",
        agencyName: "RTL",
        url: "https://www.rtl-longueuil.qc.ca/transit/latestfeed/RTL.zip",
      },
      {
        agencyId: "stl",
        agencyName: "STL",
        url: "https://www.stlaval.ca/datas/opendata/GTF_STL.zip",
      },
      {
        agencyId: "exo-trains",
        agencyName: "exo",
        url: "https://exo.quebec/xdata/trains/google_transit.zip",
      },
      {
        agencyId: "exo-citcrc",
        agencyName: "exo",
        url: "https://exo.quebec/xdata/citcrc/google_transit.zip",
      },
      {
        agencyId: "exo-citla",
        agencyName: "exo",
        url: "https://exo.quebec/xdata/citla/google_transit.zip",
      },
      {
        agencyId: "exo-citpi",
        agencyName: "exo",
        url: "https://exo.quebec/xdata/citpi/google_transit.zip",
      },
      {
        agencyId: "exo-citsv",
        agencyName: "exo",
        url: "https://exo.quebec/xdata/citsv/google_transit.zip",
      },
      {
        agencyId: "exo-citso",
        agencyName: "exo",
        url: "https://exo.quebec/xdata/citso/google_transit.zip",
      },
      {
        agencyId: "exo-citvr",
        agencyName: "exo",
        url: "https://exo.quebec/xdata/citvr/google_transit.zip",
      },
      {
        agencyId: "exo-mrclasso",
        agencyName: "exo",
        url: "https://exo.quebec/xdata/mrclasso/google_transit.zip",
      },
      {
        agencyId: "exo-mrclm",
        agencyName: "exo",
        url: "https://exo.quebec/xdata/mrclm/google_transit.zip",
      },
      {
        agencyId: "exo-omitsju",
        agencyName: "exo",
        url: "https://exo.quebec/xdata/omitsju/google_transit.zip",
      },
    ],
    output: join(__dirname, "../public/routes-data-montreal.json"),
  },
  {
    id: "ttc",
    name: "Toronto TTC",
    sources: [
      {
        agencyId: "ttc",
        agencyName: "TTC",
        url: "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/7795b45e-e65a-4465-81fc-c36b9dfff169/resource/cfb6b2b8-6191-41e3-bda1-b175c51148cb/download/TTC%20Routes%20and%20Schedules%20Data.zip",
      },
    ],
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
  routeType: "bus" | "metro" | "streetcar" | "train";
  agency: string;
  path: [number, number][];
  stops: StopData[];
}

interface ETagStore {
  [url: string]: { etag?: string; lastModified?: string };
}

// ── Cache helpers ──────────────────────────────────────────────────────────────

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

function loadETagStore(): ETagStore {
  try {
    if (existsSync(ETAG_FILE)) {
      return JSON.parse(readFileSync(ETAG_FILE, "utf-8")) as ETagStore;
    }
  } catch {
    // ignore corrupt cache
  }
  return {};
}

function saveETagStore(store: ETagStore) {
  ensureCacheDir();
  writeFileSync(ETAG_FILE, JSON.stringify(store, null, 2));
}

function agencyCacheFile(agencyId: string) {
  return join(CACHE_DIR, `${agencyId}.json`);
}

function loadAgencyCache(agencyId: string): RouteData[] | null {
  const file = agencyCacheFile(agencyId);
  try {
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, "utf-8")) as RouteData[];
    }
  } catch {
    // ignore corrupt cache
  }
  return null;
}

function saveAgencyCache(agencyId: string, routes: RouteData[]) {
  ensureCacheDir();
  writeFileSync(agencyCacheFile(agencyId), JSON.stringify(routes));
}

// ── Network helpers ────────────────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  opts: RequestInit = {},
  retries = 3,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, opts);
      if (res.ok || res.status === 304 || res.status === 404) return res;
      // Retry on 5xx
      if (res.status >= 500 && attempt < retries) {
        console.warn(`  HTTP ${res.status} on attempt ${attempt}/${retries}, retrying...`);
        await sleep(2 ** attempt * 1000);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        console.warn(`  Network error on attempt ${attempt}/${retries}: ${err}, retrying...`);
        await sleep(2 ** attempt * 1000);
      }
    }
  }
  throw lastErr ?? new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

// Returns ArrayBuffer on new data, or null if the source is unchanged (304)
async function downloadGtfs(
  source: AgencySource,
  etagStore: ETagStore,
): Promise<ArrayBuffer | null> {
  const cached = etagStore[source.url];
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["If-None-Match"] = cached.etag;
  if (cached?.lastModified) headers["If-Modified-Since"] = cached.lastModified;

  console.log(`  Downloading ${source.agencyName} (${source.agencyId})...`);
  const res = await fetchWithRetry(source.url, { headers });

  if (res.status === 304) {
    console.log(`  ${source.agencyId}: unchanged (304), using cached data`);
    return null;
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${source.agencyId} (${source.url})`);
  }

  // Update ETag store
  const newEtag = res.headers.get("ETag");
  const newLastMod = res.headers.get("Last-Modified");
  etagStore[source.url] = {
    ...(newEtag ? { etag: newEtag } : {}),
    ...(newLastMod ? { lastModified: newLastMod } : {}),
  };

  return res.arrayBuffer();
}

// ── CSV parser ─────────────────────────────────────────────────────────────────

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n").map((l) => l.trimEnd().replace(/\r$/, ""));
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"(.*)"$/, "$1"));
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

// ── Geometry ───────────────────────────────────────────────────────────────────

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number],
): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) {
    const ex = point[0] - lineStart[0];
    const ey = point[1] - lineStart[1];
    return Math.sqrt(ex * ex + ey * ey);
  }
  return (
    Math.abs(dx * (lineStart[1] - point[1]) - (lineStart[0] - point[0]) * dy) /
    mag
  );
}

function douglasPeucker(
  points: [number, number][],
  epsilon: number,
): [number, number][] {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let maxIndex = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1],
    );
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

// ── Route type mapping ─────────────────────────────────────────────────────────

function routeTypeFromGtfs(type: string): "bus" | "metro" | "streetcar" | "train" | null {
  const n = parseInt(type);
  if (n === 0) return "streetcar";
  if (n === 1) return "metro";
  if (n === 2) return "train";
  if (n === 3) return "bus";
  // Extended GTFS types (HVT spec)
  if (n >= 700 && n < 800) return "bus";    // Bus services
  if (n >= 900 && n < 1000) return "streetcar"; // Tram/light rail
  if (n >= 100 && n < 200) return "train";  // Regional/commuter rail
  if (n === 400 || n === 401 || n === 402) return "metro"; // Metro/subway
  return null;
}

function cleanMetroTerminal(name: string, agencyId: string): string {
  if (agencyId === "ttc") {
    return name.replace(/\s+Station(?:\s*-\s*.+)?$/i, "");
  }
  return name.replace(/^Station\s+/i, "").replace(/\s+-Zone\s+\w+$/i, "");
}

function cleanTtcHeadsign(headsign: string, routeLongName: string): string {
  if (routeLongName && headsign.startsWith(routeLongName + " ")) {
    return headsign.slice(routeLongName.length).trim();
  }
  const towardsMatch = headsign.match(/\s+(towards\s+.+)$/i);
  if (towardsMatch) {
    const towardsPart = towardsMatch[1];
    const prefix = headsign.slice(0, towardsMatch.index!);
    const dirMatch = prefix.match(/^(North|South|East|West)\s*-\s*/i);
    if (dirMatch) return `${dirMatch[1]} ${towardsPart}`;
    return towardsPart;
  }
  return headsign;
}

// ── GTFS zip file lookup ───────────────────────────────────────────────────────

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

// ── Core processing ────────────────────────────────────────────────────────────

async function processAgency(
  source: AgencySource,
  buffer: ArrayBuffer,
): Promise<RouteData[]> {
  const { agencyId, agencyName } = source;

  console.log(`  Extracting ${agencyId}...`);
  const zip = await JSZip.loadAsync(buffer);

  console.log(`  Parsing routes.txt [${agencyId}]...`);
  const routesRaw = parseCSV(await findGtfsFile(zip, "routes.txt"));
  const transitRoutes = routesRaw.filter(
    (r) => routeTypeFromGtfs(r.route_type) !== null,
  );
  const routeMap = new Map(transitRoutes.map((r) => [r.route_id, r]));
  console.log(`    ${agencyId}: ${transitRoutes.length} transit routes`);

  console.log(`  Parsing trips.txt [${agencyId}]...`);
  const tripsRaw = parseCSV(await findGtfsFile(zip, "trips.txt"));
  const tripsByRouteDir = new Map<
    string,
    { shapeId: string; headsign: string }[]
  >();
  for (const trip of tripsRaw) {
    if (!routeMap.has(trip.route_id)) continue;
    const key = `${trip.route_id}|${trip.direction_id}`;
    if (!tripsByRouteDir.has(key)) tripsByRouteDir.set(key, []);
    tripsByRouteDir.get(key)!.push({
      shapeId: trip.shape_id,
      headsign: trip.trip_headsign ?? "",
    });
  }

  console.log(`  Parsing shapes.txt [${agencyId}]...`);
  const shapesRaw = parseCSV(await findGtfsFile(zip, "shapes.txt"));
  const shapePointsSeq = new Map<
    string,
    { seq: number; lat: number; lng: number }[]
  >();
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
    shapesSorted.set(
      id,
      pts.map((p) => [p.lat, p.lng]),
    );
  }

  console.log(`  Parsing stops.txt [${agencyId}]...`);
  const stopsRaw = parseCSV(await findGtfsFile(zip, "stops.txt"));
  const stopsMap = new Map<
    string,
    { name: string; lat: number; lng: number }
  >();
  for (const s of stopsRaw) {
    stopsMap.set(s.stop_id, {
      name: s.stop_name,
      lat: parseFloat(s.stop_lat),
      lng: parseFloat(s.stop_lon),
    });
  }

  console.log(`  Parsing stop_times.txt [${agencyId}]...`);
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

  console.log(`  Building routes [${agencyId}]...`);
  const DEFAULT_COLORS = [
    "#009EE0", "#E31837", "#00A550", "#F7A600",
    "#6D2077", "#00B5E2", "#FF6720", "#005DA8",
    "#8DC63F", "#C8102E",
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

    // Collapse metro and train to a single bidirectional entry
    const isSingleDir = rType === "metro" || rType === "train";

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
    const path = simplified.map(
      ([lat, lng]) => [roundCoord(lat), roundCoord(lng)] as [number, number],
    );

    const headsign =
      trips.find((t) => t.shapeId === bestShapeId)?.headsign ?? directionIdStr;

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
            return {
              name: stop.name,
              lat: roundCoord(stop.lat),
              lng: roundCoord(stop.lng),
            };
          })
          .filter((s): s is StopData => s !== null);
        break;
      }
    }

    const routeNumber = route.route_short_name ?? routeId;
    const rawColor = route.route_color ? `#${route.route_color}` : null;
    const color =
      rawColor && rawColor !== "#"
        ? rawColor
        : DEFAULT_COLORS[colorIdx % DEFAULT_COLORS.length];
    if (!isSingleDir) colorIdx++;

    let direction: string;
    if (isSingleDir) {
      direction =
        stops.length >= 2
          ? [stops[0].name, stops[stops.length - 1].name]
              .map((n) => cleanMetroTerminal(n, agencyId))
              .join(" / ")
          : [...(metroTerminals.get(routeId) ?? [])]
              .map((h) => cleanMetroTerminal(h, agencyId))
              .join(" / ");
    } else if (agencyId === "ttc") {
      direction = cleanTtcHeadsign(headsign, route.route_long_name ?? "");
    } else {
      direction = headsign;
    }

    results.push({
      id: isSingleDir
        ? `${agencyId}:${routeId}`
        : `${agencyId}:${routeId}-${directionId}`,
      routeNumber,
      direction,
      directionId: isSingleDir ? 0 : directionId,
      name: route.route_long_name ?? "",
      color,
      routeType: rType,
      agency: agencyName,
      path,
      stops,
    });
  }

  return results;
}

// ── City group processing ──────────────────────────────────────────────────────

async function processGroup(city: CityGTFS, etagStore: ETagStore) {
  console.log(`\n=== Processing ${city.name} ===`);

  // Download all sources in parallel
  const downloadResults = await Promise.allSettled(
    city.sources.map((source) => downloadGtfs(source, etagStore)),
  );

  // Process each download result
  const processResults = await Promise.allSettled(
    downloadResults.map(async (dlResult, i) => {
      const source = city.sources[i];
      if (dlResult.status === "rejected") {
        throw dlResult.reason;
      }

      const buffer = dlResult.value;

      if (buffer === null) {
        // 304 Not Modified — reuse cached processed data
        const cached = loadAgencyCache(source.agencyId);
        if (cached) {
          console.log(`  ${source.agencyId}: reusing ${cached.length} cached routes`);
          return cached;
        }
        // No cache on disk, need a fresh download
        console.log(`  ${source.agencyId}: no local cache, forcing fresh download...`);
        const freshBuffer = await fetchWithRetry(source.url);
        if (!freshBuffer.ok) {
          throw new Error(`HTTP ${freshBuffer.status} for ${source.agencyId}`);
        }
        const freshArrayBuffer = await freshBuffer.arrayBuffer();
        return processAgency(source, freshArrayBuffer);
      }

      return processAgency(source, buffer);
    }),
  );

  const allRoutes: RouteData[] = [];
  for (const [i, result] of processResults.entries()) {
    const source = city.sources[i];
    if (result.status === "fulfilled") {
      saveAgencyCache(source.agencyId, result.value);
      allRoutes.push(...result.value);
      console.log(`  ✓ ${source.agencyId}: ${result.value.length} routes`);
    } else {
      console.warn(`  ✗ ${source.agencyId} failed: ${result.reason} — skipping`);
    }
  }

  allRoutes.sort((a, b) => {
    const typeOrder: Record<string, number> = { metro: 0, train: 1, streetcar: 2, bus: 3 };
    if (a.routeType !== b.routeType)
      return (typeOrder[a.routeType] ?? 9) - (typeOrder[b.routeType] ?? 9);
    const na = parseInt(a.routeNumber) || 0;
    const nb = parseInt(b.routeNumber) || 0;
    if (na !== nb) return na - nb;
    if (a.agency !== b.agency) return a.agency.localeCompare(b.agency);
    return a.directionId - b.directionId;
  });

  console.log(`Writing ${allRoutes.length} route directions to ${city.output}`);
  writeFileSync(city.output, JSON.stringify(allRoutes));
  console.log(`Done with ${city.name}.`);
}

// ── Entry point ────────────────────────────────────────────────────────────────

async function main() {
  const cityArg = process.argv
    .find((a) => a.startsWith("--city="))
    ?.split("=")[1];
  const citiesToProcess = cityArg
    ? CITIES.filter((c) => c.id === cityArg)
    : CITIES;

  if (citiesToProcess.length === 0) {
    console.error(
      `Unknown city: ${cityArg}. Available: ${CITIES.map((c) => c.id).join(", ")}`,
    );
    process.exit(1);
  }

  const etagStore = loadETagStore();

  for (const city of citiesToProcess) {
    await processGroup(city, etagStore);
  }

  saveETagStore(etagStore);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
