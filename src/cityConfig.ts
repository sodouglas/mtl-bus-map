export interface CityConfig {
  id: string;
  name: string;
  agency: string;
  center: [number, number];
  defaultZoom: number;
  bbox: string;
  dataFile: string;
  routeTypes: RouteMode[];
}

export type RouteMode = "metro" | "streetcar" | "bus";

export const CITIES: Record<string, CityConfig> = {
  stm: {
    id: "stm",
    name: "Montreal",
    agency: "STM",
    center: [45.5017, -73.5673],
    defaultZoom: 12,
    bbox: "-73.98,45.40,-73.47,45.70",
    dataFile: "routes-data-stm.json",
    routeTypes: ["metro", "bus"],
  },
  ttc: {
    id: "ttc",
    name: "Toronto",
    agency: "TTC",
    center: [43.6532, -79.3832],
    defaultZoom: 12,
    bbox: "-79.64,43.58,-79.12,43.86",
    dataFile: "routes-data-ttc.json",
    routeTypes: ["metro", "streetcar", "bus"],
  },
};

export const CITY_LIST = Object.values(CITIES);
export const DEFAULT_CITY = CITIES.stm;
