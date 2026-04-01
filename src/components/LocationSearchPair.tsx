import { useState } from "react";
import type { SelectedLocation } from "../types";
import { LocationSearch } from "./LocationSearch";
import { RadiusControl } from "./RadiusControl";

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

  return (
    <div className="lsp">
      <button
        className={`lsp-chevron${expanded ? " lsp-chevron--open" : ""}`}
        onClick={() => setExpanded((v) => !v)}
        title={expanded ? "Single location" : "Add destination"}
        aria-label={expanded ? "Single location" : "Add destination"}
        aria-expanded={expanded}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="lsp-fields">
        <div className="lsp-row">
          <div className="lsp-input-row">
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
                📍
              </button>
            )}
            <button
              className={`lsp-radius-btn${originRadiusExpanded ? " lsp-radius-btn--open" : ""}`}
              onClick={() => setOriginRadiusExpanded((v) => !v)}
              title={`Search radius: ${originRadius}m`}
              aria-label={`Adjust origin radius (${originRadius}m)`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="7" cy="7" r="5.5" />
                <circle cx="7" cy="7" r="2" />
              </svg>
            </button>
          </div>
          {originRadiusExpanded && (
            <RadiusControl radius={originRadius} onChange={onOriginRadiusChange} />
          )}
        </div>

        {expanded && (
          <div className="lsp-row">
            <div className="lsp-input-row">
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
                  📍
                </button>
              )}
              <button
                className={`lsp-radius-btn${destRadiusExpanded ? " lsp-radius-btn--open" : ""}`}
                onClick={() => setDestRadiusExpanded((v) => !v)}
                title={`Search radius: ${destinationRadius}m`}
                aria-label={`Adjust destination radius (${destinationRadius}m)`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="7" cy="7" r="5.5" />
                  <circle cx="7" cy="7" r="2" />
                </svg>
              </button>
            </div>
            {destRadiusExpanded && (
              <RadiusControl radius={destinationRadius} onChange={onDestinationRadiusChange} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
