import type { RouteData } from "../types";

interface Props {
  route: RouteData;
  selected: boolean;
  colorOverride?: string;
  onToggle: (id: string) => void;
  highlighted?: boolean;
  onHighlightRoute?: (id: string | null) => void;
  showAgency?: boolean;
}

export function RouteItem({ route, selected, colorOverride, onToggle, highlighted, onHighlightRoute, showAgency }: Props) {
  const dotColor = colorOverride ?? route.color;
  const className = `route-item${selected ? " route-item--selected" : ""}${highlighted ? " route-item--highlighted" : ""}`;

  const label = (
    <span className="route-label">
      <strong>{route.routeNumber}</strong>
      {showAgency && route.agency ? (
        <span className="route-agency-badge">{route.agency}</span>
      ) : null}
      {route.direction ? ` ${route.direction}` : ""}
      {route.name && route.routeType !== "metro" && route.routeType !== "train" ? (
        <small> {route.name}</small>
      ) : null}
    </span>
  );

  if (onHighlightRoute) {
    return (
      <div
        className={className}
        style={
          colorOverride
            ? ({ "--item-color": colorOverride } as React.CSSProperties)
            : undefined
        }
        onClick={() => onHighlightRoute(route.id)}
      >
        <span className="route-color-dot" style={{ backgroundColor: dotColor }} />
        {label}
      </div>
    );
  }

  return (
    <label
      className={className}
      style={
        colorOverride
          ? ({ "--item-color": colorOverride } as React.CSSProperties)
          : undefined
      }
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(route.id)}
        className="sr-only"
      />
      <span className="route-color-dot" style={{ backgroundColor: dotColor }} />
      {label}
    </label>
  );
}
