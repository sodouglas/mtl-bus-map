import L from "leaflet";

export type MapLayoutOptions = {
  width: number;
  height: number;
  desktop: boolean;
  sidebarOpen: boolean;
};

/**
 * Viewport point where a selected location should appear:
 *   Desktop (any)     → center of the right 2/3 of the screen
 *   Mobile + open     → center of the top half (above the sheet)
 *   Mobile + collapsed → no pan (location is already centered)
 *
 * Returns null when no pan is needed.
 */
export function getPreferredMapPointPx(
  options: MapLayoutOptions,
): { x: number; y: number } | null {
  const { width: W, height: H, desktop, sidebarOpen } = options;

  if (!desktop) {
    if (!sidebarOpen) return null;
    return { x: W / 2, y: H / 4 };
  }
  return { x: W * (2 / 3), y: H / 2 };
}

/**
 * Pan the map so `latlng` lands at the preferred viewport point.
 * Skips panning on mobile when the sidebar is collapsed (location is already
 * visible in the center). If a zoom change is needed it is applied instantly
 * first, then the smooth pan follows.
 */
export function flyLatLngToVisualCenter(
  map: L.Map,
  latlng: L.LatLngExpression,
  zoom: number | undefined,
  layout: MapLayoutOptions,
): void {
  const desired = getPreferredMapPointPx(layout);
  if (!desired) return;

  const targetZoom = zoom ?? map.getZoom();

  if (targetZoom !== map.getZoom()) {
    map.setZoom(targetZoom, { animate: false });
  }

  const viewCenter = L.point(layout.width / 2, layout.height / 2);
  const offsetPx = viewCenter.subtract(L.point(desired.x, desired.y));

  const crs = map.options.crs!;
  const targetPx = crs.latLngToPoint(L.latLng(latlng), targetZoom);
  const adjustedCenter = crs.pointToLatLng(targetPx.add(offsetPx), targetZoom);

  map.panTo(adjustedCenter, { animate: true, duration: 0.5, easeLinearity: 0.5 });
}
