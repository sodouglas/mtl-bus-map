import type { RouteData } from "../types";

interface Props {
  route: RouteData;
  selected: boolean;
  colorOverride?: string;
  onToggle: (id: string) => void;
}

export function RouteItem({ route, selected, colorOverride, onToggle }: Props) {
  const dotColor = colorOverride ?? route.color;
  return (
    <label
      className={`route-item${selected ? " route-item--selected" : ""}`}
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
      />
      <span className="route-color-dot" style={{ backgroundColor: dotColor }} />
      <span className="route-label">
        <strong>{route.routeNumber}</strong>
        {route.direction ? ` - ${route.direction}` : ""}
        {route.name && route.routeType !== "metro" ? (
          <small> ({route.name})</small>
        ) : null}
      </span>
    </label>
  );
}
