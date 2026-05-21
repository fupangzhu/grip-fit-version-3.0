import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, AlertTriangle, AlertCircle, Check } from 'lucide-react';
import { useFlowState } from '../hooks/useFlowState';
import { scorePhoneForHand, type PerDimScore } from '../data/scoring';
import { dimensionGroupLabels } from '../data/dimensions';
import type { Phone } from '../data/phones';
import './ReportPage.css';

const STATUS_ORDER = { risk: 0, warn: 1, good: 2 } as const;

export default function ReportPage() {
  const navigate = useNavigate();
  const [flow] = useFlowState();
  const [category, setCategory] = useState('全部');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState('');

  const customPhone: Phone = useMemo(() => ({
    id: 'custom', name: '自定义方案 A', brand: '自定义', releaseDate: '2025-01', price: 0,
    width: flow.custom.width, height: flow.custom.height, thickness: flow.custom.thickness, weight: flow.custom.weight,
    screen: 6.2, ratio: '19.5:9',
    cameraBump: flow.custom.cameraBump, cornerRadius: flow.custom.cornerRadius,
    centerOfMassOffset: flow.custom.centerOfMassOffset, backArc: flow.custom.backArc,
    rearCamera: '', battery: '', imageUrl: '', color: 'graphite',
  }), [flow.custom]);

  const score = useMemo(
    () => scorePhoneForHand(customPhone, flow.handLength, flow.handWidth),
    [customPhone, flow.handLength, flow.handWidth],
  );

  // 排序：risk → warn → good，相同 status 按权重降序
  const sortedDims = useMemo(() => {
    return [...score.perDim].sort((a, b) => {
      const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (s !== 0) return s;
      return b.def.weight - a.def.weight;
    });
  }, [score.perDim]);

  const filteredDims = useMemo(() => {
    if (category === '全部') return sortedDims;
    return sortedDims.filter((d) => d.def.group === category);
  }, [sortedDims, category]);

  const riskCount = score.perDim.filter((d) => d.status === 'risk').length;
  const warnCount = score.perDim.filter((d) => d.status === 'warn').length;
  const attention = riskCount + warnCount;
  const goodCount = score.perDim.filter((d) => d.status === 'good').length;

  const toggle = (id: string) => setExpanded((curr) => {
    const next = new Set(curr);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const onExport = () => {
    setToast('报告导出功能即将上线，敬请期待');
    window.setTimeout(() => setToast(''), 2200);
  };

  return (
    <div className="report-page">
      <header className="report-page__title-row">
        <div>
          <h1>手感报告详情</h1>
          <p>评估对象：自定义方案 A · 基于 GB/T 10000-1988 + AHP 层次分析法</p>
        </div>
        <div className="report-page__title-actions">
          <select
            className="report-page__filter glass-pill"
            value={category}
            onChange={(e) => setCategory(e.currentTarget.value)}
          >
            {dimensionGroupLabels.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <motion.button
            type="button"
            className="report-page__primary"
            onClick={onExport}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
          >
            <Download size={14} strokeWidth={1.8} />
            导出报告
          </motion.button>
        </div>
      </header>

      <section className="report-summary">
        <div className="report-summary__score">
          <div className="score-ring" style={{ ['--score-deg' as never]: `${score.total * 36}deg` }}>
            <div className="score-ring__inner">
              <strong>{score.total.toFixed(1)}</strong>
              <span>/10</span>
            </div>
          </div>
          <p>综合评分</p>
        </div>
        <div className="report-summary__stat report-summary__stat--risk">
          <AlertTriangle size={20} strokeWidth={1.6} />
          <div>
            <strong>{attention}</strong>
            <span>需关注项 · 中高风险</span>
          </div>
        </div>
        <div className="report-summary__stat report-summary__stat--good">
          <Check size={20} strokeWidth={1.8} />
          <div>
            <strong>{goodCount}</strong>
            <span>良好项 · 表现良好</span>
          </div>
        </div>
        <button type="button" className="report-summary__nav glass-button" onClick={() => navigate('/tuning')}>
          回到参数微调 →
        </button>
      </section>

      <section className="report-table" aria-label="18 维度评分表">
        <div className="report-table__head">
          <span>维度</span>
          <span>当前值</span>
          <span>评分 / 10</span>
          <span>AHP 权重</span>
          <span>操作</span>
        </div>
        {filteredDims.map((row, index) => (
          <ReportRow key={row.def.id} row={row} index={index} expanded={expanded.has(row.def.id)} onToggle={() => toggle(row.def.id)} />
        ))}
      </section>

      <AnimatePresence>
        {toast ? (
          <motion.div
            className="report-toast glass-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ReportRow({ row, index, expanded, onToggle }: { row: PerDimScore; index: number; expanded: boolean; onToggle: () => void }) {
  const StatusIcon = row.status === 'risk' ? AlertTriangle : row.status === 'warn' ? AlertCircle : Check;
  return (
    <article className={`report-row report-row--${row.status} ${expanded ? 'is-expanded' : ''}`}>
      <div className="report-row__line">
        <div className="report-row__name">
          <span className="report-row__index">{String(index + 1).padStart(2, '0')}</span>
          <StatusIcon size={14} strokeWidth={1.8} className="report-row__status-icon" />
          <strong>{row.def.name}</strong>
          <em>{row.def.group}</em>
        </div>
        <div className="report-row__value">
          {typeof row.actual === 'number' ? row.actual.toFixed(1) : row.actual}
          {row.def.unit && typeof row.actual === 'number' ? <small> {row.def.unit}</small> : null}
        </div>
        <div className="report-row__score">
          <strong>{row.score.toFixed(1)}</strong>
          <span className="report-row__score-bar">
            <span style={{ width: `${row.score * 10}%` }} />
          </span>
        </div>
        <div className="report-row__weight">{(row.def.weight * 100).toFixed(1)}%</div>
        <button type="button" className="report-row__toggle" onClick={onToggle} aria-expanded={expanded}>
          <ChevronDown size={16} strokeWidth={1.7} />
        </button>
      </div>

      <AnimatePresence>
        {expanded ? (
          <motion.div
            className="report-row__detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="report-row__detail-inner">
              <div className="report-row__advice">
                <h3>评估说明</h3>
                <p>{row.def.advice}</p>
              </div>
              <div className="report-row__curve">
                <h3>评分响应曲线</h3>
                <ResponseCurve percent={row.def.curve} status={row.status} />
              </div>
              <div className="report-row__optim">
                <h3>优化建议</h3>
                <ul>
                  <li>推荐区间：<b>{row.def.optimum}</b></li>
                  <li>当前值：<b>{typeof row.actual === 'number' ? `${row.actual.toFixed(1)} ${row.def.unit}` : row.actual}</b></li>
                  <li>理想值：<b>{typeof row.ideal === 'number' ? `${row.ideal.toFixed(1)} ${row.def.unit}` : row.ideal}</b></li>
                </ul>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}

function ResponseCurve({ percent, status }: { percent: number; status: 'risk' | 'warn' | 'good' }) {
  const color = status === 'risk' ? '#ff6f6f' : status === 'warn' ? '#ffb060' : '#7adba0';
  return (
    <div className="response-curve" style={{ ['--curve-color' as never]: color }}>
      <svg viewBox="0 0 280 90" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={`curve-fill-${percent}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 10 78 C 70 78 90 18 140 18 C 190 18 210 78 270 78" fill="none" stroke={color} strokeWidth="2" />
        <path d="M 10 78 C 70 78 90 18 140 18 C 190 18 210 78 270 78 L 270 88 L 10 88 Z" fill={`url(#curve-fill-${percent})`} />
        <line x1={`${percent}%`} x2={`${percent}%`} y1="6" y2="84" stroke={color} strokeDasharray="2 2" strokeWidth="1.2" />
        <circle cx={`${percent}%`} cy="48" r="3.2" fill={color} />
      </svg>
      <small>P{percent} (Current)</small>
    </div>
  );
}
