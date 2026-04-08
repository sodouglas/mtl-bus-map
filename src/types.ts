export interface StopData {
  name: string;
  lat: number;
  lng: number;
}

export interface RouteData {
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

export interface NearestStop {
  routeNumber: string;
  stopName: string;
  lat: number;
  lng: number;
  color: string;
  endpoint: "origin" | "destination";
}

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  lat: number;
  lng: number;
}

export interface SelectedLocation {
  displayName: string;
  lat: number;
  lng: number;
}
