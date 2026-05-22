import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, Plus, ChevronRight } from 'lucide-react';
import { useFlowState } from '../hooks/useFlowState';
import { scorePhoneForHand } from '../data/scoring';
import { phones } from '../data/phones';
import { dimensionGroups } from '../data/dimensions';
import PhoneVisual from '../components/PhoneVisual';
import './PhoneDetailPage.css';

export default function PhoneDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flow, updateFlow] = useFlowState();
  const phone = phones.find((p) => p.id === id) ?? phones[0];
  const score = useMemo(
    () => scorePhoneForHand(phone, flow.handLength, flow.handWidth),
    [phone, flow.handLength, flow.handWidth],
  );
  const [activeGroup, setActiveGroup] = useState<string>(dimensionGroups[0]);
  const inCompare = flow.compareIds.includes(phone.id);
  const isFav = flow.favoriteIds.includes(phone.id);

  const dimsInGroup = score.perDim.filter((d) => d.def.group === activeGroup);

  const toggleCompare = () => {
    const cur = inCompare
      ? flow.compareIds.filter((x) => x !== phone.id)
      : flow.compareIds.length >= 3 ? flow.compareIds : [...flow.compareIds, phone.id];
    updateFlow({ compareIds: cur });
  };

  return (
    <div className="phone-detail-page">
      <button type="button" className="phone-detail__back" onClick={() => navigate('/library')}>
        <ChevronLeft size={14} strokeWidth={1.8} /> D3 — 机型详情页
      </button>

      <div className="phone-detail__grid">
        <article className="phone-detail__hero glass-card">
          <div className="phone-detail__device">
            <PhoneVisual phone={phone} size="lg" />
          </div>
          <div className="phone-detail__hero-info">
            <p className="phone-detail__brand">{phone.brand}</p>
            <h1>{phone.name}</h1>
            <span className="phone-detail__date">{phone.releaseDate}</span>
            <strong className="phone-detail__price">¥{phone.price.toLocaleString()}</strong>
            <div className="phone-detail__hero-actions">
              <button type="button" className={`phone-detail__btn ${inCompare ? 'is-active' : ''}`} onClick={toggleCompare}>
                <Plus size={13} strokeWidth={1.8} /> {inCompare ? '已加入对比' : '加入对比'}
              </button>
              <button type="button" className="phone-detail__btn-link" onClick={() => navigate('/report')}>
                查看风险详情 →
              </button>
              <button
                type="button"
                className={`phone-detail__fav ${isFav ? 'is-active' : ''}`}
                onClick={() => updateFlow({ favoriteIds: isFav ? flow.favoriteIds.filter((x) => x !== phone.id) : [...flow.favoriteIds, phone.id] })}
                aria-label="收藏"
              >
                <Star size={14} strokeWidth={1.6} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
          <div className="phone-detail__hero-rings">
            <ScoreCircle value={score.total} label="握持评分" tone="blue" />
            <ScoreCircle value={score.match / 10} label="匹配度" tone="green" />
          </div>
        </article>

        <aside className="phone-detail__grip glass-card">
          <h2>握持表现概览</h2>
          {[
            { label: '单手握持', value: score.total },
            { label: '拇指可达性', value: Math.max(0, score.total - 0.5) },
            { label: '长时舒适度', value: Math.max(0, score.total - 0.8) },
          ].map((row) => (
            <div key={row.label} className="phone-detail__grip-row">
              <span>{row.label}</span>
              <strong>{row.value.toFixed(1)}<small>/10</small></strong>
              <span className="phone-detail__grip-bar"><span style={{ width: `${row.value * 10}%` }} /></span>
            </div>
          ))}
        </aside>

        <article className="phone-detail__params glass-card">
          <h2>参数对照</h2>
          {[
            ['宽度', `${phone.width.toFixed(1)} mm`],
            ['高度', `${phone.height.toFixed(1)} mm`],
            ['厚度', `${phone.thickness.toFixed(1)} mm`],
            ['重量', `${phone.weight} g`],
            ['屏幕尺寸', `${phone.screen} 英寸`],
            ['长宽比', phone.ratio],
            ['镜头凸起', `${phone.cameraBump.toFixed(1)} mm`],
            ['四边圆角', `R${phone.cornerRadius.toFixed(1)}`],
            ['背面弧度', `${phone.backArc}%`],
            ['重心偏移', `${phone.centerOfMassOffset.toFixed(1)} mm`],
          ].map(([k, v]) => (
            <div key={k} className="phone-detail__params-row">
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </article>

        <article className="phone-detail__dim glass-card">
          <h2>18 维度逐项评分</h2>
          <nav className="phone-detail__dim-tabs">
            {dimensionGroups.map((g) => (
              <button key={g} type="button" className={activeGroup === g ? 'is-active' : ''} onClick={() => setActiveGroup(g)}>
                {g}<ChevronRight size={12} strokeWidth={1.8} />
              </button>
            ))}
          </nav>
          <div className="phone-detail__dim-list">
            {dimsInGroup.map((d) => (
              <motion.section
                key={d.def.id}
                className={`phone-detail__dim-row phone-detail__dim-row--${d.status}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <strong>{d.def.name}</strong>
                <span>{typeof d.actual === 'number' ? `${d.actual.toFixed(1)} ${d.def.unit}` : d.actual}</span>
                <em>{d.score.toFixed(1)}<small> /10</small></em>
                <span className="phone-detail__dim-bar"><span style={{ width: `${d.score * 10}%` }} /></span>
              </motion.section>
            ))}
          </div>
        </article>

        <aside className="phone-detail__spec glass-card">
          <h2>完整规格参数</h2>
          <p><span>上市时间</span><strong>{phone.releaseDate}</strong></p>
          <p><span>影像</span><strong>{phone.rearCamera}</strong></p>
          <p><span>屏幕</span><strong>{phone.screen} 英寸 {phone.ratio}</strong></p>
          <p><span>电池</span><strong>{phone.battery}</strong></p>
          <p><span>颜色</span><strong>{phone.color}</strong></p>
          <small>资料来源：官方规格页与新闻稿，仅供参考</small>
        </aside>
      </div>
    </div>
  );
}

function ScoreCircle({ value, label, tone }: { value: number; label: string; tone: 'blue' | 'green' }) {
  const deg = Math.min(360, Math.max(0, value * 36));
  const color = tone === 'green' ? '#7adba0' : 'var(--accent)';
  return (
    <div className="phone-detail__ring">
      <div className="phone-detail__ring-arc" style={{ background: `conic-gradient(${color} ${deg}deg, rgba(255, 255, 255, 0.06) ${deg}deg)` }}>
        <div className="phone-detail__ring-inner">
          <strong>{value.toFixed(1)}</strong>
          <span>/10</span>
        </div>
      </div>
      <p>{label}</p>
    </div>
  );
}
