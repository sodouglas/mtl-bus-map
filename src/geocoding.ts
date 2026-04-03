import type { GeocodingResult } from "./types";

const PHOTON_URL = "https://photon.komoot.io/api/";

interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    osm_id: number;
    osm_type: string;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    postcode?: string;
    state?: string;
  };
}

function buildDisplayName(p: PhotonFeature["properties"]): string {
  const parts: string[] = [];
  if (p.name) parts.push(p.name);
  if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
  else if (p.street) parts.push(p.street);
  if (p.city) parts.push(p.city);
  return parts.join(", ");
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    lang: "en",
    limit: "1",
  });

  try {
    const response = await fetch(
      `https://photon.komoot.io/reverse?${params}`,
    );

    if (!response.ok) return "Pinned location";

    const data: { features: PhotonFeature[] } = await response.json();
    if (data.features.length === 0) return "Pinned location";

    return buildDisplayName(data.features[0].properties) || "Pinned location";
  } catch {
    return "Pinned location";
  }
}

export async function searchLocation(
  query: string,
  bbox: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "5",
    lang: "en",
    bbox,
  });

  const response = await fetch(`${PHOTON_URL}?${params}`, { signal });

  if (!response.ok) {
    throw new Error(`Photon HTTP ${response.status}`);
  }

  const data: { features: PhotonFeature[] } = await response.json();

  return data.features.map((feature) => ({
    placeId: `${feature.properties.osm_type}${feature.properties.osm_id}`,
    displayName: buildDisplayName(feature.properties),
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
  }));
}
