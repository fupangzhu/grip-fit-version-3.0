import { useId } from 'react';
import './workbench.css';

export type RangeValue = {
  min: number;
  max: number;
};

type RangeFilterProps = {
  label: string;
  value: RangeValue;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: RangeValue) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

export function RangeFilter({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  onChange,
}: RangeFilterProps) {
  const labelId = useId();
  const safeMin = Math.min(finiteOr(min, 0), finiteOr(max, 0));
  const safeMax = Math.max(finiteOr(min, 0), finiteOr(max, 0));
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const rawMin = finiteOr(value.min, safeMin);
  const rawMax = finiteOr(value.max, safeMax);
  const lower = clamp(Math.min(rawMin, rawMax), safeMin, safeMax);
  const upper = clamp(Math.max(rawMin, rawMax), safeMin, safeMax);
  const rangeSpan = safeMax - safeMin;
  const lowerPercent = rangeSpan > 0 ? ((lower - safeMin) / rangeSpan) * 100 : 0;
  const upperPercent = rangeSpan > 0 ? ((upper - safeMin) / rangeSpan) * 100 : 100;

  const updateLower = (next: number) => {
    if (!Number.isFinite(next)) {
      return;
    }

    onChange({ min: clamp(Math.min(next, upper), safeMin, safeMax), max: upper });
  };

  const updateUpper = (next: number) => {
    if (!Number.isFinite(next)) {
      return;
    }

    onChange({ min: lower, max: clamp(Math.max(next, lower), safeMin, safeMax) });
  };

  return (
    <div className="workbench-range-filter" role="group" aria-labelledby={labelId}>
      <div className="workbench-field__header">
        <span className="workbench-field__label" id={labelId}>{label}</span>
        <span className="workbench-range-filter__value">
          {lower}
          {unit} - {upper}
          {unit}
        </span>
      </div>
      <div className="workbench-range-filter__track-wrap">
        <div className="workbench-range-filter__rail" />
        <div
          className="workbench-range-filter__fill"
          style={{ left: `${lowerPercent}%`, width: `${upperPercent - lowerPercent}%` }}
        />
        <input
          className="workbench-range-filter__input"
          type="range"
          min={safeMin}
          max={safeMax}
          step={safeStep}
          value={lower}
          disabled={disabled}
          aria-label={`${label} minimum`}
          aria-valuetext={`${lower}${unit ?? ''}`}
          onChange={(event) => updateLower(event.currentTarget.valueAsNumber)}
        />
        <input
          className="workbench-range-filter__input"
          type="range"
          min={safeMin}
          max={safeMax}
          step={safeStep}
          value={upper}
          disabled={disabled}
          aria-label={`${label} maximum`}
          aria-valuetext={`${upper}${unit ?? ''}`}
          onChange={(event) => updateUpper(event.currentTarget.valueAsNumber)}
        />
      </div>
    </div>
  );
}
