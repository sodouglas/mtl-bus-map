interface Props {
  radius: number;
  onChange: (radius: number) => void;
}

const MIN = 100;
const MAX = 2000;
const STEP = 50;

export function RadiusControl({ radius, onChange }: Props) {
  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(Number(e.target.value));
  }

  return (
    <div className="radius-control">
      <label className="radius-control-label">Radius</label>
      <input
        type="range"
        className="radius-control-slider"
        min={MIN}
        max={MAX}
        step={STEP}
        value={radius}
        onChange={handleSlider}
      />
      <span className="radius-control-value">{radius}m</span>
    </div>
  );
}
