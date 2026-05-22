import type { Phone } from '../data/phones';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<Size, { w: number; h: number }> = {
  xs: { w: 28, h: 56 },
  sm: { w: 38, h: 76 },
  md: { w: 76, h: 152 },
  lg: { w: 130, h: 260 },
  xl: { w: 220, h: 440 },
};

// Per-brand color stops
const COLOR_STOPS: Record<Phone['color'], { hi: string; lo: string; rim: string }> = {
  titanium: { hi: '#b0b4bd', lo: '#42464f', rim: '#171a20' },
  navy: { hi: '#4d6294', lo: '#1a233a', rim: '#0d1320' },
  graphite: { hi: '#454a55', lo: '#161820', rim: '#0a0c11' },
  silver: { hi: '#dadde2', lo: '#7a8089', rim: '#3a3e45' },
  ivory: { hi: '#e6dac1', lo: '#9c907a', rim: '#4a4338' },
  green: { hi: '#7eaa97', lo: '#2d4a40', rim: '#152521' },
};

// 不同品牌 camera 模组的几何
function renderCameraModule(phone: Phone, w: number, h: number) {
  // 模组尺寸大致是机身宽 × 高的 30% × 16%
  const mw = w * 0.32;
  const mh = w * 0.32;
  const mx = w * 0.08;
  const my = h * 0.04;
  const r = mw * 0.18;
  const base = (
    <rect
      x={mx}
      y={my}
      width={mw}
      height={mh}
      rx={r}
      fill="rgba(0, 0, 0, 0.5)"
      stroke="rgba(255, 255, 255, 0.08)"
      strokeWidth={0.6}
    />
  );

  const lensFill = 'url(#lensGrad)';
  const lensSize = mw * 0.27;
  const padding = mw * 0.16;

  // Brand-specific layouts
  if (phone.brand === 'Apple') {
    // 3 lenses 2x2 grid (top-left, top-right, bottom-left) + flash
    return (
      <g>
        {base}
        <circle cx={mx + padding + lensSize / 2} cy={my + padding + lensSize / 2} r={lensSize / 2} fill={lensFill} />
        <circle cx={mx + mw - padding - lensSize / 2} cy={my + padding + lensSize / 2} r={lensSize / 2} fill={lensFill} />
        <circle cx={mx + padding + lensSize / 2} cy={my + mh - padding - lensSize / 2} r={lensSize / 2} fill={lensFill} />
        <circle cx={mx + mw - padding - lensSize / 2} cy={my + mh - padding - lensSize / 2} r={lensSize / 2 * 0.7} fill="#f0c044" />
      </g>
    );
  }
  if (phone.brand === 'Samsung') {
    // Vertical 3 lens column on the left
    const x = mx + padding;
    return (
      <g>
        {base}
        <circle cx={x + lensSize / 2} cy={my + padding + lensSize / 2} r={lensSize / 2} fill={lensFill} />
        <circle cx={x + lensSize / 2} cy={my + mh / 2} r={lensSize / 2} fill={lensFill} />
        <circle cx={x + lensSize / 2} cy={my + mh - padding - lensSize / 2} r={lensSize / 2 * 0.85} fill={lensFill} />
      </g>
    );
  }
  if (phone.brand === 'Google') {
    // Horizontal pill across the back (common Pixel bar style)
    const barH = mh * 0.6;
    return (
      <g>
        <rect x={0} y={my} width={w} height={barH} rx={barH / 2} fill="rgba(0, 0, 0, 0.55)" />
        <circle cx={mx + lensSize} cy={my + barH / 2} r={lensSize * 0.7} fill={lensFill} />
        <circle cx={mx + lensSize * 3} cy={my + barH / 2} r={lensSize * 0.7} fill={lensFill} />
      </g>
    );
  }
  // Default: 2x2 lenses
  return (
    <g>
      {base}
      <circle cx={mx + padding + lensSize / 2} cy={my + padding + lensSize / 2} r={lensSize / 2} fill={lensFill} />
      <circle cx={mx + mw - padding - lensSize / 2} cy={my + padding + lensSize / 2} r={lensSize / 2} fill={lensFill} />
      <circle cx={mx + padding + lensSize / 2} cy={my + mh - padding - lensSize / 2} r={lensSize / 2} fill={lensFill} />
      <circle cx={mx + mw - padding - lensSize / 2} cy={my + mh - padding - lensSize / 2} r={lensSize / 2 * 0.55} fill="#e8c34a" />
    </g>
  );
}

type Props = {
  phone: Phone;
  size?: Size;
  /** Show camera (default true) */
  showCamera?: boolean;
  /** Show screen "glow" (default false) — for front view */
  front?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function PhoneVisual({ phone, size = 'md', showCamera = true, front = false, className, style }: Props) {
  const { w, h } = SIZE_MAP[size];
  const stops = COLOR_STOPS[phone.color];
  // 圆角随尺寸缩放，目标视觉接近 9R + 现代手机比例
  const radius = w * 0.14;
  const screenInset = w * 0.04;
  const screenRadius = radius - screenInset * 0.4;
  const uid = `phone-${phone.id}-${size}`;

  return (
    <svg
      className={className}
      style={style}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-label={phone.name}
    >
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={stops.hi} />
          <stop offset="60%" stopColor={stops.lo} />
          <stop offset="100%" stopColor={stops.rim} />
        </linearGradient>
        <linearGradient id="lensGrad" x1="0.2" y1="0.2" x2="0.8" y2="0.8">
          <stop offset="0%" stopColor="#5a6470" />
          <stop offset="55%" stopColor="#1c2028" />
          <stop offset="100%" stopColor="#070a0e" />
        </linearGradient>
        <linearGradient id={`${uid}-screen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(180, 197, 255, 0.18)" />
          <stop offset="60%" stopColor="rgba(76, 124, 255, 0.06)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.25)" />
        </linearGradient>
        <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.16)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </linearGradient>
      </defs>

      {/* Body */}
      <rect
        x={0.5}
        y={0.5}
        width={w - 1}
        height={h - 1}
        rx={radius}
        fill={`url(#${uid}-body)`}
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth={1}
      />
      {/* Top shine band */}
      <rect x={0.5} y={0.5} width={w - 1} height={h * 0.4} rx={radius} fill={`url(#${uid}-shine)`} opacity={0.4} />

      {/* Rim highlight */}
      <rect
        x={1.5}
        y={1.5}
        width={w - 3}
        height={h - 3}
        rx={radius - 1}
        fill="none"
        stroke="rgba(255, 255, 255, 0.04)"
        strokeWidth={0.6}
      />

      {/* Camera module or screen */}
      {front ? (
        <rect
          x={screenInset}
          y={screenInset * 1.5}
          width={w - screenInset * 2}
          height={h - screenInset * 3}
          rx={screenRadius}
          fill={`url(#${uid}-screen)`}
          stroke="rgba(180, 197, 255, 0.1)"
          strokeWidth={0.5}
        />
      ) : showCamera ? (
        renderCameraModule(phone, w, h)
      ) : null}
    </svg>
  );
}
