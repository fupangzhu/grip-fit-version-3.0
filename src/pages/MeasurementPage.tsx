import { Suspense, lazy, useId, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useFlowState } from '../hooks/useFlowState';
import './MeasurementPage.css';

const HandStage = lazy(() => import('../components/three/HandStage'));

type MeasurementMode = 'smart' | 'manual';

// 手长/手宽的 P5-P95 范围（参考 GB/T 10000-1988 中国成年人）
const HAND_LENGTH = { min: 150, max: 220, p5: 159, p95: 196 };
const HAND_WIDTH = { min: 65, max: 105, p5: 70, p95: 89 };

// 计算当前值在 P5-P95 区间内的百分位（0-100）
function percentile(value: number, p5: number, p95: number): number {
  return Math.round(Math.min(100, Math.max(0, ((value - p5) / (p95 - p5)) * 100)));
}

// 正态分布钟形曲线（百分位为 x 轴，P5 左 / P95 右）。曲线静态，仅 marker 随数据移动。
const CURVE = { cx: 50, sigma: 18, base: 86, peak: 14 };
function gaussianY(xPct: number): number {
  const amp = CURVE.base - CURVE.peak;
  const t = (xPct - CURVE.cx) / CURVE.sigma;
  return CURVE.base - amp * Math.exp(-(t * t) / 2);
}
const CURVE_LINE = (() => {
  const N = 64;
  let d = '';
  for (let i = 0; i <= N; i += 1) {
    const x = (i / N) * 100;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${gaussianY(x).toFixed(2)} `;
  }
  return d.trim();
})();
const CURVE_AREA = `${CURVE_LINE} L100 ${CURVE.base} L0 ${CURVE.base} Z`;

// 计算当前值在滑条全范围内的位置（0-100）
function markerPosition(value: number, min: number, max: number): number {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

// 根据性别/年龄从 GB/T 重置到平均值
function resetToGBT(gender: 'male' | 'female', age: '18-35' | '36-55' | '56+') {
  const table: Record<typeof gender, Record<typeof age, { length: number; width: number }>> = {
    male: {
      '18-35': { length: 183, width: 82 },
      '36-55': { length: 184, width: 83 },
      '56+': { length: 180, width: 81 },
    },
    female: {
      '18-35': { length: 171, width: 76 },
      '36-55': { length: 172, width: 77 },
      '56+': { length: 169, width: 75 },
    },
  };
  return table[gender][age];
}

export default function MeasurementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [flow, updateFlow] = useFlowState();
  // 从 /profile-info「跳过识别」进入时，默认手动调整模式
  const initialMode: MeasurementMode =
    (location.state as { mode?: MeasurementMode } | null)?.mode === 'manual' ? 'manual' : 'smart';
  const [mode, setMode] = useState<MeasurementMode>(initialMode);

  const handLength = flow.handLength;
  const handWidth = flow.handWidth;
  const lengthPct = percentile(handLength, HAND_LENGTH.p5, HAND_LENGTH.p95);
  const widthPct = percentile(handWidth, HAND_WIDTH.p5, HAND_WIDTH.p95);
  const lengthMarker = markerPosition(handLength, HAND_LENGTH.min, HAND_LENGTH.max);
  const widthMarker = markerPosition(handWidth, HAND_WIDTH.min, HAND_WIDTH.max);
  const confidence = mode === 'smart' ? '98.2' : '94.6';
  const gbtRank = useMemo(() => `P${Math.round((lengthPct + widthPct) / 2)}`, [lengthPct, widthPct]);

  const handleSubmit = () => {
    navigate('/report/best-phone');
  };

  const handleReset = () => {
    const { length, width } = resetToGBT(flow.gender, flow.ageGroup);
    updateFlow({ handLength: length, handWidth: width });
  };

  return (
    <div className={`measure-page measure-page--${mode}`}>
      <aside className="measure-panel">
        <h1 className="measure-panel__title">手部测量</h1>

        <div className="measure-mode" role="tablist" aria-label="测量模式">
          <button
            className={`measure-mode__tab ${mode === 'smart' ? 'is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={mode === 'smart'}
            onClick={() => setMode('smart')}
          >
            智能测量
          </button>
          <button
            className={`measure-mode__tab ${mode === 'manual' ? 'is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={mode === 'manual'}
            onClick={() => setMode('manual')}
          >
            手动调整
          </button>
        </div>

        <div className="measure-section-head">
          <span>核心测量维度</span>
          <span>单位: MM</span>
        </div>

        <MetricCard
          title="手长"
          desc="Tip of middle finger to wrist crease"
          value={handLength}
          decimals={1}
          min={HAND_LENGTH.min}
          max={HAND_LENGTH.max}
          step={0.1}
          marker={lengthMarker}
          percentile={lengthPct}
          mode={mode}
          onChange={(v) => updateFlow({ handLength: Math.round(v * 10) / 10 })}
        />

        <MetricCard
          title="手宽"
          desc="Metacarpal breadth at the knuckles"
          value={handWidth}
          decimals={1}
          min={HAND_WIDTH.min}
          max={HAND_WIDTH.max}
          step={0.1}
          marker={widthMarker}
          percentile={widthPct}
          mode={mode}
          onChange={(v) => updateFlow({ handWidth: Math.round(v * 10) / 10 })}
        />

        <div className="measure-actions">
          <motion.button
            type="button"
            className="measure-actions__primary"
            onClick={handleSubmit}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
          >
            <span>提交测量 / COMMIT MEASUREMENT</span>
            <ArrowRight size={14} strokeWidth={2} />
          </motion.button>
          <button
            type="button"
            className="measure-actions__secondary glass-button"
            onClick={handleReset}
          >
            <RotateCcw size={14} strokeWidth={1.7} />
            重置为默认 / RESET TO DEFAULT
          </button>
        </div>
      </aside>

      <section className="measure-visual" aria-label="手部模型预览">
        <div className="measure-visual__stage">
          <Suspense fallback={<div className="measure-visual__loading">加载手部模型…</div>}>
            <HandStage view="top" dimensions={{ length: handLength, width: handWidth }} />
          </Suspense>
          <div className="measure-visual__hint">拖拽旋转</div>
        </div>

        <div className="measure-stats">
          <div className="measure-stats__item">
            <span>DATA CONFIDENCE</span>
            <strong>{confidence}<small>%</small></strong>
          </div>
          <div className="measure-stats__item">
            <span>GB/T MATCH</span>
            <strong>{gbtRank}<small>Rank</small></strong>
          </div>
          <div className="measure-stats__item">
            <span>ESTIMATED GRIP WIDTH</span>
            <strong>{(handWidth * 0.885).toFixed(1)}<small>mm</small></strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  desc,
  value,
  decimals,
  min,
  max,
  step,
  marker,
  percentile: pct,
  mode,
  onChange,
}: {
  title: string;
  desc: string;
  value: number;
  decimals: number;
  min: number;
  max: number;
  step: number;
  marker: number;
  percentile: number;
  mode: MeasurementMode;
  onChange: (value: number) => void;
}) {
  const isManual = mode === 'manual';
  const gid = useId();
  const dotY = gaussianY(pct);
  return (
    <article className={`measure-metric ${isManual ? 'is-manual' : 'is-smart'}`}>
      <div className="measure-metric__head">
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      <strong className="measure-metric__value">{value.toFixed(decimals)}</strong>

      {isManual ? (
        <div className="measure-metric__slider">
          <span className="measure-metric__slider-track" />
          <span className="measure-metric__slider-fill" style={{ width: `${marker}%` }} />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            aria-label={`${title} 手动调整`}
            onChange={(e) => onChange(e.currentTarget.valueAsNumber)}
          />
          <span className="measure-metric__slider-thumb" style={{ left: `${marker}%` }} />
        </div>
      ) : null}

      <div className="measure-metric__curve">
        <svg className="measure-metric__curve-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={`mc-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(180, 197, 255, 0.24)" />
              <stop offset="100%" stopColor="rgba(180, 197, 255, 0)" />
            </linearGradient>
          </defs>
          <line x1="0" y1={CURVE.base} x2="100" y2={CURVE.base} stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={CURVE_AREA} fill={`url(#mc-${gid})`} />
          <path d={CURVE_LINE} fill="none" stroke="rgba(180, 197, 255, 0.82)" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="measure-metric__curve-drop" style={{ left: `${pct}%`, top: `${dotY}%` }} />
        <span className="measure-metric__curve-dot" style={{ left: `${pct}%`, top: `${dotY}%` }} />
      </div>

      <div className="measure-metric__percentiles">
        <span>P5</span>
        <span className="measure-metric__percentiles-current">P{pct} (Current)</span>
        <span>P95</span>
      </div>
    </article>
  );
}
