interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export function MapCenterPin({ onConfirm, onCancel }: Props) {
  return (
    <div className="map-center-pin-overlay">
      <div className="map-center-pin-icon">
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22s14-12.667 14-22C28 6.268 21.732 0 14 0z" fill="#3A86FF"/>
          <circle cx="14" cy="14" r="5" fill="white"/>
        </svg>
      </div>
      <div className="map-center-pin-controls">
        <button className="map-center-pin-confirm" onClick={onConfirm}>✓ Confirm</button>
        <span className="map-center-pin-sep">|</span>
        <button className="map-center-pin-cancel" onClick={onCancel}>×</button>
      </div>
    </div>
  );
}
