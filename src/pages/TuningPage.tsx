import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Move3D, ZoomIn, Save } from 'lucide-react';
import ReportSubnav from '../components/ReportSubnav';
import { useFlowState } from '../hooks/useFlowState';
import { deriveIdealSpec, scorePhoneForHand } from '../data/scoring';
import type { Phone } from '../data/phones';
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

  // 把 custom 包装成 Phone 形状，喂给 scoring
  const customPhone: Phone = useMemo(() => ({
    id: 'custom',
    name: '自定义方案',
    brand: '自定义',
    releaseDate: '2025-01',
    price: 0,
    width: flow.custom.width,
    height: flow.custom.height,
    thickness: flow.custom.thickness,
    weight: flow.custom.weight,
    screen: 6.2,
    ratio: '19.5:9',
    cameraBump: flow.custom.cameraBump,
    cornerRadius: flow.custom.cornerRadius,
    centerOfMassOffset: flow.custom.centerOfMassOffset,
    backArc: flow.custom.backArc,
    rearCamera: '',
    battery: '',
    imageUrl: '',
    color: 'graphite',
  }), [flow.custom]);

  const score = useMemo(
    () => scorePhoneForHand(customPhone, flow.handLength, flow.handWidth),
    [customPhone, flow.handLength, flow.handWidth],
  );
  const ideal = useMemo(
    () => deriveIdealSpec(flow.handLength, flow.handWidth),
    [flow.handLength, flow.handWidth],
  );

  const handVisible = showHand || view === 'hand' || view === 'risk';

  const updateCustom = (patch: Partial<typeof flow.custom>) => {
    updateFlow({ custom: { ...flow.custom, ...patch } });
  };

  return (
    <div className="tuning-page">
      <ReportSubnav />

      <main className="tuning-page__main">
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

          <div className={`tuning-device tuning-device--${view} ${handVisible ? 'is-hand-visible' : ''}`}>
            <div className="tuning-device__phone">
              {view === 'back' || view === 'risk' ? (
                <div className="tuning-device__camera">
                  <span /><span /><span />
                  <em>{flow.custom.cameraBump.toFixed(1)} mm</em>
                </div>
              ) : (
                <div className="tuning-device__screen">
                  <span>{flow.custom.width.toFixed(1)} × {flow.custom.height.toFixed(1)} mm</span>
                </div>
              )}
            </div>

            {handVisible ? (
              <img className="tuning-device__hand" src="/assets/hero-phone-cut.png" alt="" />
            ) : null}

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
                {item.label}
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
          <header className="tuning-panel__head">
            <h1>参数微调</h1>
            <button type="button" className="glass-button" onClick={() => navigate('/report')}>
              <Save size={13} strokeWidth={1.7} />
              方案保存
            </button>
          </header>

          <Section title="基本尺寸" count={4} open>
            <RangeRow label="宽度" value={flow.custom.width} min={60} max={85} step={0.1} unit="mm" ideal={ideal.width} onChange={(v) => updateCustom({ width: v })} />
            <RangeRow label="高度" value={flow.custom.height} min={120} max={180} step={0.1} unit="mm" ideal={ideal.height} onChange={(v) => updateCustom({ height: v })} />
            <RangeRow label="厚度" value={flow.custom.thickness} min={6} max={11} step={0.1} unit="mm" ideal={ideal.thickness} onChange={(v) => updateCustom({ thickness: v })} />
            <RangeRow label="重量" value={flow.custom.weight} min={120} max={260} step={1} unit="g" ideal={ideal.weight} onChange={(v) => updateCustom({ weight: v })} />
          </Section>

          <Section title="功能部件（后摄像头模组）" count={3} open={view === 'back' || view === 'risk'}>
            <RangeRow label="镜头凸起" value={flow.custom.cameraBump} min={0.8} max={5.5} step={0.1} unit="mm" ideal={ideal.cameraBump} onChange={(v) => updateCustom({ cameraBump: v })} />
            <ChoiceRow label="后摄位置" value={cameraSide} options={['左上', '居中', '右上']} onChange={setCameraSide} />
          </Section>

          <Section title="形态曲率" count={3}>
            <RangeRow label="四边圆角" value={flow.custom.cornerRadius} min={2} max={20} step={0.5} unit="R" ideal={ideal.cornerRadius} onChange={(v) => updateCustom({ cornerRadius: v })} />
            <RangeRow label="背面弧度" value={flow.custom.backArc} min={0} max={100} step={1} unit="%" ideal={ideal.backArc} onChange={(v) => updateCustom({ backArc: v })} />
            <ChoiceRow label="边缘过渡" value={cornerStyle} options={['生硬过渡', '柔和过渡', '圆弧过渡']} onChange={setCornerStyle} />
          </Section>

          <Section title="整机平衡" count={1}>
            <RangeRow label="重心偏移" value={flow.custom.centerOfMassOffset} min={0} max={10} step={0.1} unit="mm" ideal={ideal.centerOfMassOffset} onChange={(v) => updateCustom({ centerOfMassOffset: v })} />
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
        <span>{count} 项</span>
      </button>
      {isOpen ? <div className="tuning-section__body">{children}</div> : null}
    </section>
  );
}

function RangeRow({ label, value, min, max, step, unit, ideal, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; ideal: number; onChange: (v: number) => void }) {
  const idealMarker = Math.min(100, Math.max(0, ((ideal - min) / (max - min)) * 100));
  const valueMarker = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="tuning-range">
      <div className="tuning-range__head">
        <span>{label}</span>
        <strong>{value.toFixed(unit === 'g' || unit === '%' ? 0 : 1)}<small>{unit}</small></strong>
      </div>
      <div className="tuning-range__track">
        <span className="tuning-range__fill" style={{ width: `${valueMarker}%` }} />
        <span className="tuning-range__ideal" style={{ left: `${idealMarker}%` }} title={`理想 ${ideal.toFixed(1)}${unit}`} />
        <input
          type="range"
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
        <span>MIN {min}{unit}</span>
        <span>MAX {max}{unit}</span>
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
