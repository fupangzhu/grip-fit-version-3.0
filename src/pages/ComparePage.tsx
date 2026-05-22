import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Download, FileText, Image as ImageIcon, Link2 } from 'lucide-react';
import { useFlowState } from '../hooks/useFlowState';
import { scorePhoneForHand, deriveIdealSpec } from '../data/scoring';
import { phones, type Phone } from '../data/phones';
import PhoneVisual from '../components/PhoneVisual';
import './ComparePage.css';

type ExportFormat = 'pdf' | 'image' | 'link';

export default function ComparePage() {
  const navigate = useNavigate();
  const [flow, updateFlow] = useFlowState();
  const [mode, setMode] = useState<'edit' | 'result'>(() => flow.compareIds.length >= 2 ? 'result' : 'edit');
  const [includeIdeal, setIncludeIdeal] = useState(true);
  const [showDetail, setShowDetail] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState('');

  const selectedPhones = useMemo(
    () => flow.compareIds.map((id) => phones.find((p) => p.id === id)).filter(Boolean) as Phone[],
    [flow.compareIds],
  );

  const removePhone = (id: string) => {
    updateFlow({ compareIds: flow.compareIds.filter((x) => x !== id) });
  };

  const generate = () => {
    if (selectedPhones.length < 2) {
      setToast('至少选择 2 款机型才能生成对比报告');
      window.setTimeout(() => setToast(''), 1800);
      return;
    }
    setMode('result');
  };

  // Empty state
  if (selectedPhones.length === 0) {
    return (
      <div className="compare-page">
        <section className="compare-empty">
          <div className="compare-empty__icons">
            <span /><span /><span />
          </div>
          <h1>还没有要对比的机型</h1>
          <p>添加 2-3 款手机，生成基于你手部数据的横向对比报告。</p>
          <button type="button" className="compare-empty__cta" onClick={() => navigate('/library')}>
            去探索机型库 →
          </button>
        </section>
      </div>
    );
  }

  // Edit state - shopping cart of selected phones
  if (mode === 'edit') {
    return (
      <div className="compare-page">
        <header className="compare-head">
          <div>
            <h1>对比清单 <em>{selectedPhones.length} / 3</em></h1>
            <p>添加 2-3 款手机，生成基于你手部数据的横向对比报告。</p>
          </div>
          <button
            type="button"
            className="compare-head__primary"
            onClick={generate}
            disabled={selectedPhones.length < 2}
          >
            生成对比报告 →
          </button>
        </header>

        <section className="compare-cards">
          {selectedPhones.map((phone, index) => (
            <motion.article
              key={phone.id}
              className="compare-card glass-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.32 }}
            >
              <button type="button" className="compare-card__close" onClick={() => removePhone(phone.id)} aria-label="移除">
                <X size={14} strokeWidth={1.8} />
              </button>
              <ComparePhoneMock phone={phone} size="sm" />
              <h2>{phone.name}</h2>
              <p>{phone.releaseDate}</p>
              <CompareMiniStats phone={phone} />
            </motion.article>
          ))}
          {selectedPhones.length < 3 ? (
            <button type="button" className="compare-card-add" onClick={() => navigate('/library')}>
              <Plus size={28} strokeWidth={1.5} />
              <span>添加机型</span>
            </button>
          ) : null}
        </section>

        <section className="compare-options">
          <CompareToggle label="包含我的最优模型作为基准线" checked={includeIdeal} onChange={setIncludeIdeal} />
          <CompareToggle label="显示详细 18 维度评分" checked={showDetail} onChange={setShowDetail} />
        </section>

        <AnimatePresence>
          {toast ? (
            <motion.div className="compare-toast glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {toast}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  // Result state
  return (
    <div className="compare-page">
      <CompareReport
        phones={selectedPhones}
        handLength={flow.handLength}
        handWidth={flow.handWidth}
        includeIdeal={includeIdeal}
        showDetail={showDetail}
        onEdit={() => setMode('edit')}
        onExport={() => setExportOpen(true)}
      />
      <AnimatePresence>
        {exportOpen ? <ExportDialog onClose={() => setExportOpen(false)} /> : null}
      </AnimatePresence>
    </div>
  );
}

function CompareToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="compare-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
      <span className="compare-toggle__track">
        <span className="compare-toggle__thumb" />
      </span>
    </label>
  );
}

function ComparePhoneMock({ phone, size = 'md' }: { phone: Phone; size?: 'sm' | 'md' }) {
  return <PhoneVisual phone={phone} size={size} />;
}

function CompareMiniStats({ phone }: { phone: Phone }) {
  const [flow] = useFlowState();
  const score = scorePhoneForHand(phone, flow.handLength, flow.handWidth);
  return (
    <div className="compare-card__stats">
      <div><span>评分</span><strong>{score.total.toFixed(1)}</strong><em>/10</em></div>
      <div><span>匹配</span><strong>{(score.match / 10).toFixed(1)}</strong><em>/10</em></div>
    </div>
  );
}

function CompareReport({
  phones: list, handLength, handWidth, includeIdeal, showDetail, onEdit, onExport,
}: {
  phones: Phone[]; handLength: number; handWidth: number;
  includeIdeal: boolean; showDetail: boolean;
  onEdit: () => void; onExport: () => void;
}) {
  const scores = useMemo(() => list.map((p) => scorePhoneForHand(p, handLength, handWidth)), [list, handLength, handWidth]);
  const ideal = useMemo(() => deriveIdealSpec(handLength, handWidth), [handLength, handWidth]);
  const idealTotal = 9.1;

  // Pick 5 core dimensions to highlight
  const coreDimIds = ['width', 'weight', 'thickness', 'thumb-reach', 'balance'];

  return (
    <>
      <header className="compare-report__head">
        <h1>对比报告</h1>
        <div>
          <button type="button" className="compare-report__edit" onClick={onEdit}>← 编辑对比清单</button>
          <button type="button" className="compare-report__export" onClick={onExport}>
            <Download size={13} strokeWidth={1.8} />
            导出报告
          </button>
        </div>
      </header>

      <section className="compare-report__strip">
        {includeIdeal ? (
          <div className="compare-strip-item compare-strip-item--ideal">
            <div className="compare-strip-item__device" />
            <span>我的最优</span>
            <strong>{idealTotal.toFixed(1)}</strong>
            <em>/10</em>
          </div>
        ) : null}
        {list.map((phone, i) => (
          <div className="compare-strip-item" key={phone.id}>
            <ComparePhoneMock phone={phone} size="sm" />
            <span>{phone.name}</span>
            <strong>{scores[i].total.toFixed(1)}</strong>
            <em>/10</em>
          </div>
        ))}
      </section>

      <div className="compare-report__grid">
        <article className="compare-card-block glass-card">
          <h2>综合评分对比</h2>
          <div className="compare-bars">
            {includeIdeal ? <BarItem label="我的最优" value={idealTotal} tone="ideal" /> : null}
            {list.map((p, i) => <BarItem key={p.id} label={p.name} value={scores[i].total} tone={i === 0 ? 'primary' : 'secondary'} />)}
          </div>
        </article>

        <article className="compare-card-block glass-card">
          <h2>核心 5 项评分对比</h2>
          <div className="compare-scores">
            {coreDimIds.map((id) => {
              const rows = list.map((_, i) => scores[i].perDim.find((d) => d.def.id === id));
              const def = rows[0]?.def;
              if (!def) return null;
              return (
                <div className="compare-scores__row" key={id}>
                  <span>{def.name}</span>
                  {rows.map((row, i) => (
                    <div key={i} className={`compare-scores__bar compare-scores__bar--${i}`}>
                      <span style={{ width: `${(row?.score ?? 0) * 10}%` }} />
                      <b>{row?.score.toFixed(1)}</b>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </article>

        {showDetail ? (
          <article className="compare-card-block glass-card compare-card-block--wide">
            <h2>18 维度逐项评分</h2>
            <div className="compare-dim-table">
              <div className="compare-dim-table__head">
                <span>维度</span>
                {list.map((p) => <span key={p.id}>{p.name}</span>)}
              </div>
              {scores[0].perDim.map((row0, idx) => (
                <div className="compare-dim-table__row" key={row0.def.id}>
                  <span>{row0.def.name}</span>
                  {list.map((_, i) => {
                    const score = scores[i].perDim[idx];
                    return <em key={i} className={`compare-dim-score compare-dim-score--${score.status}`}>{score.score.toFixed(1)}</em>;
                  })}
                </div>
              ))}
            </div>
          </article>
        ) : null}

        <article className="compare-card-block glass-card compare-card-block--wide">
          <h2>详细参数对照</h2>
          <div className="compare-spec-table">
            <div className="compare-spec-table__head">
              <span>参数</span>
              {includeIdeal ? <span>我的最优</span> : null}
              {list.map((p) => <span key={p.id}>{p.name}</span>)}
            </div>
            {[
              { label: '机身宽度', ideal: `${ideal.width.toFixed(1)} mm`, get: (p: Phone) => `${p.width.toFixed(1)} mm` },
              { label: '机身高度', ideal: `${ideal.height.toFixed(1)} mm`, get: (p: Phone) => `${p.height.toFixed(1)} mm` },
              { label: '机身厚度', ideal: `${ideal.thickness.toFixed(1)} mm`, get: (p: Phone) => `${p.thickness.toFixed(1)} mm` },
              { label: '重量', ideal: `${ideal.weight.toFixed(0)} g`, get: (p: Phone) => `${p.weight} g` },
              { label: '屏幕尺寸', ideal: `${ideal.screen.toFixed(1)} 英寸`, get: (p: Phone) => `${p.screen} 英寸` },
              { label: '镜头凸起', ideal: `${ideal.cameraBump.toFixed(1)} mm`, get: (p: Phone) => `${p.cameraBump.toFixed(1)} mm` },
              { label: '四边圆角', ideal: `R${ideal.cornerRadius.toFixed(1)}`, get: (p: Phone) => `R${p.cornerRadius.toFixed(1)}` },
              { label: '电池', ideal: '—', get: (p: Phone) => p.battery },
            ].map((row) => (
              <div className="compare-spec-table__row" key={row.label}>
                <span>{row.label}</span>
                {includeIdeal ? <strong className="compare-spec-table__ideal">{row.ideal}</strong> : null}
                {list.map((p) => <strong key={p.id}>{row.get(p)}</strong>)}
              </div>
            ))}
          </div>
        </article>
      </div>

      <footer className="compare-report__best">
        <strong>您的最佳匹配</strong>
        <p>基于你的手部数据，<b>{list[scores.findIndex((s) => s.total === Math.max(...scores.map((x) => x.total)))]?.name}</b> 的握持匹配度最高（<b>{Math.max(...scores.map((s) => s.total)).toFixed(1)}</b> / 10）</p>
      </footer>
    </>
  );
}

function BarItem({ label, value, tone }: { label: string; value: number; tone: 'ideal' | 'primary' | 'secondary' }) {
  return (
    <div className={`compare-bar compare-bar--${tone}`}>
      <span>{label}</span>
      <div className="compare-bar__bar"><span style={{ width: `${value * 10}%` }} /></div>
      <strong>{value.toFixed(1)}</strong>
    </div>
  );
}

function ExportDialog({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [includeSpecs, setIncludeSpecs] = useState(true);
  const [includeDim, setIncludeDim] = useState(true);
  const [done, setDone] = useState('');
  const formats: { key: ExportFormat; icon: typeof FileText; tag: string; label: string }[] = [
    { key: 'pdf', icon: FileText, tag: 'PDF', label: '保存为 PDF' },
    { key: 'image', icon: ImageIcon, tag: 'IMG', label: '生成长图' },
    { key: 'link', icon: Link2, tag: 'LINK', label: '复制分享链接' },
  ];

  return (
    <>
      <motion.div className="compare-export-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="compare-export glass-card" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}>
        <button type="button" className="compare-export__close" onClick={onClose} aria-label="关闭"><X size={16} strokeWidth={1.8} /></button>
        <h2>导出对比报告</h2>
        <p>选择导出格式，报告将基于当前对比内容生成。</p>
        <div className="compare-export__formats">
          {formats.map((item) => {
            const Icon = item.icon;
            return (
              <label key={item.key} className={`compare-export__format ${format === item.key ? 'is-selected' : ''}`}>
                <span className="compare-export__format-tag"><Icon size={14} strokeWidth={1.8} />{item.tag}</span>
                <strong>{item.label}</strong>
                <input type="radio" name="export-format" checked={format === item.key} onChange={() => setFormat(item.key)} />
              </label>
            );
          })}
        </div>
        <div className="compare-export__checks">
          <label><input type="checkbox" checked={includeDim} onChange={(e) => setIncludeDim(e.currentTarget.checked)} /> 综合评分对比</label>
          <label><input type="checkbox" checked={includeDim} onChange={(e) => setIncludeDim(e.currentTarget.checked)} /> 逐维度详细评分</label>
          <label><input type="checkbox" checked={includeSpecs} onChange={(e) => setIncludeSpecs(e.currentTarget.checked)} /> 完整规格参数表</label>
        </div>
        {done ? <p className="compare-export__done">{done}</p> : null}
        <div className="compare-export__actions">
          <button type="button" onClick={onClose}>取消</button>
          <button type="button" className="compare-export__do" onClick={() => setDone(`已生成 ${format.toUpperCase()} 报告 · 演示版`)}>
            导出报告
          </button>
        </div>
      </motion.div>
    </>
  );
}
