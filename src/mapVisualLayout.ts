import L from "leaflet";

/** Mirrors App.css --panel-margin and --panel-width */
const PANEL_MARGIN = 12;
const PANEL_WIDTH = 340;

const MOBILE_MAX_SHEET_FRAC = 0.55;
const MOBILE_MINIMIZED_BOTTOM_PX = 52;
const DESKTOP_MINIMIZED_SIDEBAR_PX = 120;

export type MapLayoutOptions = {
  width: number;
  height: number;
  desktop: boolean;
  sidebarOpen: boolean;
};

/**
 * Best point (viewport / document coords) where the map should place a searched
 * location: center of the area not covered by the floating panel.
 */
export function getPreferredMapPointPx(
  options: MapLayoutOptions,
): { x: number; y: number } {
  const { width: W, height: H, desktop, sidebarOpen } = options;

  if (!desktop) {
    const bottomObstruction = sidebarOpen
      ? H * MOBILE_MAX_SHEET_FRAC
      : MOBILE_MINIMIZED_BOTTOM_PX;
    const visibleBottom = Math.max(H * 0.35, H - bottomObstruction);
    return { x: W / 2, y: visibleBottom / 2 };
  }

  const leftObstruction =
    PANEL_MARGIN + (sidebarOpen ? PANEL_WIDTH : DESKTOP_MINIMIZED_SIDEBAR_PX);
  return { x: (leftObstruction + W) / 2, y: H / 2 };
}

const FLY_DURATION_SEC = 0.85;

/**
 * Animate the map so `latlng` ends up under the preferred visible point for the
 * current layout (after accounting for the sidebar / bottom sheet).
 */
export function flyLatLngToVisualCenter(
  map: L.Map,
  latlng: L.LatLngExpression,
  zoom: number | undefined,
  layout: MapLayoutOptions,
): () => void {
  const targetZoom = zoom ?? map.getZoom();
  const desired = getPreferredMapPointPx(layout);

  const applyPan = () => {
    const ll = L.latLng(latlng);
    const pt = map.latLngToContainerPoint(ll);
    const offset = L.point(desired.x, desired.y).subtract(pt);
    if (Math.abs(offset.x) > 0.5 || Math.abs(offset.y) > 0.5) {
      map.panBy(offset, { animate: true, duration: 0.35 });
    }
  };

  map.flyTo(latlng, targetZoom, { duration: FLY_DURATION_SEC });
  const id = window.setTimeout(applyPan, FLY_DURATION_SEC * 1000 + 60);
  return () => clearTimeout(id);
}
