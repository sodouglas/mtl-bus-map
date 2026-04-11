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

export type RouteMode = "metro" | "streetcar" | "bus" | "train";

export const CITIES: Record<string, CityConfig> = {
  stm: {
    id: "stm",
    name: "Montreal",
    agency: "STM / RTL / STL / exo",
    center: [45.5017, -73.5673],
    defaultZoom: 11,
    bbox: "-74.1,45.30,-73.25,45.78",
    dataFile: "routes-data-montreal.json",
    routeTypes: ["metro", "bus", "train"],
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
