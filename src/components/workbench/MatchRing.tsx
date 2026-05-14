import './workbench.css';

type MatchRingProps = {
  value: number;
  label?: string;
  size?: number;
  stroke?: number;
  className?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

export function MatchRing({
  value,
  label = 'Match',
  size = 72,
  stroke = 7,
  className = '',
}: MatchRingProps) {
  const safeSize = Math.max(24, finiteOr(size, 72));
  const safeStroke = clamp(finiteOr(stroke, 7), 1, safeSize / 2);
  const normalizedValue = clamp(finiteOr(value, 0), 0, 100);
  const radius = (safeSize - safeStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - normalizedValue / 100);

  return (
    <div
      className={`workbench-match-ring ${className}`}
      style={{ width: safeSize }}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalizedValue)}
      aria-valuetext={`${Math.round(normalizedValue)}%`}
    >
      <svg
        className="workbench-match-ring__svg"
        width={safeSize}
        height={safeSize}
        viewBox={`0 0 ${safeSize} ${safeSize}`}
        aria-hidden="true"
        focusable="false"
      >
        <circle
          className="workbench-match-ring__track"
          cx={safeSize / 2}
          cy={safeSize / 2}
          r={radius}
          strokeWidth={safeStroke}
        />
        <circle
          className="workbench-match-ring__value"
          cx={safeSize / 2}
          cy={safeSize / 2}
          r={radius}
          strokeWidth={safeStroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="workbench-match-ring__score">{Math.round(normalizedValue)}</span>
      <span className="workbench-match-ring__label">{label}</span>
    </div>
  );
}
