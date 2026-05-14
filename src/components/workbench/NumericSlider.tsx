import { useId } from 'react';
import './workbench.css';

type NumericSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

export function NumericSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  onChange,
}: NumericSliderProps) {
  const rangeId = useId();
  const numberId = useId();
  const safeMin = Math.min(finiteOr(min, 0), finiteOr(max, 0));
  const safeMax = Math.max(finiteOr(min, 0), finiteOr(max, 0));
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const normalizedValue = clamp(finiteOr(value, safeMin), safeMin, safeMax);

  const update = (next: number) => {
    if (Number.isFinite(next)) {
      onChange(clamp(next, safeMin, safeMax));
    }
  };

  return (
    <div className="workbench-field">
      <span className="workbench-field__header">
        <span className="workbench-field__label" id={`${rangeId}-label`}>{label}</span>
        {unit ? <span className="workbench-field__unit">{unit}</span> : null}
      </span>
      <span className="workbench-number-slider">
        <input
          id={rangeId}
          className="workbench-number-slider__range"
          type="range"
          min={safeMin}
          max={safeMax}
          step={safeStep}
          value={normalizedValue}
          disabled={disabled}
          aria-labelledby={`${rangeId}-label`}
          aria-valuetext={`${normalizedValue}${unit ?? ''}`}
          onChange={(event) => update(event.currentTarget.valueAsNumber)}
        />
        <input
          id={numberId}
          className="workbench-number-slider__number"
          type="number"
          min={safeMin}
          max={safeMax}
          step={safeStep}
          value={normalizedValue}
          disabled={disabled}
          aria-label={`${label}${unit ? ` (${unit})` : ''}`}
          onChange={(event) => update(event.currentTarget.valueAsNumber)}
        />
      </span>
    </div>
  );
}
