import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Move3D, ZoomIn, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useFlowState } from '../hooks/useFlowState';
import { usePanelCollapse } from '../hooks/usePanelCollapse';
import { deriveIdealSpec, scorePhoneForHand } from '../data/scoring';
import type { Phone } from '../data/phones';
import ShapeDiverPhoneViewer from '../components/shapediver/ShapeDiverPhoneViewer';
import './TuningPage.css';

type View = 'front' | 'back' | 'hand' | 'risk';

const VIEWS: { key: View; label: string }[] = [
  { key: 'front', label: '正面' },
  { key: 'back', label: '背面' },
  { key: 'hand', label: '手持' },
  { key: 'risk', label: '风险点' },
];

const RISK_DOTS = [
  { id: 'camera', top: '18%', left: '42%', tip: '镜头凸起偏高，食指支撑点稳定性下降。建议减小凸起或调整模组位置。' },
  { id: 'weight', top: '52%', left: '58%', tip: '当前重量偏大，长时间握持会增加手部疲劳。建议控制在 180g 以内。' },
  { id: 'palm',   top: '78%', left: '38%', tip: '掌根接触压力略高，圆角半径偏小。建议增大四边圆角至 R12+。' },
] as const;

export default function TuningPage() {
  const navigate = useNavigate();
  const [flow, updateFlow] = useFlowState();
  const [view, setView] = useState<View>('front');
  const [showHand, setShowHand] = useState(false);
  const [riskTip, setRiskTip] = useState<string | null>(null);
  const [cameraSide, setCameraSide] = useState('左上');
  const [cornerStyle, setCornerStyle] = useState('柔和过渡');
  const [panelCollapsed, togglePanel] = usePanelCollapse('gripfit-tuning-panel-collapsed');
  const [draftCustom, setDraftCustom] = useState(() => flow.custom);
  const [submittedCustom, setSubmittedCustom] = useState(() => flow.custom);

  useEffect(() => {
    setDraftCustom(flow.custom);
    setSubmittedCustom(flow.custom);
  }, [flow.custom]);

  const hasPendingModelUpdate = useMemo(
    () => Object.keys(draftCustom).some((key) => {
      const field = key as keyof typeof draftCustom;
      return draftCustom[field] !== submittedCustom[field];
    }),
    [draftCustom, submittedCustom],
  );

  // 把 custom 包装成 Phone 形状，喂给 scoring
  const customPhone: Phone = useMemo(() => ({
    id: 'custom',
    name: '自定义方案',
    brand: '自定义',
    releaseDate: '2025-01',
    price: 0,
    width: draftCustom.width,
    height: draftCustom.height,
    thickness: draftCustom.thickness,
    weight: draftCustom.weight,
    screen: 6.2,
    ratio: '19.5:9',
    cameraBump: draftCustom.cameraBump,
    cornerRadius: draftCustom.cornerRadius,
    centerOfMassOffset: draftCustom.centerOfMassOffset,
    backArc: draftCustom.backArc,
    rearCamera: '',
    battery: '',
    imageUrl: '',
    color: 'graphite',
  }), [draftCustom]);

  const score = useMemo(
    () => scorePhoneForHand(customPhone, flow.handLength, flow.handWidth),
    [customPhone, flow.handLength, flow.handWidth],
  );
  const ideal = useMemo(
    () => deriveIdealSpec(flow.handLength, flow.handWidth),
    [flow.handLength, flow.handWidth],
  );
  const aspectRatio = draftCustom.height / draftCustom.width;
  const idealAspectRatio = ideal.height / ideal.width;

  const updateCustom = (patch: Partial<typeof draftCustom>) => {
    setDraftCustom((current) => ({ ...current, ...patch }));
  };

  const updateWidth = (width: number) => {
    const ratio = draftCustom.height / draftCustom.width;
    updateCustom({ width, height: Number((width * ratio).toFixed(1)) });
  };

  const updateAspectRatio = (ratio: number) => {
    updateCustom({ height: Number((draftCustom.width * ratio).toFixed(1)) });
  };

  const commitModelUpdate = () => {
    setSubmittedCustom(draftCustom);
    updateFlow({ custom: draftCustom });
  };

  const saveTuningScheme = () => {
    updateFlow({ custom: draftCustom });
    navigate('/report');
  };

  return (
    <div className="tuning-page">
      <main className={`tuning-page__main ${panelCollapsed ? 'is-panel-collapsed' : ''}`}>
        <button
          type="button"
          className="panel-handle"
          onClick={togglePanel}
          aria-label={panelCollapsed ? '展开参数面板' : '收起参数面板'}
          title={panelCollapsed ? '展开' : '收起'}
        >
          {panelCollapsed ? <ChevronLeft size={15} strokeWidth={2} /> : <ChevronRight size={15} strokeWidth={2} />}
        </button>

        <section className="tuning-stage">
          <div className="tuning-stage__hint">
            <Move3D size={12} strokeWidth={1.6} /> 拖曳旋转
            <span>·</span>
            <ZoomIn size={12} strokeWidth={1.6} /> 滚轮缩放
          </div>

          <div className="tuning-stage__score">
            <div className="score-ring" style={{ ['--score-deg' as never]: `${score.total * 36}deg` }}>
              <div className="score-ring__inner">
                <strong>{score.total.toFixed(1)}</strong>
                <span>/10</span>
              </div>
            </div>
            <p>当前方案</p>
          </div>

          <div className={`tuning-device tuning-device--${view}`}>
            <ShapeDiverPhoneViewer
              spec={{
                width: submittedCustom.width,
                height: submittedCustom.height,
                thickness: submittedCustom.thickness,
                cornerRadius: submittedCustom.cornerRadius,
                weight: submittedCustom.weight,
                cameraBump: submittedCustom.cameraBump,
                sideArc: submittedCustom.sideArc,
                backArc: submittedCustom.backArc,
                centerOfMassOffset: submittedCustom.centerOfMassOffset,
              }}
              updatingLabel="正在更新当前方案模型"
            />
            <em className="tuning-device__size-label">
              {submittedCustom.width.toFixed(1)} x {submittedCustom.height.toFixed(1)} mm
            </em>

            {view === 'risk' ? (
              <>
                {RISK_DOTS.map((dot) => (
                  <button
                    key={dot.id}
                    type="button"
                    className="tuning-risk-dot"
                    style={{ top: dot.top, left: dot.left }}
                    onMouseEnter={() => setRiskTip(dot.tip)}
                    onFocus={() => setRiskTip(dot.tip)}
                    onClick={() => setRiskTip(dot.tip)}
                    aria-label="风险点"
                  />
                ))}
                <AnimatePresence>
                  {riskTip ? (
                    <motion.div
                      className="tuning-risk-callout glass-card"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.22 }}
                    >
                      {riskTip}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </>
            ) : null}
          </div>

          <nav className="tuning-views" role="tablist" aria-label="视角切换">
            {VIEWS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={view === item.key}
                className={`tuning-views__btn ${view === item.key ? 'is-active' : ''}`}
                onClick={() => {
                  setView(item.key);
                  setRiskTip(null);
                }}
              >
                {view === item.key ? (
                  <motion.span
                    layoutId="tuning-view-pill"
                    className="tuning-views__pill"
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                  />
                ) : null}
                <span className="tuning-views__label">{item.label}</span>
              </button>
            ))}
          </nav>

          <label className="tuning-hand-toggle">
            <span>显示手部</span>
            <input
              type="checkbox"
              checked={showHand}
              disabled={view === 'hand' || view === 'risk'}
              onChange={(e) => setShowHand(e.currentTarget.checked)}
            />
            <span className="tuning-hand-toggle__track">
              <span className="tuning-hand-toggle__thumb" />
            </span>
          </label>
        </section>

        <aside className="tuning-panel glass-card">
          <div className="tuning-panel__inner">
          <header className="tuning-panel__head">
            <h1>参数微调</h1>
            <div className="tuning-panel__actions">
              <button
                type="button"
                className={`tuning-panel__update ${hasPendingModelUpdate ? 'is-dirty' : ''}`}
                onClick={commitModelUpdate}
              >
                方案更新
              </button>
              <button type="button" className="tuning-panel__save" onClick={saveTuningScheme}>
                方案保存
              </button>
            </div>
          </header>

          <Section title="基本尺寸" count={4} open>
            <RangeRow label="宽度" value={draftCustom.width} min={60} max={85} step={0.1} unit="mm" ideal={ideal.width} onChange={updateWidth} />
            <RangeRow label="长宽比" value={aspectRatio} min={1.75} max={2.3} step={0.01} unit="" ideal={idealAspectRatio} decimals={2} onChange={updateAspectRatio} />
            <RangeRow label="厚度" value={draftCustom.thickness} min={6} max={11} step={0.1} unit="mm" ideal={ideal.thickness} onChange={(v) => updateCustom({ thickness: v })} />
            <RangeRow label="重量" value={draftCustom.weight} min={120} max={260} step={1} unit="g" ideal={ideal.weight} onChange={(v) => updateCustom({ weight: v })} />
          </Section>

          <Section title="功能部件（后摄像头模组）" count={3} open={view === 'back' || view === 'risk'}>
            <RangeRow label="镜头凸起" value={draftCustom.cameraBump} min={0.8} max={5.5} step={0.1} unit="mm" ideal={ideal.cameraBump} onChange={(v) => updateCustom({ cameraBump: v })} />
            <ChoiceRow label="后摄位置" value={cameraSide} options={['左上', '居中', '右上']} onChange={setCameraSide} />
          </Section>

          <Section title="形态曲率" count={4}>
            <RangeRow label="四边圆角" value={draftCustom.cornerRadius} min={2} max={20} step={0.5} unit="R" ideal={ideal.cornerRadius} onChange={(v) => updateCustom({ cornerRadius: v })} />
            <RangeRow label="侧边弧度" value={draftCustom.sideArc} min={0} max={3} step={0.1} unit="mm" ideal={3} onChange={(v) => updateCustom({ sideArc: v })} />
            <RangeRow label="背面弧度" value={draftCustom.backArc} min={0} max={100} step={1} unit="%" ideal={ideal.backArc} onChange={(v) => updateCustom({ backArc: v })} />
            <ChoiceRow label="边缘过渡" value={cornerStyle} options={['生硬过渡', '柔和过渡', '圆弧过渡']} onChange={setCornerStyle} />
          </Section>

          <Section title="整机平衡" count={1}>
            <RangeRow label="重心偏移" value={draftCustom.centerOfMassOffset} min={0} max={10} step={0.1} unit="mm" ideal={ideal.centerOfMassOffset} onChange={(v) => updateCustom({ centerOfMassOffset: v })} />
          </Section>

          <ToggleRow
            label="显示风险热区"
            helper="打开后可查看掌根 / 食指支撑 / 镜头凸起的压力点"
            checked={view === 'risk'}
            onChange={(checked) => {
              setView(checked ? 'risk' : 'front');
              setRiskTip(null);
            }}
          />
          </div>
        </aside>
      </main>
    </div>
  );
}

