import { useRef, useState } from "react";
import type { SelectedLocation } from "../types";
import { LocationSearch } from "./LocationSearch";
import { RadiusControl } from "./RadiusControl";
import { RouteIndicator } from "./RouteIndicator";

interface Props {
  origin: SelectedLocation | null;
  destination: SelectedLocation | null;
  originRadius: number;
  destinationRadius: number;
  onOriginSelect: (location: SelectedLocation) => void;
  onOriginClear: () => void;
  onDestinationSelect: (location: SelectedLocation) => void;
  onDestinationClear: () => void;
  onOriginRadiusChange: (radius: number) => void;
  onDestinationRadiusChange: (radius: number) => void;
  pinModeActive?: boolean;
  pinTarget?: "origin" | "destination";
  onPinClick?: (target: "origin" | "destination" | null) => void;
}

export function LocationSearchPair({
  origin,
  destination,
  originRadius,
  destinationRadius,
  onOriginSelect,
  onOriginClear,
  onDestinationSelect,
  onDestinationClear,
  onOriginRadiusChange,
  onDestinationRadiusChange,
  pinModeActive = false,
  pinTarget,
  onPinClick,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [originRadiusExpanded, setOriginRadiusExpanded] = useState(false);
  const [destRadiusExpanded, setDestRadiusExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const originInputRef = useRef<HTMLDivElement>(null);
  const destInputRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      setOriginRadiusExpanded(true);
      setDestRadiusExpanded(true);
    }
  };

  const removeDestination = () => {
    setExpanded(false);
    onDestinationClear();
  };

  return (
    <div className="lsp" ref={containerRef}>
      <RouteIndicator
        expanded={expanded}
        onToggle={toggle}
        onRemove={removeDestination}
        containerRef={containerRef}
        originInputRef={originInputRef}
        destInputRef={destInputRef}
      />

      <div className="lsp-fields">
        <div className="lsp-row">
          <div className="lsp-input-row" ref={originInputRef}>
            <LocationSearch
              onSelect={onOriginSelect}
              onClear={onOriginClear}
              hasLocation={origin !== null}
              locationName={origin?.displayName ?? ""}
              placeholder={expanded ? "Origin..." : "Search a location..."}
            />
            {onPinClick && (
              <button
                className={`pin-location-btn${pinModeActive && pinTarget === "origin" ? " pin-location-btn--active" : ""}`}
                onClick={() => onPinClick(pinModeActive && pinTarget === "origin" ? null : "origin")}
                title={pinModeActive && pinTarget === "origin" ? "Cancel pin" : "Pin a location"}
                aria-label={pinModeActive && pinTarget === "origin" ? "Cancel pin" : "Pin origin location"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </button>
            )}
            <button
              className={`lsp-radius-btn${originRadiusExpanded ? " lsp-radius-btn--open" : ""}`}
              onClick={() => setOriginRadiusExpanded((v) => !v)}
              title={`Search radius: ${originRadius}m`}
              aria-label={`Adjust origin radius (${originRadius}m)`}
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="7" cy="7" r="5.5" />
                <circle cx="7" cy="7" r="2" />
              </svg>
            </button>
          </div>
          {originRadiusExpanded && (
            <RadiusControl radius={originRadius} onChange={onOriginRadiusChange} />
          )}
        </div>

        {expanded ? (
          <>
            <div className="lsp-row">
              <div className="lsp-input-row" ref={destInputRef}>
                <LocationSearch
                  onSelect={onDestinationSelect}
                  onClear={onDestinationClear}
                  hasLocation={destination !== null}
                  locationName={destination?.displayName ?? ""}
                  placeholder="Destination..."
                />
                {onPinClick && (
                  <button
                    className={`pin-location-btn${pinModeActive && pinTarget === "destination" ? " pin-location-btn--active" : ""}`}
                    onClick={() => onPinClick(pinModeActive && pinTarget === "destination" ? null : "destination")}
                    title={pinModeActive && pinTarget === "destination" ? "Cancel pin" : "Pin a location"}
                    aria-label={pinModeActive && pinTarget === "destination" ? "Cancel pin" : "Pin destination location"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  </button>
                )}
                <button
                  className={`lsp-radius-btn${destRadiusExpanded ? " lsp-radius-btn--open" : ""}`}
                  onClick={() => setDestRadiusExpanded((v) => !v)}
                  title={`Search radius: ${destinationRadius}m`}
                  aria-label={`Adjust destination radius (${destinationRadius}m)`}
                >
                  <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="7" cy="7" r="5.5" />
                    <circle cx="7" cy="7" r="2" />
                  </svg>
                </button>
              </div>
              {destRadiusExpanded && (
                <RadiusControl radius={destinationRadius} onChange={onDestinationRadiusChange} />
              )}
            </div>
            <button className="lsp-remove-dest" onClick={removeDestination}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="2" y1="5" x2="8" y2="5" />
              </svg>
              Remove destination
            </button>
          </>
        ) : (
          <button className="lsp-add-dest" onClick={toggle}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="5" y1="1" x2="5" y2="9" />
              <line x1="1" y1="5" x2="9" y2="5" />
            </svg>
            Add destination
          </button>
        )}
      </div>
    </div>
  );
}
