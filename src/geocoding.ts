import type { GeocodingResult } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function searchLocation(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "5",
    viewbox: "-73.98,45.40,-73.47,45.70",
    bounded: "1",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal,
    headers: { "User-Agent": "MTLBusMap/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Nominatim HTTP ${response.status}`);
  }

  const data: Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
  }> = await response.json();

  return data.map((item) => ({
    placeId: String(item.place_id),
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}
