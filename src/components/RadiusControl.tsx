interface Props {
  radius: number;
  onChange: (radius: number) => void;
}

const MIN = 100;
const MAX = 1000;
const STEP = 50;

export function RadiusControl({ radius, onChange }: Props) {
  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(Number(e.target.value));
  }

  function handleNumber(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    if (!isNaN(v) && v >= MIN && v <= MAX) {
      onChange(v);
    }
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
      <div className="radius-control-number-wrap">
        <input
          type="number"
          className="radius-control-number"
          min={MIN}
          max={MAX}
          step={STEP}
          value={radius}
          onChange={handleNumber}
        />
        <span className="radius-control-unit">m</span>
      </div>
    </div>
  );
}
