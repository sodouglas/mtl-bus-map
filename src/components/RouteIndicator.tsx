import { useEffect, useState, type RefObject } from "react";

interface Props {
  expanded: boolean;
  onToggle: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
  originInputRef: RefObject<HTMLDivElement | null>;
  destInputRef: RefObject<HTMLDivElement | null>;
}

export function RouteIndicator({
  expanded,
  onToggle,
  containerRef,
  originInputRef,
  destInputRef,
}: Props) {
  const [originY, setOriginY] = useState(0);
  const [destY, setDestY] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const cRect = container.getBoundingClientRect();
      if (originInputRef.current) {
        const r = originInputRef.current.getBoundingClientRect();
        setOriginY(r.top + r.height / 2 - cRect.top);
      }
      if (destInputRef.current) {
        const r = destInputRef.current.getBoundingClientRect();
        setDestY(r.top + r.height / 2 - cRect.top);
      }
    };

    requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [expanded, containerRef, originInputRef, destInputRef]);

  const dotR = 5;

  return (
    <div className="ri">
      {/* Origin dot */}
      {expanded ? (
        <div className="ri-dot ri-dot--origin" style={{ top: originY }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r={dotR} fill="#3b82f6" />
            <circle cx="6" cy="6" r="2" fill="white" />
          </svg>
        </div>
      ) : (
        <button
          className="ri-dot ri-dot--inactive"
          style={{ top: originY }}
          onClick={onToggle}
          title="Add destination"
          aria-label="Add destination"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r={dotR} fill="currentColor" />
            <circle cx="6" cy="6" r="2" fill="white" />
          </svg>
        </button>
      )}

      {/* Connecting line + destination dot */}
      {expanded && destY > 0 && (
        <>
          <div
            className="ri-line"
            style={{
              top: originY + dotR + 1,
              height: Math.max(0, destY - originY - dotR * 2 - 2),
            }}
          />
          <button
            className="ri-dot ri-dot--dest"
            style={{ top: destY }}
            onClick={onToggle}
            title="Remove destination"
            aria-label="Remove destination"
          >
            <svg className="ri-dot-circle" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r={dotR} fill="#ef4444" />
              <circle cx="6" cy="6" r="2" fill="white" />
            </svg>
            <svg className="ri-dot-x" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r={dotR} fill="#ef4444" />
              <line x1="4" y1="4" x2="8" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="8" y1="4" x2="4" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
