import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { flyLatLngToVisualCenter } from "../mapVisualLayout";

interface Props {
  onLocate: () => void;
  sidebarOpen: boolean;
}

export function LocateButton({ onLocate, sidebarOpen }: Props) {
  const map = useMap();
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const control = new L.Control({ position: "topright" });
    control.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-control locate-control");
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      setContainer(div);
      return div;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);

  function showError() {
    setStatus("error");
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setShowToast(false);
      setStatus("idle");
    }, 3000);
  }

  const handleClick = useCallback(() => {
    if (status === "loading") return;

    if (!navigator.geolocation) {
      showError();
      return;
    }

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus("idle");
        const latlng: L.LatLngExpression = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        const desktop = window.matchMedia("(min-width: 768px)").matches;
        flyLatLngToVisualCenter(map, latlng, 15, {
          width: window.innerWidth,
          height: window.innerHeight,
          desktop,
          sidebarOpen,
        });
        if (window.innerWidth < 768) onLocate();
      },
      () => showError(),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [map, onLocate, sidebarOpen, status]);

  if (!container) return null;

  return (
    <>
      {createPortal(
        <button
          className={`locate-btn${status === "loading" ? " locate-btn--loading" : ""}${status === "error" ? " locate-btn--error" : ""}`}
          onClick={handleClick}
          title="Use current location"
          aria-label="Use current location"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15z" />
            <rect x="11" y="4" width="2" height="4" rx="1" />
            <rect x="11" y="16" width="2" height="4" rx="1" />
            <rect x="4" y="11" width="4" height="2" rx="1" />
            <rect x="16" y="11" width="4" height="2" rx="1" />
          </svg>
        </button>,
        container,
      )}
      {showToast &&
        createPortal(
          <div className="locate-toast">Location not found</div>,
          document.body,
        )}
    </>
  );
}
