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
}: Props) {
  const [originRadiusExpanded, setOriginRadiusExpanded] = useState(false);
  const [destRadiusExpanded, setDestRadiusExpanded] = useState(false);

  return (
    <div className="location-pair">
      <div className="location-pair-row">
        <span className="location-pair-label">From</span>
        <div className="location-section-row">
          <LocationSearch
            onSelect={onOriginSelect}
            onClear={onOriginClear}
            hasLocation={origin !== null}
            locationName={origin?.displayName ?? ""}
          />
          <button
            className={`radius-expand-btn${originRadiusExpanded ? " radius-expand-btn--open" : ""}`}
            onClick={() => setOriginRadiusExpanded((v) => !v)}
            title="Toggle origin radius"
            aria-label="Toggle origin radius"
          >
            ···
          </button>
        </div>
        {originRadiusExpanded && (
          <RadiusControl radius={originRadius} onChange={onOriginRadiusChange} />
        )}
      </div>

      <div className="location-pair-row">
        <span className="location-pair-label">To</span>
        <div className="location-section-row">
          <LocationSearch
            onSelect={onDestinationSelect}
            onClear={onDestinationClear}
            hasLocation={destination !== null}
            locationName={destination?.displayName ?? ""}
          />
          <button
            className={`radius-expand-btn${destRadiusExpanded ? " radius-expand-btn--open" : ""}`}
            onClick={() => setDestRadiusExpanded((v) => !v)}
            title="Toggle destination radius"
            aria-label="Toggle destination radius"
          >
            ···
          </button>
        </div>
        {destRadiusExpanded && (
          <RadiusControl radius={destinationRadius} onChange={onDestinationRadiusChange} />
        )}
      </div>
    </div>
  );
}
