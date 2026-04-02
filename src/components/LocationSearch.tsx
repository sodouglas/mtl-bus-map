import { useEffect, useRef, useState } from "react";
import type { GeocodingResult, SelectedLocation } from "../types";
import { searchLocation } from "../geocoding";

interface Props {
  onSelect: (location: SelectedLocation) => void;
  onClear: () => void;
  hasLocation: boolean;
  locationName: string;
  placeholder?: string;
}

export function LocationSearch({
  onSelect,
  onClear,
  hasLocation,
  locationName,
  placeholder = "Search a location...",
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeout = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      searchLocation(query, controller.signal)
        .then((data) => {
          setResults(data);
          setIsOpen(data.length > 0);
          setLoading(false);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(result: GeocodingResult) {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSelect({
      displayName: result.displayName,
      lat: result.lat,
      lng: result.lng,
    });
  }

  if (hasLocation) {
    return (
      <div className="location-search">
        <div className="location-pill">
          <span className="location-pill-text">{locationName}</span>
          <button
            className="location-pill-clear"
            onClick={onClear}
            aria-label="Clear location"
          >
            &times;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="location-search">
      <input
        type="search"
        className="location-search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />
      {loading && query.length >= 3 && (
        <div className="location-search-loading">Searching...</div>
      )}
      {isOpen && (
        <ul className="location-search-dropdown">
          {results.map((r) => (
            <li key={r.placeId}>
              <button
                className="location-search-dropdown-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(r)}
              >
                {r.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