function Section({ title, count, open = false, children }: { title: string; count: number; open?: boolean; children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(open);
  return (
    <section className={`tuning-section ${isOpen ? 'is-open' : ''}`}>
      <button type="button" className="tuning-section__head" onClick={() => setOpen((v) => !v)}>
        <h2>{title}</h2>
        <span className="tuning-section__meta">
          {count} 项
          <ChevronDown size={13} strokeWidth={1.8} className="tuning-section__chevron" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            className="tuning-section__reveal"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="tuning-section__body">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

// 最优解分布条：依据用户生理数据派生的理想值，用一排绿色小柱体大致标出最优区间
// （实验限制下只能对几个数据点做粗略推荐，故呈"柱状分布"而非连续曲线）
function DistributionBar({ ideal, min, max }: { ideal: number; min: number; max: number }) {
  const N = 9;
  const idealPos = Math.min(1, Math.max(0, (ideal - min) / (max - min)));
  return (
    <div className="tuning-dist" aria-hidden>
      {Array.from({ length: N }).map((_, i) => {
        const center = (i + 0.5) / N;
        const closeness = Math.exp(-(((center - idealPos) / 0.17) ** 2)); // 0..1 越接近理想越高
        const height = 4 + closeness * 14;
        const level = closeness > 0.72 ? 'peak' : closeness > 0.42 ? 'near' : closeness > 0.18 ? 'mid' : 'far';
        return (
          <span key={i} className={`tuning-dist__bar is-${level}`} style={{ height: `${height.toFixed(1)}px` }} />
        );
      })}
    </div>
  );
}

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  ideal,
  decimals: decimalsOverride,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  ideal: number;
  decimals?: number;
  onChange: (v: number) => void;
}) {
  const valueMarker = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const decimals = decimalsOverride ?? (unit === 'g' || unit === '%' ? 0 : 1);

  const valueFromClientX = (clientX: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    const stepped = min + Math.round((raw - min) / step) * step;
    return Number(Math.min(max, Math.max(min, stepped)).toFixed(3));
  };

  const handleTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const track = event.currentTarget;
    onChange(valueFromClientX(event.clientX, track));
    event.preventDefault();

    const handlePointerMove = (moveEvent: PointerEvent) => {
      onChange(valueFromClientX(moveEvent.clientX, track));
    };
    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
  };

  return (
    <div className="tuning-range">
      <div className="tuning-range__head">
        <span>{label}{unit ? `(${unit})` : ''}</span>
        <strong>{value.toFixed(decimals)}</strong>
      </div>
      <div className="tuning-range__viz" onPointerDown={handleTrackPointerDown}>
        <DistributionBar ideal={ideal} min={min} max={max} />
        <span className="tuning-range__line" />
        <input
          type="range"
          className="tuning-range__input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.currentTarget.valueAsNumber)}
          aria-label={label}
        />
        <span className="tuning-range__thumb" style={{ left: `${valueMarker}%` }} />
      </div>
      <div className="tuning-range__foot">
        <span>MIN {min}</span>
        <span>MAX {max}</span>
      </div>
    </div>
  );
}

function ChoiceRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="tuning-choice">
      <p>{label}</p>
      <div className="tuning-choice__group">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={value === opt ? 'is-active' : ''}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({ label, helper, checked, onChange }: { label: string; helper?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="tuning-toggle">
      <div>
        <span>{label}</span>
        {helper ? <small>{helper}</small> : null}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
      <span className="tuning-toggle__track">
        <span className="tuning-toggle__thumb" />
      </span>
    </label>
  );
}
