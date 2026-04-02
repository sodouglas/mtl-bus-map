import type { RouteData } from "../types";

interface Props {
  route: RouteData;
  selected: boolean;
  colorOverride?: string;
  onToggle: (id: string) => void;
  highlighted?: boolean;
  onHighlightRoute?: (id: string | null) => void;
}

export function RouteItem({ route, selected, colorOverride, onToggle, highlighted, onHighlightRoute }: Props) {
  const dotColor = colorOverride ?? route.color;
  const className = `route-item${selected ? " route-item--selected" : ""}${highlighted ? " route-item--highlighted" : ""}`;

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
        <span className="route-label">
          <strong>{route.routeNumber}</strong>
          {route.direction ? ` ${route.direction}` : ""}
          {route.name && route.routeType !== "metro" ? (
            <small> {route.name}</small>
          ) : null}
        </span>
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
      <span className="route-label">
        <strong>{route.routeNumber}</strong>
        {route.direction ? ` ${route.direction}` : ""}
        {route.name && route.routeType !== "metro" ? (
          <small> {route.name}</small>
        ) : null}
      </span>
    </label>
  );
}
